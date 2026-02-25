## Lesson 11A – Introduction to Data Definition Language in Oracle (or: how to build the furniture before you sit on it)

And look, all the querying, joining, and updating in the world doesn’t help if the tables themselves are wrong—missing columns, bad data types, or no constraints so people can enter “banana” as a salary. **DDL** is where you define what the database *is*, not just what’s inside it.

This lesson is about the **structure**: tables, columns, and constraints.

You will learn to:

- Categorize the main database objects (tables, views, sequences, indexes, synonyms).
- Review table structure with `DESC` and data dictionary views.
- List the common Oracle column data types.
- Create simple tables with `CREATE TABLE`.
- Define constraints (NOT NULL, UNIQUE, PRIMARY KEY, FOREIGN KEY, CHECK) at creation time.

---

## 1. Database Objects and Naming Rules

Common Oracle schema objects:

- **Tables** – primary storage for data, organized into rows and columns.
- **Views** – virtual tables defined by `SELECT` queries.
- **Sequences** – generators for numeric values (often used for keys).
- **Indexes** – structures that speed up lookups and sorts.
- **Synonyms** – alternative names for objects (shortcuts/abstractions).

Naming rules for tables and columns:

- Must begin with a **letter**.
- Length: **1–30 characters**.
- Allowed characters: `A–Z`, `a–z`, `0–9`, `_`, `$`, `#`.
- Must not duplicate another object name owned by the **same user**.
- Must not be an Oracle **reserved word** (e.g., don’t call a table `VARCHAR2`).

So `employees`, `dept_80`, and `job_history` are fine. `select` and `table` are not.

---

## 2. CREATE TABLE – Defining Structure

To create a table you need:

- The `CREATE TABLE` system privilege.
- Enough quota on a tablespace (storage area).

Syntax (basic):

```sql
CREATE TABLE dept (
  deptno      NUMBER(2),
  dname       VARCHAR2(14),
  loc         VARCHAR2(13),
  create_date DATE DEFAULT SYSDATE
);
```

Key points:

- Each column definition includes: **name**, **data type**, and often **size**.
- `DEFAULT SYSDATE` on `create_date` means:
  - If you insert a row **without** specifying `create_date`, Oracle fills in the current date.

You can inspect the structure of a table with:

```sql
DESC dept;
```

…and of course with the SQL Developer UI or `USER_TAB_COLUMNS` data dictionary view.

---

## 3. Common Oracle Data Types

Character and numeric types:

- `VARCHAR2(size)` – variable‑length character data.
- `CHAR(size)` – fixed‑length character data (padded with spaces).
- `NUMBER(p, s)` – numeric data with precision `p` and scale `s`.
- `NUMBER` (no arguments) – general numeric type.

Date and time:

- `DATE` – date and time (to the second).
- `TIMESTAMP[(fractional_seconds)]` – date + time + fractional seconds.
- `INTERVAL YEAR TO MONTH` – spans of years and months.
- `INTERVAL DAY TO SECOND` – spans of days, hours, minutes, seconds.

Large objects and others (high level):

- `LONG` – legacy variable‑length character data (up to 2 GB; generally avoid in new designs).
- `CLOB` – character large object.
- `BLOB` – binary large object.
- `BFILE` – pointer to external binary file.
- `RAW`, `LONG RAW` – raw binary data.
- `ROWID` – encoded physical address of a row.

In most application tables you’ll use `NUMBER`, `VARCHAR2`, `DATE`, and occasionally `TIMESTAMP` and LOBs.

---

## 4. DEFAULT Values

You can specify a **default** for a column in `CREATE TABLE`:

```sql
CREATE TABLE employees_demo (
  employee_id   NUMBER(6),
  last_name     VARCHAR2(25) NOT NULL,
  hire_date     DATE DEFAULT SYSDATE,
  status        VARCHAR2(10) DEFAULT 'ACTIVE'
);
```

Rules:

- Defaults can be **literals** or **expressions**/functions like `SYSDATE`.
- You **cannot** reference *other* columns or pseudocolumns in a default.
- The default’s data type must be **compatible** with the column type.

Default values apply when **no value** is supplied in the `INSERT` for that column.

---

## 5. Constraints – Enforcing Rules on Data

Constraints enforce **business rules** and maintain **data integrity**.

Core types:

- `NOT NULL` – column must have a value.
- `UNIQUE` – column (or combination) must be unique across the table.
- `PRIMARY KEY` – uniqueness + NOT NULL; main identifier for a row.
- `FOREIGN KEY` – column references primary/unique key in another table.
- `CHECK` – arbitrary condition must be satisfied.

### 5.1 Where and when you can define constraints

- At **table creation** (`CREATE TABLE`).
- After creation using `ALTER TABLE`.
- At **column level** or **table level**:
  - Column level: constraint defined **inline** with the column.
  - Table level: constraint defined **after** all column definitions.

`NOT NULL` is always a column‑level constraint.

If you don’t name a constraint, Oracle invents one (`SYS_C009876` etc.), which is how you end up hating yourself when debugging. Naming them is strongly recommended.

### 5.2 Column‑level constraints

Defined inline with the column:

```sql
CREATE TABLE employees_demo (
  employee_id NUMBER(6)
    CONSTRAINT emp_emp_id_pk PRIMARY KEY,
  last_name   VARCHAR2(25)  CONSTRAINT emp_lname_nn NOT NULL,
  email       VARCHAR2(25),
  salary      NUMBER(8,2)
);
```

- `emp_emp_id_pk` is a **PRIMARY KEY** on `employee_id`.
- `emp_lname_nn` is a **NOT NULL** on `last_name`.

### 5.3 Table‑level constraints

Defined after all columns; useful for composite keys or when you prefer to group constraints together:

```sql
CREATE TABLE employees_demo (
  employee_id NUMBER(6),
  first_name  VARCHAR2(20),
  last_name   VARCHAR2(25),
  email       VARCHAR2(25),
  salary      NUMBER(8,2),

  CONSTRAINT emp_pk PRIMARY KEY (employee_id),
  CONSTRAINT emp_email_uk UNIQUE (email)
);
```

For composite primary keys:

```sql
CONSTRAINT emp_name_pk PRIMARY KEY (employee_id, first_name)
```

Table‑level constraints always reference one or more existing columns by name.

### 5.4 NOT NULL

Ensures a column **cannot** be `NULL`.

```sql
last_name VARCHAR2(25) CONSTRAINT emp_lname_nn NOT NULL
```

- Attempting to insert a row without `last_name` raises an error.
- `NOT NULL` is always column‑level.

### 5.5 UNIQUE

Ensures each non‑NULL value is unique in the column (or column set).

Example – prevent duplicate emails:

```sql
CONSTRAINT emp_email_uk UNIQUE (email)
```

- First insert of `smith@example.com` succeeds.
- Second insert with the same email fails with a unique‑constraint violation.

### 5.6 PRIMARY KEY and FOREIGN KEY

**PRIMARY KEY**:

- Uniquely identifies each row.
- Implies `UNIQUE` + `NOT NULL`.

Example:

```sql
CONSTRAINT dept_pk PRIMARY KEY (department_id)
```

**FOREIGN KEY**:

- Enforces a relationship to a parent table.
- Child values must match an existing parent key (or be `NULL`, unless restricted).

Example – table‑level foreign key:

```sql
CREATE TABLE employees_demo (
  employee_id   NUMBER(6) PRIMARY KEY,
  last_name     VARCHAR2(25) NOT NULL,
  department_id NUMBER(4),

  CONSTRAINT emp_dept_fk
    FOREIGN KEY (department_id)
    REFERENCES departments (department_id)
);
```

- `department_id` in `employees_demo` must either be `NULL` or match a `department_id` in `departments`.
- The referenced column must have a **PRIMARY KEY** or `UNIQUE` constraint defined **first**.

Options:

- `ON DELETE CASCADE` – deleting a parent row automatically deletes matching child rows.
- `ON DELETE SET NULL` – deleting a parent row sets matching child foreign keys to `NULL`.

Good for enforcing referential integrity; dangerous if you forget you added `CASCADE`.

### 5.7 CHECK

Validates that a condition is true for each row. It cannot reference columns in other tables.

Example – salary must be > 0:

```sql
CONSTRAINT emp_salary_chk
  CHECK (salary > 0)
```

Another example – restrict job_id to a set of codes:

```sql
CONSTRAINT emp_job_chk
  CHECK (job_id IN ('SA_REP', 'IT_PROG', 'AD_PRES'))
```

If you violate a constraint, Oracle tells you **which constraint** you violated—another good reason to name them.

---

## 6. Creating Tables with Subqueries (CTAS)

You can create a table **and** populate it at the same time using `CREATE TABLE ... AS SELECT` (CTAS).

Example – create `dept80` from employees in department 80:

```sql
CREATE TABLE dept80 AS
SELECT employee_id,
       last_name,
       salary * 12 AS annsal,
       hire_date
FROM   employees
WHERE  department_id = 80;
```

Key points:

- Column names and types are derived from the `SELECT` list.
- Expressions **must** have aliases that are valid column names (`annsal` instead of `salary*12`).
- Data is copied at creation time.
- Only **explicit NOT NULL** constraints are carried over; other constraints (PK, FK, UNIQUE, CHECK) are **not** copied and must be redefined with `ALTER TABLE` later if needed.

---

## 7. ALTER TABLE – Changing Existing Structure

Use `ALTER TABLE` to:

- Add new columns.
- Modify column definitions (type, size, default).
- Add or drop constraints.
- Drop or mark columns as unused.
- Set a table to read‑only or back to read/write.

### 7.1 ADD columns

```sql
ALTER TABLE dept80
ADD (job_id VARCHAR2(9));
```

- New columns are added to the **end** of the table.
- Existing rows get `NULL` in the new column.

### 7.2 MODIFY columns

```sql
ALTER TABLE dept80
MODIFY (last_name VARCHAR2(30));
```

Rules:

- You can **increase** the length of a character or number column (if compatible).
- Decreasing length is only allowed if no existing values violate the new size.
- Changing data types is restricted if existing data can’t be converted.
- Changing a default affects only **future inserts**, not existing rows.

### 7.3 DROP columns

```sql
ALTER TABLE dept80
DROP COLUMN job_id;
```

- Permanently removes the column and its data.
- Can be time‑consuming for large tables and may impact concurrent DML.

### 7.4 SET UNUSED and DROP UNUSED COLUMNS

Alternative to `DROP COLUMN` for large tables:

```sql
ALTER TABLE dept80 SET UNUSED (job_id);
-- Later...
ALTER TABLE dept80 DROP UNUSED COLUMNS;
```

- `SET UNUSED` marks columns as logically removed but leaves data physically for now.
- `DROP UNUSED COLUMNS` removes all unused columns (maybe during a maintenance window).
- `ONLINE` keyword can allow DML while marking unused (in Enterprise features).

### 7.5 READ ONLY / READ WRITE

You can lock a table’s structure and data against change during maintenance:

```sql
ALTER TABLE employees READ ONLY;
-- table can be queried, but not modified or altered

-- When done
ALTER TABLE employees READ WRITE;
```

Useful when you want to freeze a table while still letting people run reports.

---

## 8. DROP TABLE and the Recycle Bin

`DROP TABLE` removes a table and its data.

```sql
DROP TABLE dept80;
```

By default (in modern Oracle with Recycle Bin enabled):

- The table is moved into the **Recycle Bin**.
- You can recover it using `FLASHBACK TABLE ... TO BEFORE DROP`.
- Dependent objects become invalid and must be recompiled or recreated.
- Object privileges on the table are removed.

To bypass the Recycle Bin and remove the table permanently:

```sql
DROP TABLE dept80 PURGE;
```

- No flashback possible; table is gone.

Flashback example:

```sql
FLASHBACK TABLE dept80 TO BEFORE DROP;
```

After which you can `DESC dept80` and see the structure again.

---

## 9. What You Should Now Be Able to Do

By the end of this lesson, you should be able to:

- Identify and categorize core database objects like tables, views, sequences, indexes, and synonyms.
- Review table structures using `DESC` and related dictionary views.
- Choose appropriate Oracle data types for columns.
- Create tables with `CREATE TABLE`, including default values.
- Define constraints (NOT NULL, UNIQUE, PRIMARY KEY, FOREIGN KEY, CHECK) at creation or later with `ALTER TABLE`.
- Use `CREATE TABLE AS SELECT` to clone structure and data.
- Modify and remove tables with `ALTER TABLE` and `DROP TABLE` (with an awareness of the Recycle Bin).

You now have the power not just to query data, but to **shape the schema** itself—which is how you go from “SQL user” to “person everyone blames when a table disappears.”
