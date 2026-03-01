## Lesson 20 – Manipulating Data Using Advanced Queries (or: how to break reality faster and more efficiently)

And look, basic `INSERT`, `UPDATE`, and `DELETE` are cute. They’re the training wheels of SQL. But at some point you stop gently adding rows and start doing things like loading three tables at once, rewriting history, and bringing dropped tables back from the dead like a mildly confused necromancer.

In this lesson you will:

- Use explicit `DEFAULT` values in `INSERT` and `UPDATE` statements.
- Describe the features of **multi-table inserts**.
- Use these types of multi-table inserts:
  - unconditional `INSERT ALL`
  - conditional `INSERT ALL`
  - conditional `INSERT FIRST`
  - pivoting inserts
- Merge rows in a table with `MERGE`.
- Perform **flashback** operations.
- Track changes made to data over a period of time.

---

## 1. Explicit DEFAULT Values in INSERT and UPDATE

And look, defaults in tables are like emergency snacks in your desk drawer: they’re great, but only if you actually use them on purpose.

Normally, a column’s default value only appears when you **omit** that column. With the `DEFAULT` keyword you can say, “no, seriously, use the default here.”

- You can use `DEFAULT` anywhere a normal value would go.
- If the column has a default defined, Oracle uses it.
- If it doesn’t, Oracle cheerfully gives you `NULL`.

**Example INSERT:**
```sql
INSERT INTO deptm3 (department_id, department_name, manager_id)
VALUES (300, 'Engineering', DEFAULT);
```

- `department_id` = 300
- `department_name` = 'Engineering'
- `manager_id` = its default, or `NULL` if there isn’t one

**Example UPDATE:**
```sql
UPDATE deptm3
SET    manager_id = DEFAULT
WHERE  department_id = 10;
```

If `manager_id` has no default in the table definition, this effectively sets it to `NULL`. So `DEFAULT` is either a well-defined rule or a very fancy way of writing “I dunno, make it empty.”

---

## 2. Multi-Table Inserts: One SELECT, Many Targets

Multi-table inserts are Oracle’s way of saying, “What if a single query could explode into several tables at once?” It’s very efficient and very dangerous if you weren’t paying attention.

They are heavily used in **data warehousing** to:

- Pull data from one or more source tables.
- Push it into several target tables in **one** DML statement.
- Avoid writing 14 separate `INSERT` statements or a procedural `IF/THEN` jungle.

You’ll see four flavors:

1. Unconditional `INSERT ALL`
2. Conditional `INSERT ALL`
3. Conditional `INSERT FIRST`
4. Pivoting inserts

### 2.1 Unconditional INSERT ALL (copy everything everywhere)

In the e‑commerce example, we have three customers—Tom, Dick, and Harry—each with their own order table. A single purchase row should be copied into **all three** tables.

This is an unconditional multi-table insert, also called `INSERT ALL`:

```sql
INSERT ALL
  INTO sal_history     (employee_id, hire_date, salary, manager_id)
  INTO mgr_history     (employee_id, hire_date, salary, manager_id)
SELECT employee_id, hire_date, salary, manager_id
FROM   employees
WHERE  employee_id > 200;
```

- If the `SELECT` returns 6 rows and there are 2 targets, you get **12** inserts.
- With 3 targets and 100 rows, you’d get **300** rows inserted.

Every target table gets **every** row. No conditions. No nuance. Pure duplication.

---

### 2.2 Conditional INSERT ALL (rows can hit multiple tables)

Now we add conditions. Each `INTO` clause can have a `WHEN` condition, which means a row may go into:

- zero tables,
- one table, or
- several tables.

**Pattern:**
```sql
INSERT ALL
  WHEN hire_date < DATE '2015-01-01' THEN
    INTO emp_history (emp_id, hire_date, salary)
    VALUES (empno, hdate, sal)
  WHEN commission_pct IS NOT NULL THEN
    INTO emp_sales (emp_id, salary, commission_pct)
    VALUES (empno, sal, comm)
SELECT employee_id    AS empno,
       hire_date      AS hdate,
       salary         AS sal,
       commission_pct AS comm
FROM   employees;
```

Key detail: **all matching conditions fire**.

- If an employee was hired before 2015 **and** has a commission, that row goes into **both** `emp_history` and `emp_sales`.
- In the demo, 25 source rows turned into 49 inserted rows, because some were inserted into multiple tables.

So `INSERT ALL` really means: “insert into **all** the tables whose conditions you match, possibly more than once.”

---

### 2.3 Conditional INSERT FIRST (each row finds exactly one home)

Now we change the rules: each row should pick **one** target, based on the first condition it satisfies.

That’s `INSERT FIRST`.

**Example:** bucket salaries into low, mid, and high tables:

```sql
INSERT FIRST
  WHEN salary < 5000 THEN
    INTO sal_low (employee_id, salary) VALUES (empno, sal)
  WHEN salary BETWEEN 5000 AND 10000 THEN
    INTO sal_mid (employee_id, salary) VALUES (empno, sal)
  ELSE
    INTO sal_high (employee_id, salary) VALUES (empno, sal)
SELECT employee_id AS empno,
       salary      AS sal
FROM   employees;
```

- Oracle checks the `WHEN` clauses **in order**.
- The first one that matches wins; the row goes only into that target.
- The demo’s `SELECT` returned 107 rows, and—this time—107 rows were inserted total.

This is basically salary sorting-hat logic: every row gets exactly one house.

---

### 2.4 Pivoting Inserts (columns → rows)

Now we get weird in a fun way: we take one row that has **many columns**, and turn it into **many rows** in the target.

Imagine a source table with weekly sales summarized per day:

```text
WEEK_ID  MON  TUE  WED  THU  FRI
-------  ---  ---  ---  ---  ---
    1    10   15   12   20   18
```

We want a target with **one row per day**:

```text
WEEK_ID  DAY_NAME  QTY_SOLD
-------  --------  --------
1        MON       10
1        TUE       15
...
```

**Pivoting insert:**
```sql
INSERT ALL
  INTO emp_sales_info (week_id, day_name, qty_sold)
    VALUES (week_id, 'MON', mon)
  INTO emp_sales_info (week_id, day_name, qty_sold)
    VALUES (week_id, 'TUE', tue)
  INTO emp_sales_info (week_id, day_name, qty_sold)
    VALUES (week_id, 'WED', wed)
  INTO emp_sales_info (week_id, day_name, qty_sold)
    VALUES (week_id, 'THU', thu)
  INTO emp_sales_info (week_id, day_name, qty_sold)
    VALUES (week_id, 'FRI', fri)
SELECT week_id,
       mon, tue, wed, thu, fri
FROM   sales_week_data;
```

- One input row becomes **five** output rows.
- Now aggregations like “total sales per week” become easy:

```sql
SELECT week_id,
       SUM(qty_sold) AS week_total
FROM   emp_sales_info
GROUP  BY week_id;
```

This is Oracle politely fixing a non-normalized design while pretending nothing is wrong.

---

## 3. MERGE: Conditional Update / Insert / Delete (Upsert on steroids)

The `MERGE` statement is what you use when you’re tired of writing “check if it exists, then update, otherwise insert” logic in three different places.

- If a row **matches** (based on a join condition), you can `UPDATE` it (and optionally `DELETE` it).
- If it **doesn’t match**, you can `INSERT` it.

**Pattern:**
```sql
MERGE INTO emp_hist h
USING employees e
ON (h.employee_id = e.employee_id)
WHEN MATCHED THEN
  UPDATE SET
    h.first_name = e.first_name,
    h.last_name  = e.last_name,
    h.email      = e.email
WHEN NOT MATCHED THEN
  INSERT (employee_id, first_name, last_name, email)
  VALUES (e.employee_id, e.first_name, e.last_name, e.email);
```

In the demo:

- `EMP_HIST` already had 107 employees but with some missing/old data.
- They manually broke some rows (e.g., mangled Jennifer Whalen’s email, removed Eleni Zlotkey).
- Running `MERGE`:
  - **Updated** existing rows to match `employees`.
  - **Inserted** missing rows like Eleni.
  - Reported “107 rows merged,” syncing history with the current truth.

You can also add a `DELETE` clause inside `WHEN MATCHED` to remove rows matching some condition (e.g., anyone with a commission), turning `MERGE` into the DML equivalent of “fix this table or get rid of it.”

---

## 4. Flashback Table: Undo for Grown-Ups

And look, everyone eventually drops the wrong table. Oracle’s flashback features exist because that moment should be embarrassing, not career-ending.

`FLASHBACK TABLE` lets you:

- Recover a **dropped** table from the Recycle Bin.
- Restore a table to a previous **point in time** or **SCN**.
- Bring back data, indexes, and constraints in one go.

**Example: recovering a dropped table**
```sql
-- Table is created
CREATE TABLE emp2 AS SELECT * FROM employees WHERE 1 = 0;

-- Table is dropped (it goes to the Recycle Bin)
DROP TABLE emp2;

-- Recover it
FLASHBACK TABLE emp2 TO BEFORE DROP;
```

After flashback:

- The table structure (and data, if it had any) is back.
- The Recycle Bin entry disappears.

This is essentially “Control+Z for tables,” as long as you didn’t purge the bin.

---

## 5. Tracking Data Changes Over Time

Sometimes you don’t want to *revert* the table; you just want to **peek into the past** and see how bad your decisions were.

Oracle can show you previous committed versions of a row using undo data, as long as that undo hasn’t been overwritten.

### 5.1 Row version history with VERSIONS BETWEEN

In the demo, they kept changing Steven King’s salary:

- 24000 → 1 → 10 → back to 24000.

Then they queried the history:

```sql
SELECT
  VERSIONS_STARTTIME AS start_time,
  VERSIONS_ENDTIME   AS end_time,
  salary
FROM   employees
VERSIONS BETWEEN SCN MINVALUE AND MAXVALUE
WHERE  employee_id = 100;
```

This shows:

- Each salary value.
- When it became valid.
- When it stopped being valid (current version has no end time).

It’s like a security camera for row values.

### 5.2 Time-based flashback with AS OF

You can also query “what did this row look like N minutes ago?” using `AS OF` and `INTERVAL`:

```sql
SELECT salary
FROM   employees3
AS OF TIMESTAMP (SYSTIMESTAMP - INTERVAL '1' MINUTE)
WHERE  last_name = 'Chung';
```

As long as the undo for that time window still exists, you can:

- See the previous salary.
- Compare old vs. new values.
- Prove, with receipts, that someone really did set a salary to 1.

---

## 6. What You Should Now Be Able to Do

By the end of this lesson, you should be able to:

- Specify explicit default values in `INSERT` and `UPDATE` statements using `DEFAULT`.
- Describe how multi-table inserts work and when to use them.
- Use:
  - unconditional `INSERT ALL`,
  - conditional `INSERT ALL`,
  - conditional `INSERT FIRST`, and
  - pivoting inserts.
- Use `MERGE` to conditionally update, insert, and optionally delete rows.
- Perform flashback operations to recover tables or restore them to earlier states.
- Track changes made to data over time using row version queries and time-based flashback.

And if all of this feels like a ridiculous amount of power, that’s because it is. You can now duplicate data across multiple tables, rewrite history, and resurrect dropped objects—so please, use these features more responsibly than the demo script that set Steven King’s salary to $1 on purpose.
