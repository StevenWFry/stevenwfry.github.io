## Lesson 11B – Introduction to Data Definition Language in MySQL (or: building the skeleton your data hangs on)

And look, you can write the world’s fanciest queries, but if your tables are mis‑shapen nightmares—with missing columns, wrong types, and no constraints—your database is basically a very expensive junk drawer. MySQL’s **DDL** is where you decide what the data is allowed to look like *before* people start shoving values into it.

This lesson is about defining and changing schema structure in **MySQL**.

You will learn to:

- Create databases and tables.
- List and choose column data types.
- Use `SHOW CREATE TABLE` to reverse‑engineer table definitions.
- Set column and table options (NULL/NOT NULL, DEFAULT, AUTO_INCREMENT).
- Create indexes, keys, and constraints.
- Use `CREATE TABLE ... AS SELECT` and `ALTER TABLE` safely.

---

## 1. Databases, Tables, and Naming Rules

In MySQL you typically work with:

- **Databases** (a.k.a. schemas) – logical containers for tables and other objects.
- **Tables** – the actual structured storage for data.
- **Indexes / keys** – structures to speed up lookups and enforce uniqueness.
- **Constraints** – rules that keep your data from going off the rails.

### 1.1 Creating a database

General syntax:

```sql
CREATE DATABASE dbname;

-- or
CREATE DATABASE IF NOT EXISTS dbname;

-- equivalent
CREATE SCHEMA dbname;
```

- `IF NOT EXISTS` prevents errors if the database already exists (handy in scripts).

Switch to the database:

```sql
USE dbname;
```

### 1.2 Naming rules (databases, tables, columns)

Allowed characters:

- Letters `A–Z`, `a–z`
- Digits `0–9`
- Underscore `_`
- Dollar sign `$`

Constraints:

- Names must be **≤ 64 characters**.
- Avoid reserved words (e.g., `SELECT`, `TABLE`).
- Avoid special characters (slashes, `#`, spaces, etc.) unless you **quote** with backticks.

Example:

```sql
CREATE DATABASE my database;         -- ERROR (space)
CREATE DATABASE `my database`;       -- works, but you’ll regret it later
```

Backticks are MySQL’s “fine, but you’re responsible for this” feature.

---

## 2. Data Types in MySQL

MySQL supports several families of data types.

### 2.1 Numeric types

- **Integers** – whole numbers, signed or unsigned.
  - `TINYINT`, `SMALLINT`, `MEDIUMINT`, `INT`/`INTEGER`, `BIGINT`.
  - Optional attributes: `UNSIGNED`, `ZEROFILL`.

  ```sql
  age INT UNSIGNED;
  ```

- **Fixed‑point** – exact decimals (for money, etc.).
  - `DECIMAL(M, D)` or `NUMERIC(M, D)`.

  ```sql
  price DECIMAL(8,2);   -- e.g., 999,999.99 max
  ```

- **Floating‑point** – approximate values.
  - `FLOAT`, `DOUBLE`.

Use `DECIMAL` for anything involving money; floating‑point is for scientific/numeric approximations, not payroll.

### 2.2 Date and time types

- `DATE` – `YYYY-MM-DD`.
- `TIME` – `HH:MM:SS`.
- `DATETIME` – `YYYY-MM-DD HH:MM:SS`.
- `TIMESTAMP` – like `DATETIME`, with automatic time zone/UTC handling.

Example:

```sql
hire_date DATE,
last_login TIMESTAMP;
```

### 2.3 String types

- `CHAR(M)` – fixed‑length; padded with spaces.
- `VARCHAR(M)` – variable‑length (most common text type).
- `TEXT` (and `TINYTEXT`/`MEDIUMTEXT`/`LONGTEXT`) – large text blobs.
- `BLOB` (and variations) – binary data.

Examples:

```sql
code   CHAR(5),
name   VARCHAR(50),
notes  TEXT,
photo  BLOB;
```

### 2.4 Other types

- Spatial types – for geographic data.
- `JSON` – structured text stored as JSON documents.

In day‑to‑day tables you’ll mostly combine `INT`, `DECIMAL`, `VARCHAR`, `DATE`/`DATETIME`, and the occasional `TEXT` or `BLOB`.

---

## 3. CREATE TABLE – Building the Structure

General pattern:

```sql
CREATE TABLE employees (
  employee_id   INT          NOT NULL,
  last_name     VARCHAR(25)  NOT NULL,
  first_name    VARCHAR(25),
  hire_date     DATE         NOT NULL,
  salary        DECIMAL(8,2),
  department_id INT,

  PRIMARY KEY (employee_id)
);
```

Key points:

- Each column definition includes **name**, **type**, and optional **constraints**.
- You can define **primary key**, **unique**, and **foreign key** constraints inline.
- You can provide **default** values and `AUTO_INCREMENT` where appropriate.

### 3.1 Column options

Common column attributes:

- `NULL` / `NOT NULL` – whether `NULL` is allowed.
- `DEFAULT value` – value used if none is provided on insert.
- `AUTO_INCREMENT` – automatically generate numeric values (one per table).

Example:

```sql
CREATE TABLE departments (
  department_id   INT          NOT NULL AUTO_INCREMENT,
  department_name VARCHAR(30)  NOT NULL,
  manager_id      INT,
  location_id     INT,

  PRIMARY KEY (department_id)
);
```

MySQL will auto‑increment `department_id` for each new row if you omit a value.

### 3.2 Creating a table with existing data (CTAS)

You can create a table and populate it from a `SELECT` in one go:

```sql
CREATE TABLE dept80 AS
SELECT employee_id,
       last_name,
       salary * 12 AS annsal,
       hire_date
FROM   employees
WHERE  department_id = 80;
```

Notes:

- Column names come from the `SELECT` list (use aliases like `annsal`).
- Data types are inferred from the expressions and source columns.
- Constraints from the source table are **not** copied; you must re‑add keys/constraints afterward.

---

## 4. Keys, Indexes, and Constraints

### 4.1 Indexes and keys

In MySQL, **keys** are usually just indexes with special semantics:

- **PRIMARY KEY** – unique, non‑NULL, used to identify rows.
- **UNIQUE KEY** – unique values, but can contain `NULL`s.
- **FOREIGN KEY** – enforces referential integrity across tables.
- **Secondary indexes** – non‑unique indexes to speed up lookups.

Indexes:

- Are collections of pointers that let MySQL locate rows quickly.
- Avoid full table scans for indexed searches.
- Cost space and must be updated when data changes.

### 4.2 Primary keys

Define a primary key at table creation:

```sql
CREATE TABLE jobs (
  job_id   INT         NOT NULL,
  job_title VARCHAR(25) NOT NULL,

  PRIMARY KEY (job_id)
);
```

Rules:

- Only **one** primary key per table.
- Cannot contain `NULL`s.

### 4.3 Unique keys

Require values to be distinct, but allow `NULL`s:

```sql
CREATE TABLE employees6 (
  employee_id INT         NOT NULL,
  email       VARCHAR(50) NOT NULL,

  PRIMARY KEY (employee_id),
  UNIQUE KEY emp6_email_uk (email)
);
```

- Multiple unique keys per table are allowed.

### 4.4 Foreign keys

Maintain relationships between parent and child tables.

Example – classic departments/employees relationship:

```sql
CREATE TABLE departments (
  department_id   INT         NOT NULL,
  department_name VARCHAR(30) NOT NULL,
  PRIMARY KEY (department_id)
);

CREATE TABLE employees6 (
  employee_id   INT         NOT NULL,
  last_name     VARCHAR(25) NOT NULL,
  department_id INT,

  PRIMARY KEY (employee_id),
  CONSTRAINT emp6_dept_fk
    FOREIGN KEY (department_id)
    REFERENCES departments (department_id)
    ON DELETE RESTRICT
    ON UPDATE RESTRICT
);
```

You can also define the FK in a later `ALTER TABLE`:

```sql
ALTER TABLE employees6
ADD CONSTRAINT emp6_manager_fk
FOREIGN KEY (manager_id)
REFERENCES employees6 (employee_id);
```

**Referential actions** for `ON DELETE` / `ON UPDATE`:

- `RESTRICT` / `NO ACTION` – prevent delete/update if children exist.
- `CASCADE` – propagate changes to child rows.
- `SET NULL` – set child FK to `NULL` when parent changes.

Useful for keeping relationships valid; dangerous if you forget you added `CASCADE`.

### 4.5 Secondary indexes

Non‑constraint indexes for performance:

```sql
CREATE INDEX idx_emp6_lastname
ON employees6 (last_name);
```

You can also create indexes via `ALTER TABLE` as part of constraint definitions.

---

## 5. SHOW CREATE TABLE – Reverse‑Engineering a Table

`SHOW CREATE TABLE` reveals the full DDL MySQL would use to recreate a table.

```sql
SHOW CREATE TABLE employees6\G
```

You’ll see:

- Column definitions and types.
- Primary/unique/foreign keys.
- Index definitions.
- Table options (engine, charset, etc.).

This is extremely useful when you inherit a schema and want to see how it was built without reading someone else’s migration scripts.

---

## 6. ALTER TABLE – Changing Existing Structure

Use `ALTER TABLE` to modify a table’s definition.

### 6.1 ADD columns

```sql
ALTER TABLE dept80
ADD COLUMN job_id VARCHAR(9) NOT NULL DEFAULT 'ST_CLERK'
AFTER last_name;
```

- `ADD COLUMN` defines a new column, its type, nullability, and default.
- `AFTER last_name` places it immediately after `last_name`.

### 6.2 MODIFY columns

```sql
ALTER TABLE dept80
MODIFY COLUMN last_name VARCHAR(30) NOT NULL FIRST;
```

- Changes type/size/options.
- `FIRST` moves the column to the first position.
- You must supply the **full** column definition; omitting `NOT NULL` would drop the constraint.
- Shrinking a column is allowed only if existing data fits the new size.

### 6.3 DROP columns

```sql
ALTER TABLE dept80
DROP COLUMN job_id;
```

- Removes the column and all its data.

### 6.4 Adding indexes or constraints

You can attach indexes/constraints after creation:

```sql
ALTER TABLE employees6
ADD CONSTRAINT emp6_manager_fk
FOREIGN KEY (manager_id)
REFERENCES employees6 (employee_id);
```

Or create a separate index:

```sql
CREATE INDEX idx_emp6_job
ON employees6 (job_id);
```

---

## 7. DROP TABLE – Removing Tables

`DROP TABLE` removes a table and its data.

```sql
DROP TABLE dept80;

-- or safer in scripts:
DROP TABLE IF EXISTS dept80;
```

- In MySQL there is no Recycle Bin by default: once dropped, the table is gone unless you have backups.
- `IF EXISTS` avoids errors if the table is already gone.

---

## 8. Putting It Together – Example: Adding JOB_TITLE to JOBS

Back to Ben’s complaint: the `JOBS` table is missing `JOB_TITLE`.

Assuming a simple existing `JOBS` table, you could add the column with:

```sql
ALTER TABLE jobs
ADD COLUMN job_title VARCHAR(25) NOT NULL;
```

Then populate it with appropriate titles via `UPDATE` statements.

---

## 9. What You Should Now Be Able to Do

By the end of this lesson, you should be able to:

- Create databases with `CREATE DATABASE` / `CREATE SCHEMA` and switch between them with `USE`.
- Create tables with `CREATE TABLE`, choosing appropriate MySQL data types.
- Use column options like `NOT NULL`, `DEFAULT`, and `AUTO_INCREMENT`.
- Create primary keys, unique keys, foreign keys, and secondary indexes.
- Use `SHOW CREATE TABLE` to view the underlying DDL for an existing table.
- Use `CREATE TABLE ... AS SELECT` to create and populate a table from a query.
- Modify tables with `ALTER TABLE` and remove them with `DROP TABLE`.

You’ve now graduated from “I use whatever tables exist” to “I design the tables”—which is both a promotion and an exciting new way to break production if you’re not careful.
