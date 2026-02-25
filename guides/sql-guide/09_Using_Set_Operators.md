## Lesson 9 – Using Set Operators (or: when one result set just isn’t enough)

And look, sometimes one query is not the problem—the problem is that you have **two** (or more) queries and HR wants “everything from both, but without duplicates, except when they do want duplicates, and also what’s common between them, and by the way who’s missing?”. That entire mood is handled by **set operators**.

This lesson is about treating query results like sets and doing union/intersect/minus operations on them.

You will learn to:

- Describe the main SQL set operators.
- Combine multiple `SELECT` queries into a single result set.
- Understand when duplicates are removed vs preserved.
- Control ordering of the combined result.

---

## 1. Set Operator Types

The ANSI/Oracle set operators:

- `UNION` – combine results, **remove duplicates**.
- `UNION ALL` – combine results, **keep duplicates**.
- `INTERSECT` – rows common to **both** queries.
- `MINUS` (Oracle) / `EXCEPT` (ANSI) – rows in **first** query that are **not** in the second.

They operate on the **results** of `SELECT` statements, not on tables directly.

### 1.1 Rules and guidelines

When using set operators:

- Each component `SELECT` must return the **same number of columns**.
- Corresponding columns must have **compatible data types** and are matched **positionally**.
- Column names in the final result come from the **first** `SELECT`.
- By default, Oracle sorts the combined result in ascending order by the **first column** for `UNION`, `INTERSECT`, and `MINUS`.
- `UNION ALL` does **not** sort by default.
- An `ORDER BY` clause may appear **only once**, at the very end of the compound query.
- `ORDER BY` can use column names or positions **from the first SELECT only**.

Parentheses can be used when you have more than two `SELECT`s to control evaluation order—but most of the time, it’s simply left‑to‑right.

---

## 2. UNION vs UNION ALL

### 2.1 Simple numeric example

```sql
-- UNION
SELECT 2 AS val FROM dual
UNION
SELECT 1 FROM dual;
-- Result: 1, 2 (sorted, distinct)

-- UNION (duplicates)
SELECT 2 AS val FROM dual
UNION
SELECT 2 FROM dual;
-- Result: 2 (duplicates removed)

-- UNION ALL
SELECT 2 AS val FROM dual
UNION ALL
SELECT 2 FROM dual;
-- Result: 2, 2 (duplicates preserved)
```

So:

- `UNION` = set union, distinct values, sorted.
- `UNION ALL` = multiset union, all rows, unsorted unless you add `ORDER BY`.

### 2.2 Combining real tables: current and retired employees

Imagine two tables:

- `employees` – current employees
- `retired_employees` – past employees

To list **all distinct jobs** ever held:

```sql
SELECT job_id
FROM   employees
UNION
SELECT job_id
FROM   retired_employees;
```

- If `SA_REP` exists in both tables, it appears **once**.

To list **all occurrences** of job/department pairs, including duplicates:

```sql
SELECT job_id, department_id
FROM   employees
UNION ALL
SELECT job_id, department_id
FROM   retired_employees;
```

- Here, if both tables have a `SA_REP` in department 80, both rows appear.

---

## 3. INTERSECT – Only What’s in Both Sets

`INTERSECT` returns rows that appear in **both** query results.

Example – managers who appear in both current and retired data:

```sql
SELECT manager_id,
       department_id
FROM   employees
INTERSECT
SELECT manager_id,
       department_id
FROM   retired_employees;
```

This might reveal, for example, that manager `149` has managed department `80` in both the current and retired datasets.

Another nice use case: employees who currently hold a job they **used** to have (using `job_history`):

```sql
SELECT employee_id,
       job_id
FROM   employees
INTERSECT
SELECT employee_id,
       job_id
FROM   job_history;
```

- If an employee’s `(employee_id, job_id)` pair appears in both, it means they’re currently in a job they previously held.

From there you can drill into `job_history` to see when they held those jobs before.

---

## 4. MINUS – First Minus Second (Oracle)

`MINUS` returns all distinct rows from the **first** query that are **not** returned by the second.

Example – employees who have **never** changed jobs:

- `job_history` contains employees who **have** changed jobs.

```sql
SELECT employee_id
FROM   employees
MINUS
SELECT employee_id
FROM   job_history;
```

- The result is the set of `employee_id`s that appear in `employees` but not in `job_history`.
- Those employees have never had a job change recorded.

Another example – managers who have **never** managed retired sales employees:

```sql
-- Current managers in sales (dept 80)
SELECT DISTINCT manager_id
FROM   employees
WHERE  department_id = 80

MINUS

-- Managers of retired sales staff
SELECT DISTINCT manager_id
FROM   retired_employees
WHERE  department_id = 80;
```

`MINUS` removes the second set from the first, leaving only “never managed retired sales people” managers.

> Note: Standard ANSI uses `EXCEPT` where Oracle uses `MINUS`.

---

## 5. Matching SELECT Statements: Columns and Types

Set operators are picky about the **shape** of the queries they combine.

### 5.1 Same number of columns

This will fail:

```sql
SELECT last_name, salary
FROM   employees
UNION
SELECT department_name
FROM   departments;
-- ERROR: different number of columns
```

You must match the column count:

```sql
SELECT last_name, salary
FROM   employees
UNION
SELECT department_name, department_id
FROM   departments;
```

### 5.2 Compatible data types and positions

Columns are matched **by position**, not by name.

If you write:

```sql
SELECT last_name, salary
FROM   employees
UNION
SELECT department_id, department_name
FROM   departments;
```

You are trying to union `last_name` (character) with `department_id` (number) in position 1, and `salary` (number) with `department_name` (character) in position 2—type mismatch.

One fix is to reorder and convert as needed, e.g.:

```sql
SELECT last_name,       TO_CHAR(salary) AS val
FROM   employees
UNION
SELECT department_name, TO_CHAR(department_id) AS val
FROM   departments;
```

Standard tricks:

- Use `TO_CHAR(NULL)` or `TO_DATE(NULL)` to create placeholder columns when a table is missing a column.
- In MySQL, use `CAST(NULL AS CHAR(n))`, etc.

Example – combining department and location data:

```sql
SELECT location_id,
       department_name,
       TO_CHAR(NULL) AS warehouse_location
FROM   departments

UNION

SELECT location_id,
       TO_CHAR(NULL) AS department_name,
       state_province AS warehouse_location
FROM   locations;
```

Result columns:

- `location_id` (from first query)
- `department_name` (placeholder or actual)
- `warehouse_location` (department or state/province)

---

## 6. ORDER BY with Set Operators

Key rules for ordering compound queries:

- `ORDER BY` appears **once**, at the **end** of the entire compound statement.
- It can only reference columns (or aliases) from the **first SELECT**.
- You can use **position numbers** (e.g., `ORDER BY 2`).

Example:

```sql
SELECT employee_id,
       job_id
FROM   employees

UNION

SELECT employee_id,
       job_id
FROM   retired_employees

ORDER  BY 2;   -- sort by job_id
```

In MySQL, the same pattern applies: one `ORDER BY` at the end; it orders the overall union.

Remember:

- `UNION`, `INTERSECT`, and `MINUS` will by default return results ordered by the first column even **without** an `ORDER BY` in Oracle.
- `UNION ALL` preserves the natural order of its component queries unless you explicitly sort.

If you need a specific cross‑query order that doesn’t match the default, use a final `ORDER BY` and, if necessary, synthetic sort columns (e.g., constants 1, 2, 3 in each branch) to control group ordering.

---

## 7. MySQL Notes

In MySQL:

- `UNION` and `UNION ALL` behave as in Oracle (distinct vs all rows).
- MySQL uses `INTERSECT` / `EXCEPT` only in newer versions; historically you used `INNER JOIN` or `NOT IN`/`NOT EXISTS` patterns instead.
- Type matching rules still apply—use `CAST` to align types when necessary.

Example type alignment with `CAST`:

```sql
SELECT location_id,
       department_name,
       CAST(NULL AS CHAR(30)) AS warehouse_location
FROM   departments

UNION

SELECT location_id,
       CAST(NULL AS CHAR(30)) AS department_name,
       state_province         AS warehouse_location
FROM   locations;
```

---

## 8. What You Should Now Be Able to Do

By the end of this lesson, you should be able to:

- Use `UNION` to combine query results and eliminate duplicates.
- Use `UNION ALL` when you want every row, including duplicates.
- Use `INTERSECT` to find rows common to multiple datasets.
- Use `MINUS` (or `EXCEPT`) to find rows present in the first result but not the second.
- Ensure matching column counts and compatible data types across all component queries.
- Apply `ORDER BY` correctly at the end of the compound statement to control final row order.

You can now answer questions like “who’s ever had this job, past or present?”, “who still has a job they used to have?”, and “who has never changed jobs?”—which is exactly the kind of information HR loves and employees do not.
