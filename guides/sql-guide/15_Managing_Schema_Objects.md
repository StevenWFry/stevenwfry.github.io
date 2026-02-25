# 15 – Managing Schema Objects (Or: Teaching Your Constraints To Chill Out)

And look, once your database has been alive for more than about five minutes, people start saying things like “we just need one tiny schema change,” which is how you end up spending your weekend negotiating with constraints, temporary tables, and external files that absolutely *weren’t* documented.

This lesson is about staying in control of that chaos:

- Managing and deferring constraints  
- Using temporary tables as socially acceptable scratchpads  
- Pointing tables at files that live outside the database (external tables)

---

## 1. Managing Constraints Without Losing Your Mind

Constraints are the grumpy hall monitors of your schema: they don’t let bad data through, and they absolutely do not care about your deadline.

You need to be able to:

- Add or drop constraints  
- Enable or disable them  
- Decide *when* they complain (immediately vs at commit)

### 1.1 Adding constraints with `ALTER TABLE`

For **everything except `NOT NULL`**, you use `ALTER TABLE … ADD`:

```sql
ALTER TABLE emp2
  ADD CONSTRAINT emp2_mgr_fk
      FOREIGN KEY (manager_id)
      REFERENCES emp2 (employee_id);
```

Notes:

- This is a **table‑level** definition (`FOREIGN KEY` keyword; column listed inside the constraint).
- If you skip `CONSTRAINT emp2_mgr_fk`, Oracle happily invents a name like `SYS_C009873`.

For a **`NOT NULL`** constraint, you must use `MODIFY` because it lives at the **column** level:

```sql
ALTER TABLE emp2
  MODIFY last_name CONSTRAINT emp2_lastname_nn NOT NULL;
```

### 1.2 Dropping constraints

When a constraint has outlived its usefulness (or was a terrible idea to begin with):

```sql
ALTER TABLE emp2
  DROP CONSTRAINT emp2_mgr_fk;
```

Dropping a primary key and all its dependent foreign keys in one dramatic gesture:

```sql
ALTER TABLE emp2
  DROP PRIMARY KEY CASCADE;
```

Add `ONLINE` if you want DML to keep flowing while the constraint is being dropped:

```sql
ALTER TABLE emp2
  DROP PRIMARY KEY CASCADE ONLINE;
```

### 1.3 `ON DELETE CASCADE` vs `ON DELETE SET NULL`

This is where you decide how much collateral damage is acceptable when parents disappear.

**Cascade: delete children when the parent goes**

```sql
ALTER TABLE emp2
  ADD CONSTRAINT emp2_dept_fk
      FOREIGN KEY (department_id)
      REFERENCES departments (department_id)
      ON DELETE CASCADE;
```

- Delete a department → all employees in that department vanish too.
- Great for “test data”, less great for “payroll”.

**Set null: orphans keep living, just confused**

```sql
ALTER TABLE emp2
  ADD CONSTRAINT emp2_dept_fk
      FOREIGN KEY (department_id)
      REFERENCES departments (department_id)
      ON DELETE SET NULL;
```

- Delete the department → employees stay, `department_id` becomes `NULL`.
- Perfect when employees outlive org charts, which… they often do.

### 1.4 Dropping columns with attached constraints

If a column has PRIMARY/UNIQUE keys or foreign keys pointing at it, dropping it is like removing a Jenga block from the bottom row.

Use `CASCADE CONSTRAINTS` so Oracle also drops any constraints that depend on that column:

```sql
ALTER TABLE emp2
  DROP COLUMN employee_id CASCADE CONSTRAINTS;
```

---

## 2. Enabling, Disabling, and Deferring Constraints

There are days when you want your constraints to back off a bit so you can do a bulk load, data migration, or “creative repair”.

### 2.1 Basic enable/disable

Temporarily turning constraint checks off:

```sql
ALTER TABLE emp2
  DISABLE CONSTRAINT emp2_dept_fk;
```

Re‑arming it later:

```sql
ALTER TABLE emp2
  ENABLE CONSTRAINT emp2_dept_fk;
```

Disable **all** foreign keys hanging off a primary key:

```sql
ALTER TABLE emp2
  DISABLE PRIMARY KEY CASCADE;
```

When you `ENABLE` a PRIMARY or UNIQUE key, Oracle automatically (re)creates the supporting **unique index**, because that’s what actually enforces uniqueness.

### 2.2 Validate vs NOVALIDATE

You get to choose whether enabling a constraint:

- Checks existing data (`VALIDATE`), or  
- Just applies to *new* data going forward (`NOVALIDATE`)

Example:

```sql
-- Check all existing rows and future rows
ALTER TABLE dept2
  ENABLE VALIDATE PRIMARY KEY;

-- Trust existing data (maybe foolishly), check only new rows
ALTER TABLE dept2
  ENABLE NOVALIDATE PRIMARY KEY;
```

If you know your data is terrible but fixing it will take ages, `NOVALIDATE` is the “we’ll deal with this later” option.

### 2.3 Deferrable constraints (complain later, not now)

Deferrable constraints let you say, “yes, I *know* this looks wrong mid‑transaction, but I promise it’ll be fine by commit.”

Define a deferrable primary key:

```sql
CREATE TABLE demo (
  id   NUMBER
       CONSTRAINT demo_pk
       PRIMARY KEY
       DEFERRABLE INITIALLY DEFERRED,
  name VARCHAR2(25)
);
```

Behavior:

- You can temporarily violate `demo_pk` within a transaction.
- The check happens at `COMMIT` time, not on each `INSERT`/`UPDATE`.

Example pattern:

```sql
-- This may temporarily violate the constraint…
INSERT INTO demo VALUES (1, 'First');
INSERT INTO demo VALUES (1, 'Duplicate');  -- allowed for now

COMMIT;  -- BOOM: ORA-00001, transaction rolled back
```

You can switch the mode for the whole session:

```sql
ALTER SESSION SET CONSTRAINTS = IMMEDIATE;  -- behave like normal
ALTER SESSION SET CONSTRAINTS = DEFERRED;   -- check at COMMIT
```

Immediate mode: constraint checked per statement.  
Deferred mode: constraint checked at commit, and a single failure rolls back the whole transaction.

---

## 3. Temporary Tables: Shopping Carts For Data

And look, not every intermediate result deserves a permanent table and a place in the ERD. Sometimes you just need a scratchpad that magically cleans itself up.

That’s what temporary tables are for.

Key points:

- Table **definition** is permanent.  
- Table **data** is temporary and:
  - Private to each session, and  
  - Cleared either at commit or at end of session, depending on options.

### 3.1 Global temporary tables

Classic pattern:

```sql
CREATE GLOBAL TEMPORARY TABLE cart_items (
  session_id  VARCHAR2(30),
  item_id     NUMBER,
  qty         NUMBER
) ON COMMIT DELETE ROWS;
```

Options:

- `ON COMMIT DELETE ROWS`  
  - Data disappears when the transaction commits.
  - Good for truly short‑lived staging.

- `ON COMMIT PRESERVE ROWS`  
  - Data survives commits but disappears when the **session ends**.
  - Perfect for “shopping cart” behavior in a web app.

Remember:

- Everyone shares the **structure**.  
- Each session sees only its own rows.

### 3.2 Private temporary tables

Private temp tables are like global temp tables that went into witness protection:

- Only the creating session can see the **definition** and the **data**.
- Names must start with `ORA$PTT_`.

Examples:

```sql
-- Transaction-specific private temp table
CREATE PRIVATE TEMPORARY TABLE ora$ptt_txn_buffer
ON COMMIT DROP DEFINITION AS
SELECT * FROM employees WHERE department_id = 10;

-- Session-specific private temp table
CREATE PRIVATE TEMPORARY TABLE ora$ptt_session_buffer
ON COMMIT PRESERVE DEFINITION AS
SELECT * FROM employees WHERE department_id = 20;
```

In both cases, once your session ends, the table definition and data are gone.  
Which is great, unless you forgot to copy out the data you needed, in which case… oops.

---

## 4. External Tables: When Your Data Refuses To Live In The Database

Sometimes data stubbornly exists in files because someone loves CSVs, or there’s an ETL process that insists on spitting out flat files like it’s 1997.

External tables let you:

- Query file‑based data with `SELECT`  
- Use SQL and joins without actually loading rows into regular tables

### 4.1 The moving parts

1. **Oracle DIRECTORY object** – a pointer to a filesystem path:

   ```sql
   CREATE OR REPLACE DIRECTORY emp_dir AS '/home/oracle/labs/sql2/emptor';
   GRANT READ ON DIRECTORY emp_dir TO ora21;
   ```

2. **External table** – a table definition that describes file layout.

### 4.2 External table with `ORACLE_LOADER`

Typical “read a CSV‑ish text file” example:

```sql
CREATE TABLE ext_books (
  category_id  NUMBER,
  book_id      NUMBER,
  book_price   NUMBER,
  quantity     NUMBER
)
ORGANIZATION EXTERNAL (
  TYPE ORACLE_LOADER
  DEFAULT DIRECTORY emp_dir
  ACCESS PARAMETERS (
    RECORDS DELIMITED BY NEWLINE
    FIELDS TERMINATED BY ','
  )
  LOCATION ('library_items.dat')
)
REJECT LIMIT UNLIMITED;
```

Now you can:

```sql
SELECT category_id, book_id, quantity
FROM   ext_books
WHERE  book_price > 20;
```

Notes:

- Data lives in the OS file, **not** in database blocks.  
- `REJECT LIMIT` controls how many bad records Oracle will tolerate before giving up.

### 4.3 External table with `ORACLE_DATAPUMP`

`ORACLE_DATAPUMP` writes data into binary dump files for fast unload/reload.

Example: create an external table that’s backed by Data Pump files:

```sql
CREATE TABLE dept_ext
ORGANIZATION EXTERNAL (
  TYPE ORACLE_DATAPUMP
  DEFAULT DIRECTORY emp_dir
  LOCATION ('dept_ext_1.exp', 'dept_ext_2.exp')
) AS
SELECT department_id,
       department_name,
       manager_id,
       location_id
FROM   departments;
```

This does two things:

1. Creates the `dept_ext` table definition.  
2. Writes the query result into the listed `.exp` files.

Later, you can:

```sql
SELECT * FROM dept_ext;
```

and read directly from the dump files without touching the original `DEPARTMENTS` table.

---

## 5. Recycle Bin, PURGE, and “No, Really, Delete It”

By default, when you:

```sql
DROP TABLE big_table;
```

Oracle doesn’t really delete it. It:

- Renames it to a weird `BIN$…` name  
- Stores it in the **Recycle Bin**  
- Keeps using your tablespace quota

Nice for “oops, I didn’t mean to drop that.” Less nice for “why am I out of space?”

If you’re sure you don’t need it back:

```sql
DROP TABLE big_table PURGE;
```

Now it’s gone from the database *and* the Recycle Bin, and you reclaim the space.

---

## What You Should Be Able To Do Now

By this point, you should be able to:

- Add, drop, enable, disable, and defer constraints (and decide whether they validate existing data)  
- Use `ON DELETE CASCADE` and `ON DELETE SET NULL` without accidentally nuking half your schema  
- Use `CASCADE CONSTRAINTS` when dropping constrained columns  
- Create and use global and private temporary tables for “shopping cart”‑style data  
- Define external tables over text files (`ORACLE_LOADER`) and Data Pump dumps (`ORACLE_DATAPUMP`)  
- Decide when to keep dropped objects in the Recycle Bin vs nuking them with `PURGE`

In short: you now have the tools to control your schema objects instead of letting them control you – which, in database terms, is about as close to happiness as it gets.

