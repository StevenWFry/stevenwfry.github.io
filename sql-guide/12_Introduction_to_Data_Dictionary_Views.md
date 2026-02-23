## Lesson 12 – Introduction to Data Dictionary Views (or: the database’s own gossip column)

And look, your schema knows things about itself that you have absolutely no idea about: who created which table, what constraints lurk on which columns, and why that one INSERT keeps failing. The **data dictionary** is the part of Oracle that keeps receipts on all of it.

This lesson is about using those built‑in views to let the database tell you about… itself.

You will learn to:

- Explain what the Oracle data dictionary is and how it’s organized.
- Use `DICTIONARY` (a.k.a. `DICT`) to discover available views.
- Use `USER_`, `ALL_`, and `DBA_` views to explore objects, tables, columns, and constraints.
- Add comments to tables and columns and retrieve them from comment views.

---

## 1. What Is the Data Dictionary?

The database stores two broad kinds of information:

- **Business data** – your actual application tables (EMPLOYEES, DEPARTMENTS, LOCATIONS, JOB_HISTORY, etc.).
- **Metadata** – information *about* those objects (who owns them, when they were created, what columns/constraints they have, who can access them).

The metadata lives in the **data dictionary**.

Internally, the dictionary consists of **base tables** owned by Oracle. You don’t query those directly; instead you query **views** that sit on top of them.

These views fall into families based on **scope**:

- `USER_...` – objects **you own**.
- `ALL_...` – objects you can **access** (your own + others you have privileges on).
- `DBA_...` – everything in the database (DBA privileges required).
- `V$...` – dynamic performance and monitoring views.

So you have a kind of metadata onion, going from “just my stuff” to “everyone’s stuff” to “how the whole database is feeling right now.”

---

## 2. DICTIONARY / DICT – The Directory of the Dictionary

If you’ve ever wondered “what dictionary views even exist?”, Oracle gives you a meta‑view of the metadata: `DICTIONARY` (also known as `DICT`).

```sql
SELECT table_name,
       comments
FROM   dictionary;
```

- `TABLE_NAME` – name of the dictionary view or table.
- `COMMENTS` – brief description.

You’ll see entries like:

- `USER_OBJECTS` – “Objects owned by the user.”
- `ALL_TABLES` – “Description of all tables accessible to the user.”
- `V$SESSION` – “Session information.”

It’s the help index for every other metadata view.

---

## 3. USER_OBJECTS, ALL_OBJECTS – What Objects Exist?

### 3.1 Objects you own: `USER_OBJECTS`

`USER_OBJECTS` shows **everything you own** in your schema: tables, indexes, sequences, views, etc.

```sql
SELECT object_name,
       object_type,
       status,
       created,
       last_ddl_time
FROM   user_objects;
```

- `OBJECT_TYPE` – `TABLE`, `INDEX`, `VIEW`, `SEQUENCE`, etc.
- `STATUS` – usually `VALID` or `INVALID`.

Example check:

```sql
SELECT COUNT(*)
FROM   user_objects;
```

Tells you how many objects you personally own.

### 3.2 Objects you can see: `ALL_OBJECTS`

`ALL_OBJECTS` shows objects you can **access**, not just those you own:

```sql
SELECT owner,
       object_name,
       object_type
FROM   all_objects;
```

You’ll see rows from schemas like `SYS`, `SYSTEM`, and application schemas. This includes:

- Your objects.
- Objects owned by others that you have privileges on.

With `ALL_OBJECTS` you can answer questions like “which user owns table X?” and “do I have access to that package?”

---

## 4. USER_TABLES and ALL_TABLES – Table‑Level Info

`USER_TABLES` describes every **table** you own:

```sql
SELECT table_name,
       num_rows,
       blocks,
       temporary,
       partitioned
FROM   user_tables;
```

- No column‑level info here—this is table metadata only.

`ALL_TABLES` is the broader version, for all accessible tables:

```sql
SELECT owner,
       table_name
FROM   all_tables;
```

Remember: Oracle stores object and column names in uppercase by default, so query using uppercase identifiers (e.g., `'EMPLOYEES'`).

---

## 5. USER_TAB_COLUMNS – Column‑Level Info

To see **columns** and their properties, use `USER_TAB_COLUMNS` (or `ALL_TAB_COLUMNS`):

```sql
SELECT table_name,
       column_name,
       data_type,
       data_length,
       data_precision,
       data_scale,
       nullable,
       data_default
FROM   user_tab_columns
WHERE  table_name = 'EMPLOYEES'
ORDER  BY column_id;
```

This tells you for each column:

- Name and data type.
- Length / precision / scale.
- Whether it can be `NULL`.
- Any default value.

It’s your “what does this table actually look like?” view.

---

## 6. USER_CONSTRAINTS and USER_CONS_COLUMNS – Constraint Info

Constraints are described in **two** main views:

- `USER_CONSTRAINTS` – one row per constraint.
- `USER_CONS_COLUMNS` – links constraints to columns.

### 6.1 USER_CONSTRAINTS

```sql
SELECT constraint_name,
       constraint_type,
       table_name,
       status
FROM   user_constraints
WHERE  table_name = 'EMPLOYEES';
```

`CONSTRAINT_TYPE` codes:

- `P` – PRIMARY KEY
- `R` – FOREIGN KEY (referential)
- `U` – UNIQUE
- `C` – CHECK or NOT NULL
- `O` – READ ONLY (on views)

This tells you **what** constraints exist and on which tables.

### 6.2 USER_CONS_COLUMNS

```sql
SELECT constraint_name,
       table_name,
       column_name,
       position
FROM   user_cons_columns
WHERE  table_name = 'EMPLOYEES';
```

This tells you **which columns** are involved in each constraint.

### 6.3 Joining the two

To see a combined view of constraints and their columns:

```sql
SELECT c.constraint_name,
       c.constraint_type,
       c.table_name,
       cc.column_name,
       c.status
FROM   user_constraints   c
JOIN   user_cons_columns cc
       ON c.constraint_name = cc.constraint_name
WHERE  c.table_name = 'EMPLOYEES'
ORDER  BY c.constraint_name, cc.position;
```

Now you can answer questions like:

- “What is the primary key on this table?”
- “Which columns form this foreign key?”
- “Where are the NOT NULL or CHECK constraints?”

---

## 7. Table and Column Comments – In‑Schema Documentation

You can attach **comments** to tables and columns to document their purpose.

### 7.1 Adding comments

```sql
-- Table comment
COMMENT ON TABLE dept IS 'Demo department table';

-- Column comment
COMMENT ON COLUMN dept.id IS 'Primary key for DEPT';
```

Once set, comments are stored in the dictionary and follow the object around.

### 7.2 Querying comments

Use:

- `USER_TAB_COMMENTS` – comments on your tables.
- `USER_COL_COMMENTS` – comments on your columns.

Examples:

```sql
SELECT table_name,
       comments
FROM   user_tab_comments
WHERE  table_name = 'DEPT';

SELECT table_name,
       column_name,
       comments
FROM   user_col_comments
WHERE  table_name = 'DEPT';
```

This is how GUI tools like SQL Developer show “description” text for tables and columns.

---

## 8. Summary of Key Dictionary Views

Views you should now recognize and know when to use:

- `DICTIONARY` / `DICT` – catalog of all dictionary views and base tables.
- `USER_OBJECTS` – all objects you own (tables, indexes, views, etc.).
- `ALL_OBJECTS` – all objects you can access.
- `USER_TABLES` / `ALL_TABLES` – table‑level information.
- `USER_TAB_COLUMNS` – column‑level information.
- `USER_CONSTRAINTS` – one row per constraint.
- `USER_CONS_COLUMNS` – columns participating in each constraint.
- `USER_TAB_COMMENTS` / `USER_COL_COMMENTS` – table and column documentation.

---

## 9. What You Should Now Be Able to Do

By the end of this lesson, you should be able to:

- Explain what the data dictionary is and why it exists.
- Use `DICTIONARY` to discover relevant metadata views.
- Query `USER_` and `ALL_` views to inspect your own objects and objects you can access.
- Use `USER_TAB_COLUMNS`, `USER_CONSTRAINTS`, and `USER_CONS_COLUMNS` to understand table structures and rules.
- Add and retrieve comments on tables and columns for in‑database documentation.

You now know how to make the database tell you what’s really going on under the hood—which, in practice, is half of “debugging SQL” and roughly 90% of “finding out who to blame for that constraint you didn’t know existed.”
