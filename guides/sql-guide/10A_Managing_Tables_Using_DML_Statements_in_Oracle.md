## Lesson 10A – Managing Tables Using DML Statements in Oracle (or: how to change the data without regretting everything)

And look, reading data is safe. It’s like browsing a store: you can stare at products all day and nothing changes. **DML** is when you start rearranging shelves, throwing things out, and repainting the walls—except the “walls” are shared by everyone and the consequences are permanent unless you manage **transactions** correctly.

This lesson is about making changes on purpose and being able to undo them when you inevitably change the wrong thing.

You will learn to:

- Describe each **DML** statement: `INSERT`, `UPDATE`, `DELETE`, and (later) `MERGE`.
- Insert new rows into tables.
- Update and delete existing rows safely.
- Understand `TRUNCATE` vs `DELETE`.
- Control transactions with `COMMIT`, `ROLLBACK`, and `SAVEPOINT`.
- Use `SELECT ... FOR UPDATE` to lock rows while you’re editing them.

---

## 1. DML and Transactions: What’s at Stake

**DML (Data Manipulation Language)** statements:

- `INSERT` – add new rows.
- `UPDATE` – modify existing rows.
- `DELETE` – remove rows.
- `MERGE` – conditional insert/update/delete (you’ll meet this later).

A **transaction** is a set of DML statements that together form a **logical unit of work**, for example:

- Insert a new employee.
- Update their department’s headcount.
- Log the change in an audit table.

You either want **all** of that to succeed, or **none** of it. That’s what `COMMIT` and `ROLLBACK` are for.

---

## 2. INSERT – Getting New Rows into a Table

### 2.1 Basic `INSERT ... VALUES`

Best practice: **name the columns**, then provide matching values.

```sql
INSERT INTO departments (department_id, department_name, manager_id, location_id)
VALUES (70, 'Public Relations', 100, 1700);
```

Rules:

- The column list in parentheses defines the **target columns**.
- The `VALUES` list is **positional**: first value → first column, etc.
- Character and date literals need **single quotes** (`'Public Relations'`).
- Number literals do not (`100`, `1700`).

You can **omit** the column list *only* if you provide values for **every column** in the table, in the table’s default column order:

```sql
INSERT INTO departments
VALUES (80, 'Sales', 149, 2500);
```

This is legal but fragile—if a column is added or reordered, this breaks.

### 2.2 Inserting NULL values

Two ways to get `NULL` into a column:

- **Implicitly**: leave the column off the column list.

  ```sql
  INSERT INTO demo (id)
  VALUES (2);   -- name column becomes NULL
  ```

- **Explicitly**: use the `NULL` keyword.

  ```sql
  INSERT INTO departments (department_id, department_name, manager_id, location_id)
  VALUES (100, 'Finance', NULL, NULL);
  ```

Works as long as the column does **not** have a `NOT NULL` constraint.

### 2.3 Inserting dates and special values

Use date functions or `TO_DATE` to avoid ambiguity:

```sql
INSERT INTO employees (employee_id, last_name, hire_date, salary)
VALUES (300, 'Nguyen', CURRENT_DATE, 5000);

INSERT INTO employees (employee_id, last_name, hire_date, salary)
VALUES (301, 'Lee', TO_DATE('2016-02-01', 'YYYY-MM-DD'), 4500);
```

- `CURRENT_DATE` – evaluated from the session time zone.
- `SYSDATE` – evaluated at the database server.

### 2.4 INSERT with a subquery (`INSERT ... SELECT`)

You can insert **multiple rows at once** by selecting from another table.

```sql
INSERT INTO sales_reps (id, name, salary, commission_pct)
SELECT employee_id,
       last_name,
       salary,
       commission_pct
FROM   employees
WHERE  job_id = 'SA_REP';
```

- No `VALUES` clause here.
- The **target column list** in `sales_reps` must line up **positionally** and **by type** with the `SELECT` list.

---

## 3. UPDATE – Changing Existing Rows (Carefully)

`UPDATE` modifies existing rows. The dangers live mostly in the `WHERE` clause.

### 3.1 Basic UPDATE

```sql
UPDATE employees
SET    department_id = 50
WHERE  employee_id   = 113;
```

- Only employee 113 is moved to department 50.

If you **omit** the `WHERE` clause:

```sql
UPDATE employees
SET    department_id = 10;
```

- Every row in `employees` gets department 10.
- There’s an entire genre of “I forgot the WHERE clause” horror stories; don’t contribute to it.

### 3.2 Updating multiple columns

```sql
UPDATE employees
SET    salary   = 6000,
       job_id   = 'SA_REP'
WHERE  employee_id = 113;
```

You can even use subqueries to copy values from another row:

```sql
-- Make employee 103’s job and salary match employee 205
UPDATE employees
SET   (job_id, salary) = (
        SELECT job_id, salary
        FROM   employees
        WHERE  employee_id = 205
      )
WHERE employee_id = 103;
```

Be sure the subquery returns exactly **one row**.

---

## 4. DELETE and TRUNCATE – Removing Rows

### 4.1 DELETE

`DELETE` removes rows from a table.

```sql
DELETE FROM departments
WHERE  department_name = 'Finance';
```

- Removes only rows where the condition matches.

Without a `WHERE` clause:

```sql
DELETE FROM demo;
```

- Removes **all rows** from `demo`, but the table structure stays.
- Can be undone with `ROLLBACK` if you haven’t committed yet.

You can use subqueries to drive deletions:

```sql
DELETE FROM employees
WHERE  department_id IN (
         SELECT department_id
         FROM   departments
         WHERE  department_name LIKE 'Public%'
       );
```

### 4.2 TRUNCATE

`TRUNCATE` is like `DELETE` without a `WHERE` clause, but **more final** and much faster.

```sql
TRUNCATE TABLE demo;
```

- Removes **all rows**.
- Keeps the table structure.
- Is a **DDL** operation → it **auto‑commits**.
- **Cannot be rolled back**, even if you try.

Why use it?

- `DELETE` logs each row change (slow for large tables).
- `TRUNCATE` typically does not log each row, so it’s much faster—but permanent.

---

## 5. Transaction Control: COMMIT, ROLLBACK, SAVEPOINT

A transaction starts with the **first DML** after the last `COMMIT`/`ROLLBACK` and ends when you:

- Issue `COMMIT` – make all changes **permanent**.
- Issue `ROLLBACK` – undo all changes since the last commit.
- Execute a DDL or DCL statement (`CREATE`, `ALTER`, `DROP`, `TRUNCATE`, `GRANT`, `REVOKE`), which **auto‑commits**.
- Exit SQL Developer / SQL*Plus normally (commit) or crash (rollback).

### 5.1 COMMIT

```sql
INSERT INTO demo VALUES (1, 'Mickey');
INSERT INTO demo VALUES (2, 'Mary');
COMMIT;
```

Effects:

- Changes are now visible to **all sessions**.
- Locks are released.
- Savepoints (if any) are discarded.

### 5.2 ROLLBACK

```sql
INSERT INTO demo VALUES (3, 'Larry');
ROLLBACK;
```

Effects:

- Undoes all uncommitted changes back to the last commit.
- Data returns to its previous state.
- Locks from those changes are released.

Rollbacks have no effect on changes that have already been committed.

### 5.3 SAVEPOINT

`SAVEPOINT` lets you set intermediate markers **within** a transaction.

Example:

```sql
INSERT INTO demo VALUES (1, 'Mickey');
INSERT INTO demo VALUES (2, 'Mary');
SAVEPOINT before_mass_update;

UPDATE demo
SET    name = 'Bentley';   -- oops, too broad

ROLLBACK TO before_mass_update;
```

- Rows inserted before the savepoint remain part of the transaction.
- The mass `UPDATE` is undone.
- You can still `COMMIT` or `ROLLBACK` the whole transaction later.

Multiple savepoints are allowed, but rolling back to an **earlier** savepoint discards any savepoints set after it.

### 5.4 Implicit vs explicit transaction boundaries

Implicit commits happen when you execute:

- DDL: `CREATE`, `ALTER`, `DROP`, `TRUNCATE`, `RENAME`, `COMMENT`.
- DCL: `GRANT`, `REVOKE`.
- Normal session exit.

Implicit rollbacks happen when:

- The session crashes or disconnects abnormally.

Until you commit:

- Only your session sees its uncommitted changes.
- Affected rows are **locked** against conflicting writes from other sessions.

---

## 6. Row Locking and SELECT ... FOR UPDATE

Oracle uses **row‑level locking**:

- Readers don’t block readers.
- Readers don’t block writers.
- Writers block other writers on the **same rows**.

To explicitly lock rows **while you inspect them**, you can use:

```sql
SELECT *
FROM   demo
FOR UPDATE;
```

Effects:

- Locks the selected rows until you `COMMIT` or `ROLLBACK`.
- Another session trying to update those rows will block until your lock is released.

You can limit locking to certain columns/tables in joins:

```sql
SELECT e.employee_id,
       e.salary,
       d.department_name
FROM   employees e
JOIN   departments d
       ON e.department_id = d.department_id
FOR UPDATE OF e.salary;
```

- Only rows in `employees` (where `salary` resides) are locked.

### 6.1 FOR UPDATE with WAIT

If another session already holds a lock, your `FOR UPDATE` will wait indefinitely—unless you set a timeout:

```sql
SELECT *
FROM   demo
FOR UPDATE WAIT 5;
```

- Oracle waits up to 5 seconds to acquire the lock.
- If it can’t, you get an error like “resource busy, acquire with WAIT timeout expired”.

This prevents your session from hanging forever because someone went to lunch holding a lock.

### 6.2 LOCK TABLE

`LOCK TABLE` lets you explicitly lock one or more tables in a specific mode:

```sql
LOCK TABLE demo IN EXCLUSIVE MODE;
```

- Other sessions may be prevented from reading/writing depending on the lock mode.
- Locks are released on `COMMIT` or `ROLLBACK`.

Use this sparingly; row‑level locks are usually enough.

---

## 7. Read Consistency – What Other Sessions See

Oracle guarantees that queries see a **consistent snapshot** of data:

- Readers do **not** see uncommitted changes from other sessions.
- A session that updates a row sees its own changes immediately.

Example:

- Session A: `UPDATE employees SET salary = salary * 1.1 WHERE employee_id = 200;` (uncommitted).
- Session B: `SELECT salary FROM employees WHERE employee_id = 200;`

Session B sees the **old** salary until Session A commits. This avoids “partial” views of data mid‑transaction.

---

## 8. What You Should Now Be Able to Do

By the end of this lesson, you should be able to:

- Use `INSERT`, `UPDATE`, and `DELETE` to manipulate data safely.
- Use `TRUNCATE` when you truly mean “empty this table, quickly and permanently”.
- Group related changes into transactions and control them with `COMMIT`, `ROLLBACK`, and `SAVEPOINT`.
- Understand when changes become visible to other sessions and when locks are held.
- Use `SELECT ... FOR UPDATE` (with optional `WAIT`) to safely edit data without conflicting writers.

You’re now trusted not just to **read** from the database, but to **change** it—and more importantly, to back out your mistakes before everyone else sees them.
