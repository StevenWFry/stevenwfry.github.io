## Lesson 7 – Displaying Data from Multiple Tables Using JOINs (or: persuading your tables to talk to each other)

And look, normalized databases are great for design and terrible for reporting. All the interesting information is split across five different tables—employees here, departments there, jobs somewhere else—so a simple question like “who does what, where?” suddenly requires **joins**.

This lesson is about teaching your `SELECT` statements to navigate that mess.

You will learn to:

- Write `SELECT` statements that join data from multiple tables.
- Use **equijoins** and **nonequijoins**.
- Join a table to itself using a **self‑join**.
- Use **INNER** and **OUTER** joins (LEFT, RIGHT, FULL).
- Recognize and (mostly) avoid **Cartesian products** via `CROSS JOIN`.

---

## 1. Why JOIN at All?

Because the database is **normalized**:

- `EMPLOYEES` has `employee_id`, `last_name`, `job_id`, `department_id`, `manager_id`, etc.
- `JOBS` has `job_id`, `job_title`, min/max salary.
- `DEPARTMENTS` has `department_id`, `department_name`, `location_id`.
- `LOCATIONS` has `location_id`, `city`, `country_id`.

To answer questions like “list all employees with their job titles and department names”, you must **join tables** on related columns, typically **primary key ↔ foreign key** pairs:

- `employees.job_id` ↔ `jobs.job_id`
- `employees.department_id` ↔ `departments.department_id`

Joins recombine normalized pieces into a single result set.

---

## 2. ANSI JOIN Types Overview

Oracle and MySQL both support ANSI join syntax, including:

- `INNER JOIN` – only rows that satisfy the join condition.
- `LEFT [OUTER] JOIN` – all rows from the left table, plus matches on the right.
- `RIGHT [OUTER] JOIN` – all rows from the right table, plus matches on the left.
- `FULL [OUTER] JOIN` (Oracle only) – all rows from both tables (matches and non‑matches).
- `CROSS JOIN` – Cartesian product (every row with every row).
- `NATURAL JOIN` – joins on all columns with the same name and type.
- `JOIN ... USING (column_list)` – join on specific shared column names.
- `JOIN ... ON condition` – explicitly specify the join condition.

The **ON** and **USING** forms are what you’ll rely on the most; `NATURAL JOIN` is convenient but can be dangerously magical.

---

## 3. INNER JOIN with ON – The Workhorse

Standard pattern:

```sql
SELECT e.last_name,
       d.department_name
FROM   employees  e
JOIN   departments d
       ON e.department_id = d.department_id;
```

Key points:

- This is an **INNER JOIN**: rows are returned **only** where `e.department_id = d.department_id`.
- If an employee’s `department_id` is `NULL` or doesn’t match any row in `DEPARTMENTS`, that employee is **excluded**.

You can include the `INNER` keyword explicitly:

```sql
SELECT e.last_name,
       d.department_name
FROM   employees  e
INNER JOIN departments d
        ON e.department_id = d.department_id;
```

Same result, just more explicit.

### 3.1 Table aliases and ambiguous columns

When both tables have a column with the same name (e.g., `department_id`), you must **qualify** it:

```sql
SELECT department_id
FROM   employees, departments;
-- ERROR: column ambiguously defined
```

Fix with table (or alias) prefixes:

```sql
SELECT e.department_id,
       d.department_id
FROM   employees  e
JOIN   departments d
       ON e.department_id = d.department_id;
```

Use **meaningful aliases** (`e`, `emp`, `d`, `dept`) so your future self can understand the join.

Note: in Oracle, you may **not** use `AS` for table aliases:

```sql
FROM employees AS e   -- invalid in Oracle
FROM employees e      -- valid
```

---

## 4. USING and NATURAL JOIN – Shortcuts with Caveats

### 4.1 JOIN ... USING

If both tables have a column with the **same name** and compatible type, you can use `USING`:

```sql
SELECT last_name,
       department_name,
       department_id
FROM   employees  e
JOIN   departments d
       USING (department_id);
```

Rules:

- `USING (department_id)` is shorthand for `ON e.department_id = d.department_id`.
- When selecting `department_id` in this case:
  - Do **not** qualify it with a table alias: `department_id` is fine.
  - `e.department_id` or `d.department_id` in the `SELECT` will cause:  
    `ORA-25154: column part of USING clause cannot have qualifier`.

### 4.2 NATURAL JOIN

`NATURAL JOIN` automatically joins on **all columns** that:

- Have the same name in both tables, and
- Have compatible data types.

Example:

```sql
SELECT last_name,
       department_name
FROM   employees
NATURAL JOIN departments;
```

Behind the scenes, Oracle looks for **all** identically named columns (e.g., `department_id`, `manager_id`) and joins on all of them. So if both tables share `department_id` and `manager_id`, you’re effectively doing:

```sql
... JOIN ... USING (department_id, manager_id)
```

This can dramatically reduce the number of rows returned compared to a join on just one column.

**Caution:** NATURAL JOIN is convenient but fragile:

- If someone later adds another identically named column, your join behavior changes.
- If columns share a name but not type, you get an error.

Use it sparingly and only when you truly control the schema.

---

## 5. Joining More Than Two Tables

You can keep adding joins as long as the relationships make sense.

Example – employees, departments, and locations:

```sql
SELECT e.last_name,
       d.department_name,
       l.city
FROM   employees  e
JOIN   departments d
       ON e.department_id = d.department_id
JOIN   locations  l
       ON d.location_id = l.location_id;
```

Here:

- First join employees ↔ departments by `department_id`.
- Then join departments ↔ locations by `location_id`.

You can keep going for as many tables as your query (and your brain) can handle.

Conditions unrelated to the joins can go either in the `ON` clauses or in a trailing `WHERE`:

```sql
SELECT e.last_name,
       d.department_name
FROM   employees  e
JOIN   departments d
       ON e.department_id = d.department_id
WHERE  e.manager_id = 149;
```

or:

```sql
... JOIN departments d
     ON e.department_id = d.department_id
    AND e.manager_id = 149;
```

Both are valid; the key is to keep the **join condition** clear and separate from **filter conditions**.

---

## 6. Self-Joins – When a Table Is Its Own Boss

Sometimes the relationship you care about is entirely **inside one table**. Classic example: employees and their managers.

- `EMPLOYEES.employee_id` uniquely identifies an employee.
- `EMPLOYEES.manager_id` references another employee’s `employee_id`.

To pair each employee with their manager’s last name, you join the table to **itself**:

```sql
SELECT e.last_name AS emp,
       m.last_name AS mgr
FROM   employees e
JOIN   employees m
       ON e.manager_id = m.employee_id;
```

- `e` = worker alias.
- `m` = manager alias.
- `e.manager_id` ↔ `m.employee_id`.

This is a **self-join**, and it’s how you turn a single table into a hierarchy (or at least an org chart).

---

## 7. Nonequijoins – When the Join Condition Is a Range

Not all relationships are equality-based. Sometimes you have **ranges**.

Example: `JOB_GRADES` table:

```text
GRADE_LEVEL  LOWEST_SAL  HIGHEST_SAL
-----------  ----------  ----------
A            1000        2999
B            3000        5999
C            6000        9999
D            10000       14999
E            15000       24999
```

You want to assign each employee a grade based on their `salary`.

Nonequijoin:

```sql
SELECT e.last_name,
       e.salary,
       g.grade_level
FROM   employees   e
JOIN   job_grades  g
       ON e.salary BETWEEN g.lowest_sal AND g.highest_sal;
```

This is called a **nonequijoin** because the join condition uses `BETWEEN` (a range) instead of `=`.

---

## 8. OUTER JOINs – Bringing Back the Lonely Rows

`INNER JOIN` only returns rows that have a match on both sides. OUTER JOINs return matched rows **plus** the unmatched rows from one or both tables.

### 8.1 LEFT OUTER JOIN

All rows from the **left** table, and matching rows from the right; unmatched right‑side columns are `NULL`.

Example – all employees, even those without a department:

```sql
SELECT e.last_name,
       d.department_name
FROM   employees  e
LEFT  JOIN departments d
       ON e.department_id = d.department_id;
```

- You get **all 107 employees**, including the one with no `department_id`.
- For that employee, `department_name` is `NULL`.

### 8.2 RIGHT OUTER JOIN

All rows from the **right** table, and matching rows from the left.

```sql
SELECT e.last_name,
       d.department_name
FROM   employees  e
RIGHT JOIN departments d
       ON e.department_id = d.department_id;
```

- You see every department, including those with **no employees**.
- Employee columns are `NULL` where there’s no match.

### 8.3 FULL OUTER JOIN (Oracle only)

All rows from **both** tables:

- Matched pairs.
- Left‑only rows.
- Right‑only rows.

```sql
SELECT e.last_name,
       d.department_name
FROM   employees  e
FULL  JOIN departments d
       ON e.department_id = d.department_id;
```

This shows:

- Employees with and without departments.
- Departments with and without employees.

MySQL does **not** support `FULL OUTER JOIN` directly; you emulate it with `UNION` of left and right joins.

---

## 9. CROSS JOIN / Cartesian Product – The “Everything with Everything” Join

A `CROSS JOIN` (or an `INNER JOIN` without a condition) produces the **Cartesian product**:

```sql
SELECT e.last_name,
       d.department_name
FROM   employees  e
CROSS JOIN departments d;
```

If there are:

- 107 employees
- 28 departments

You get 107 × 28 = 2,996 rows.

The first 107 rows might show every employee “working” in department 10, the next 107 in department 20, and so on. This is rarely what you actually want, but it’s excellent at stress-testing your client tool.

Conceptually, a forgotten join condition with `FROM employees e, departments d` and a filterless `WHERE` clause can accidentally create the same cartesian product. Treat that as a smell.

---

## 10. MySQL Notes

All of the ANSI join patterns you’ve seen apply to MySQL too:

- `INNER JOIN`, `LEFT JOIN`, `RIGHT JOIN`, `CROSS JOIN`.
- `JOIN ... USING(column_list)` and `JOIN ... ON condition`.
- `NATURAL JOIN` is supported but carries the same “magical join columns you didn’t ask for” risk.

MySQL **does not** support `FULL OUTER JOIN` directly; use `LEFT JOIN ... UNION ... RIGHT JOIN` minus the intersection if needed.

---

## 11. What You Should Now Be Able to Do

By the end of this lesson, you should be able to:

- Write `SELECT` statements that join multiple tables using equijoins (`ON` / `USING`).
- Explain and use `NATURAL JOIN`, `USING`, and `ON` appropriately.
- Join a table to itself using a self‑join for hierarchical relationships.
- Use nonequijoins for range‑based relationships like salary grades.
- Use `LEFT`, `RIGHT`, and `FULL` OUTER JOINs to include unmatched rows.
- Recognize and intentionally (or very cautiously) generate Cartesian products with `CROSS JOIN`.

You can now ask questions that span **employees + jobs + departments + locations**, which is exactly the point where people start calling your queries “the reporting layer”.
