## Lesson 14 – Creating Views (or: giving your queries reusable disguises)

And look, sometimes you want people to see *some* of a table, but not **all** of it. Or you’re tired of rewriting the same five‑table join every time you need a report. This is exactly why **views** exist: they give you canned, reusable SELECTs that make ugly queries look civilized and sensitive columns mysteriously disappear.

This lesson is about defining, using, and inspecting **views**.

You will learn to:

- Explain what views are and why they exist.
- Create simple and complex views.
- Retrieve and (when allowed) modify data through views.
- Control DML with `WITH CHECK OPTION` and `WITH READ ONLY`.
- Query data dictionary views to see how views are defined.

---

## 1. What Is a View?

A **view** is a **schema object** defined by a query:

- It logically represents a **subset** or **reformatted view** of data from one or more tables.
- It stores **no data** of its own (in standard views); the data lives in the base tables.
- When you query a view, Oracle transparently runs the underlying query.

Use views to:

- Restrict which columns or rows users can see (hide salaries, SSNs, etc.).
- Hide complex joins behind a friendly name.
- Present data in a different shape (e.g., annual salary instead of monthly).
- Provide a layer of indirection so underlying table structures can evolve.

Think of a view as a stored `SELECT` that masquerades as a table.

---

## 2. Simple vs Complex Views

### 2.1 Simple views

- Based on **a single table**.
- Do not contain **group functions**, `GROUP BY`, `DISTINCT`, or complex expressions.
- Often allow **INSERT**, **UPDATE**, and **DELETE** operations (within rules).

Example:

```sql
CREATE VIEW emp_basic AS
SELECT employee_id,
       last_name,
       department_id
FROM   employees;
```

### 2.2 Complex views

- Based on **multiple tables** or contain:
  - Group functions (`SUM`, `AVG`, etc.).
  - `GROUP BY`.
  - `DISTINCT`.
  - Expressions and joins.
- Generally **restricted** or **disallowed** for DML.

Example:

```sql
CREATE VIEW dept_sal_summary AS
SELECT d.department_id,
       d.department_name,
       MIN(e.salary) AS min_sal,
       MAX(e.salary) AS max_sal,
       AVG(e.salary) AS avg_sal
FROM   employees e
JOIN   departments d
       ON e.department_id = d.department_id
GROUP  BY d.department_id, d.department_name;
```

Querying is fine; trying to `INSERT` into this view is not.

---

## 3. Creating and Modifying Views

### 3.1 CREATE VIEW

Basic syntax:

```sql
CREATE VIEW view_name AS
SELECT ...
FROM   ...
WHERE  ...;
```

Example – convert monthly salaries to annual salaries:

```sql
CREATE VIEW emp_sal_view AS
SELECT employee_id,
       last_name,
       department_id,
       salary * 12 AS ann_sal
FROM   employees;
```

Querying the view:

```sql
SELECT *
FROM   emp_sal_view;
```

Returns the underlying data from `employees`, with `ann_sal` as a calculated column.

### 3.2 CREATE OR REPLACE VIEW

To change a view’s definition **without** dropping it (and losing its grants), use `OR REPLACE`:

```sql
CREATE OR REPLACE VIEW emp_sal_view AS
SELECT employee_id,
       last_name,
       department_id,
       salary * 12 AS ann_sal
FROM   employees
WHERE  department_id IN (10, 90);
```

- Existing privileges on the view are preserved.
- Next time users query it, they see the new definition.

### 3.3 Naming columns via aliases

You can name view columns in two ways:

**Inline aliases in the SELECT**:

```sql
CREATE VIEW salvu50 AS
SELECT employee_id     AS id_number,
       last_name       AS name,
       salary * 12     AS ann_salary
FROM   employees
WHERE  department_id = 50;
```

**Column list in CREATE VIEW**:

```sql
CREATE OR REPLACE VIEW empvu80 (employee_id, last_name, salary) AS
SELECT employee_id,
       last_name,
       salary
FROM   employees
WHERE  department_id = 80;
```

- Column list in parentheses must match the number and order of columns in the `SELECT`.

---

## 4. DML Through Views – What’s Allowed?

You can often perform `INSERT`, `UPDATE`, and `DELETE` through **simple** views, but there are important restrictions.

In general, you **cannot**:

- `DELETE` from a view if it contains:
  - Group functions
  - `GROUP BY`
  - `DISTINCT`
  - `ROWNUM`

- `UPDATE` through a view if it includes:
  - Group functions
  - `GROUP BY`
  - `DISTINCT`
  - `ROWNUM`
  - Expressions (calculated columns like `salary * 12`)

- `INSERT` through a view if it includes:
  - Group functions
  - `GROUP BY`
  - `DISTINCT`
  - `ROWNUM`
  - Expression‑based columns
  - **NOT NULL** columns from the base table that are **not** exposed in the view and have no default in the base table

Example – why you can’t update a calculated column:

```sql
CREATE VIEW emp_sal_view AS
SELECT employee_id,
       last_name,
       department_id,
       salary * 12 AS ann_sal
FROM   employees;

UPDATE emp_sal_view
SET    ann_sal = 100000
WHERE  department_id = 90;
-- ERROR: cannot modify a virtual (derived) column
```

Because `ANN_SAL` doesn’t exist as a real column in `EMPLOYEES`, Oracle can’t map that change back.

Updating a real column via the view, however, is fine (subject to constraints and triggers):

```sql
UPDATE emp_sal_view
SET    department_id = 10
WHERE  last_name = 'Kochhar';
```

The change applies to `EMPLOYEES.DEPARTMENT_ID`.

---

## 5. WITH CHECK OPTION – Preventing “Domain Escapes”

Sometimes you want to allow DML through a view, but only when the **resulting row** still satisfies the view’s defining `WHERE` clause.

`WITH CHECK OPTION` enforces this.

Example – view limited to departments 10 and 90:

```sql
CREATE OR REPLACE VIEW emp_dept_10_90 AS
SELECT employee_id,
       last_name,
       department_id
FROM   employees
WHERE  department_id IN (10, 90)
WITH CHECK OPTION;
```

What this does:

- You can **update** rows via the view, **but only** if after the update `department_id` is still 10 or 90.

Attempting:

```sql
UPDATE emp_dept_10_90
SET    department_id = 20
WHERE  last_name = 'Kochhar';
```

Results in:

> ORA-01402: view WITH CHECK OPTION where-clause violation

But changing from 90 to 10 **is** allowed, because both values satisfy the `IN (10, 90)` condition.

You can name the constraint:

```sql
... WITH CHECK OPTION CONSTRAINT emp_dept_10_90_chk;
```

Useful for tracking violations in error messages.

---

## 6. WITH READ ONLY – Locking Views Against DML

If you want a view to be **purely read‑only**, regardless of whether the underlying tables would allow DML, add `WITH READ ONLY`:

```sql
CREATE OR REPLACE VIEW empvu10 AS
SELECT employee_id,
       last_name,
       department_id
FROM   employees
WHERE  department_id = 10
WITH READ ONLY;
```

Any attempt to `INSERT`, `UPDATE`, or `DELETE` through `EMPVU10` results in an error.

This is handy for:

- Reporting views used by many users.
- Views that combine multiple tables or contain logic you don’t want people accidentally “writing through.”

---

## 7. Inspecting Views via the Data Dictionary

To see what views you own and how they’re defined, use `USER_VIEWS`:

```sql
SELECT view_name,
       text
FROM   user_views
WHERE  view_name = 'EMP_SAL_VIEW';
```

- `VIEW_NAME` – the view’s name (upper case by default).
- `TEXT` – the `SELECT` statement that defines the view.

For views you can access (not just own), use `ALL_VIEWS`. DBAs can use `DBA_VIEWS` to see everything.

You can also use `USER_OBJECTS` to see views alongside tables and indexes:

```sql
SELECT object_name,
       object_type,
       status
FROM   user_objects
WHERE  object_type = 'VIEW';
```

---

## 8. Dropping Views

To remove a view definition:

```sql
DROP VIEW emp_sal_view;
```

- This **does not** drop or modify the underlying base tables.
- Dependent privileges on the view are removed.

If you drop a view that other code depends on, that code may become invalid until you recreate the view.

---

## 9. What You Should Now Be Able to Do

By the end of this lesson, you should be able to:

- Define what a view is and why you’d use one.
- Create simple views over a single table and complex views involving joins and aggregations.
- Understand which DML operations are allowed through a view and why calculated/aggregated columns can’t be updated directly.
- Use `WITH CHECK OPTION` to keep view‑based updates within the view’s logical domain.
- Use `WITH READ ONLY` to prevent all DML through a view.
- Use `USER_VIEWS` and related dictionary views to inspect how views are defined.

You now have a way to hide complexity, hide sensitive data, and mildly confuse anyone who insists on thinking of views as “just tables”—which, to be fair, is exactly how they’re supposed to feel from the outside.
