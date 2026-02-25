## Lesson 10B – Managing Tables Using DML Statements in MySQL (or: changing data on a server you don’t technically own)

And look, reading from a MySQL database is harmless. Writing to it is where lawyers and auditors start to pay attention. When you `INSERT`, `UPDATE`, or `DELETE`, you’re changing data for **every** application that uses that database, so it’s worth knowing exactly how to do it—and how to undo it.

This lesson focuses on **MySQL** DML and transactions.

You will learn to:

- Describe each DML statement: `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`.
- Insert new rows (single and multi‑row) safely.
- Update and delete rows, including using subqueries.
- Group changes into transactions with `START TRANSACTION`, `COMMIT`, `ROLLBACK`, and `SAVEPOINT`.
- Understand how MySQL handles reads and locks with `FOR UPDATE`.

---

## 1. DML in MySQL and What a Transaction Is

**DML (Data Manipulation Language)** in MySQL:

- `INSERT` – add rows.
- `UPDATE` – change data in existing rows.
- `DELETE` – remove rows.

Each of these can participate in a **transaction**—a series of statements that should succeed or fail **as a unit**.

Examples of single transactions:

- Move an employee to a "retired" table, then delete them from `employees`.
- Insert a department, then insert its initial employees.

In a healthy world, you either **do all the steps** or **do none of them**.

By default, MySQL runs with **autocommit ON**, meaning each successful DML statement is committed immediately as its own transaction. You can turn that off or explicitly start a multi‑statement transaction when you want more control.

---

## 2. INSERT – Adding New Rows

### 2.1 Basic multi‑row INSERT with VALUES

MySQL lets you insert one or **many** rows in a single `INSERT`:

```sql
INSERT INTO departments (department_id, department_name, manager_id, location_id)
VALUES (70,  'Public Relations',    100, 1700),
       (150, 'Shareholder Services', NULL, 1700);
```

Rules:

- Column list after the table name defines **target columns**.
- Each parentheses group corresponds to **one row**.
- Values in each group are **positional**.
- You must have the **same number of values** as columns listed.
- Character and date values go in **single quotes**.

### 2.2 INSERT without column list

You can omit the column list if you:

- Provide **all columns**.
- Respect the table’s default column order.

```sql
INSERT INTO departments
VALUES (160, 'HR Shared Services', 200, 1700),
       (170, 'Analytics',          201, 1700);
```

This works but is fragile—changes to the table structure can break it. Naming columns is safer.

### 2.3 Inserting NULL explicitly or implicitly

Two ways to get `NULL` into a column:

- **Implicit**: leave the column out of the column list.

  ```sql
  INSERT INTO departments (department_id, department_name)
  VALUES (200, 'Finance West');   -- manager_id and location_id become NULL
  ```

- **Explicit**: use the `NULL` keyword.

  ```sql
  INSERT INTO departments (department_id, department_name, manager_id, location_id)
  VALUES (210, 'Finance East', NULL, NULL);
  ```

Make sure the target columns allow `NULL` values.

### 2.4 Inserting dates and times in MySQL

MySQL’s default date format is `YYYY-MM-DD`. You can use:

- `CURDATE()` – current date.
- `NOW()` – current date and time.

```sql
INSERT INTO employees (employee_id, last_name, hire_date, salary)
VALUES (300, 'Nguyen', CURDATE(), 5000.00);
```

If you have a string in a different format, use `STR_TO_DATE` (or `STR_TO_DATE`’s cousin `STR_TO_DATE`—yes, the naming is weird):

```sql
INSERT INTO employees (employee_id, last_name, hire_date, salary)
VALUES (301, 'Lee', STR_TO_DATE('Feb 3 2016', '%b %e %Y'), 4500.00);
```

After insertion, selecting from the table will show the canonical MySQL date format.

### 2.5 INSERT ... SELECT – Bulk insert from another table

You can insert multiple rows returned by a subquery:

```sql
INSERT INTO copy_emp (employee_id, last_name, salary, department_id)
SELECT employee_id,
       last_name,
       salary,
       department_id
FROM   employees
WHERE  department_id = 80;
```

Notes:

- No `VALUES` clause.
- The `INSERT` column list must align positionally and by type with the `SELECT` list.
- All rows returned by the `SELECT` are inserted.

---

## 3. UPDATE – Changing Existing Data

`UPDATE` lets you modify existing rows. The danger lies mostly in the `WHERE` clause.

### 3.1 Basic UPDATE

```sql
UPDATE employees
SET    department_id = 50
WHERE  employee_id   = 113;
```

- Only the row for employee 113 is affected.

If you **omit** `WHERE`:

```sql
UPDATE employees
SET    department_id = 10;
```

- Every row in `employees` is updated.
- This is how accidental mass updates happen.

### 3.2 Setting columns to NULL

```sql
UPDATE employees
SET    manager_id = NULL
WHERE  employee_id = 113;
```

Works if `manager_id` allows `NULL`.

### 3.3 Using subqueries in UPDATE

You can use subqueries in **SET**, **WHERE**, or both.

Example – update rows based on another row’s data:

```sql
UPDATE copy_emp
SET    department_id = (
         SELECT department_id
         FROM   employees
         WHERE  employee_id = 100
       )
WHERE  job_id = (
         SELECT job_id
         FROM   employees
         WHERE  employee_id = 200
       );
```

- The quiz answer from the lesson: you can use subqueries in the **SET** clause, the **WHERE** clause, or **both**.

---

## 4. DELETE and TRUNCATE – Removing Rows

### 4.1 DELETE

`DELETE` removes rows that match a condition:

```sql
DELETE FROM employees
WHERE  employee_id = 207;
```

- Only one row is deleted.

Without a `WHERE` clause:

```sql
DELETE FROM employees;
```

- **All** rows are deleted from `employees`.
- This can be rolled back if you’re inside a transaction and haven’t committed.

You can delete rows based on another table using a subquery:

```sql
DELETE FROM employees
WHERE  department_id IN (
         SELECT department_id
         FROM   departments
         WHERE  department_name LIKE 'Public%'
       );
```

This removes all employees working in departments whose names start with `Public`.

### 4.2 TRUNCATE TABLE

`TRUNCATE` wipes all rows from a table, faster than `DELETE` and more permanently:

```sql
TRUNCATE TABLE employees_backup;
```

- All rows are removed; table structure remains.
- InnoDB treats `TRUNCATE` as a DDL operation; it **implicitly commits**.
- You **cannot** roll back a `TRUNCATE`.

Use it when you truly mean, “this table’s data can disappear forever, right now.”

---

## 5. Transaction Control in MySQL

By default, MySQL runs with **autocommit = 1**:

- Every successful `INSERT`, `UPDATE`, and `DELETE` is committed immediately.
- Each statement is its **own transaction**.

If you want multi‑statement transactions, you either:

- Turn off autocommit: `SET autocommit = 0;`, or
- Use `START TRANSACTION` / `BEGIN` explicitly.

### 5.1 START TRANSACTION / BEGIN

```sql
START TRANSACTION;   -- or BEGIN;

INSERT INTO retired_employees (...)
SELECT ... FROM employees WHERE employee_id = 207;

DELETE FROM employees
WHERE employee_id = 207;

COMMIT;
```

- If all statements succeed, `COMMIT` makes them permanent.
- If something fails or you change your mind, use `ROLLBACK` instead of `COMMIT` and the changes vanish.

### 5.2 ROLLBACK

```sql
START TRANSACTION;

INSERT INTO departments
VALUES (500, 'Temporary', NULL, NULL);

UPDATE employees
SET    department_id = 500
WHERE  last_name = 'Smith';

-- Whoops, terrible idea
ROLLBACK;
```

After `ROLLBACK`:

- The temporary department and reassignment are undone.
- The database is back to its pre‑transaction state.

### 5.3 SAVEPOINT

`SAVEPOINT` lets you set rollback markers **inside** a transaction.

```sql
START TRANSACTION;

INSERT INTO departments
VALUES (600, 'Pilot Dept', NULL, NULL);

SAVEPOINT after_dept;

UPDATE employees
SET    department_id = 600
WHERE  job_id = 'SA_REP';

-- Decide that reassignment is too aggressive
ROLLBACK TO after_dept;

COMMIT;
```

- The new department stays (committed).
- The mass reassignment is undone.
- You could also roll back the **entire** transaction instead of to a savepoint.

Multiple savepoints are allowed; rolling back to an earlier one discards any savepoints created after it.

---

## 6. Consistent Reads and Isolation Level

In busy systems, some sessions read while others write.

- Reads **do not block** writes.
- Writes **do not block** reads.
- A read sees a **snapshot** of data.

This snapshot behavior depends on the **transaction isolation level**. For the MySQL InnoDB storage engine, the default is:

- `REPEATABLE READ` – once a row is read in a transaction, repeated reads see the same values, even if other transactions commit changes.

The practical takeaway:

- You can query without worrying that someone else’s update will change your results mid‑statement.
- Writers still need to worry about conflicts with other writers.

---

## 7. Manual Data Locking: SELECT ... FOR UPDATE (MySQL)

In MySQL/InnoDB, you can lock rows explicitly when you intend to update them.

Important:

- `FOR UPDATE` only makes sense **inside a transaction** (autocommit off or `START TRANSACTION`).
- The lock is released on `COMMIT` or `ROLLBACK`.

Example:

```sql
START TRANSACTION;

SELECT employee_id,
       salary
FROM   employees
WHERE  department_id = 80
FOR UPDATE;

-- Now update the locked rows
UPDATE employees
SET    salary = salary * 1.05
WHERE  department_id = 80;

COMMIT;
```

Notes:

- `FOR UPDATE` must be the **last clause** in the `SELECT` (after `WHERE`, `ORDER BY`, etc.).
- If another transaction already holds a conflicting lock, your `SELECT ... FOR UPDATE` waits until that lock is released, then returns the rows and acquires the lock.

With joins, you can lock rows from multiple tables:

```sql
START TRANSACTION;

SELECT e.employee_id,
       e.salary,
       d.department_name
FROM   employees e
JOIN   departments d ON e.department_id = d.department_id
FOR UPDATE;

-- Both employees and departments rows participating in the join may be locked
```

Or you can restrict which table’s rows are locked (engine‑specific syntax; check your MySQL version’s docs) using `FOR UPDATE OF table_name` in some SQL dialects. In plain MySQL, you typically control locking via which tables are referenced and how the indexes are used.

---

## 8. What You Should Now Be Able to Do

By the end of this lesson, you should be able to:

- Use MySQL `INSERT` (with single and multiple value lists) to add rows.
- Use `INSERT ... SELECT` to bulk‑copy data between tables.
- Use `UPDATE` and `DELETE` (with and without subqueries) to change and remove rows.
- Use `TRUNCATE TABLE` when you truly want to empty a table quickly and irreversibly.
- Control multi‑statement transactions with `START TRANSACTION`/`BEGIN`, `COMMIT`, `ROLLBACK`, and `SAVEPOINT`.
- Understand consistent reads under `REPEATABLE READ` and use `SELECT ... FOR UPDATE` when you need explicit locks.

In other words, you now know how to change data in MySQL **deliberately**, not just accidentally—though if you do make a mistake, you’ve at least got the tools to roll it back before anyone notices.
