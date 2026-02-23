# 17 – Manipulating Data by Using Subqueries (Your DML, But Smarter)

And look, selecting with subqueries is all very nice, but at some point someone will say, “Can we actually *change* the data based on that logic?” This is where we stop just **observing** the mess and start **editing** it.

After this lesson you should be able to:

- Use subqueries inside DML statements (`INSERT`, `UPDATE`, `DELETE`)  
- Insert into inline views with `WITH CHECK OPTION` so the data can’t escape its own filter  
- Use correlated subqueries to update and delete rows safely

---

## 1. Using Subqueries to Manipulate Data

Subqueries aren’t just for `SELECT`:

- Use them as **sources** when inserting rows  
- Use correlated subqueries to **update** values based on other tables  
- Use correlated subqueries to **delete** rows that shouldn’t be there

High‑level patterns:

```sql
INSERT INTO target_table (cols...)
SELECT ...
FROM   source_table
WHERE  ...;

UPDATE target_table t
SET    col = (
         SELECT ...
         FROM   other_table o
         WHERE  o.key = t.key
       );

DELETE FROM target_table t
WHERE  EXISTS (
         SELECT 1
         FROM   other_table o
         WHERE  o.key = t.key
       );
```

Think of them as DML statements with built‑in lookups, instead of forcing you to write nasty procedural loops.

---

## 2. Inserting Into a Subquery (Yes, Really)

You can insert **through** a subquery / inline view, but only if Oracle can trace each row back to a single base table row. This is where `WITH CHECK OPTION` becomes the bouncer at the door.

### 2.1 Basic insert through an inline view

Imagine a view (or inline view) that only shows locations in **Europe**:

```sql
INSERT INTO (
  SELECT l.location_id,
         l.street_address,
         c.country_id,
         c.country_name,
         r.region_name
  FROM   locations l
  JOIN   countries c USING (country_id)
  JOIN   regions   r USING (region_id)
  WHERE  r.region_name = 'Europe'
)
VALUES (3000, '123 Example St', 'DE', 'Germany', 'Europe');
```

This works because:

- The inline view is updatable (single base table per column, no weird grouping)  
- The inserted row satisfies the `WHERE region_name = 'Europe'` filter

### 2.2 Preventing “filter‑breaking” DML with `WITH CHECK OPTION`

Now add a **constraint** to that inline view:

```sql
INSERT INTO (
  SELECT l.location_id,
         l.street_address,
         c.country_id,
         c.country_name,
         r.region_name
  FROM   locations l
  JOIN   countries c USING (country_id)
  JOIN   regions   r USING (region_id)
  WHERE  r.region_name = 'Europe'
  WITH CHECK OPTION
)
VALUES (3001, '1 Wall St', 'US', 'United States', 'Americas');
```

This fails with:

> ORA‑01402: view WITH CHECK OPTION where‑clause violation

Why?

- You’re trying to insert a row where `region_name = 'Americas'`  
- That row **would not appear** in this inline view (its filter is `region_name = 'Europe'`)  
- `WITH CHECK OPTION` says: “If I can’t see it, you can’t insert or update it through me.”

**Key idea:** `WITH CHECK OPTION` guarantees that any row modified through the view/inline view still satisfies its `WHERE` clause afterwards.

---

## 3. Correlated Subqueries in `UPDATE`

Sometimes you need to copy data from one table into another without doing a big multi‑table `UPDATE` with joins. Correlated subqueries are your friend here.

### 3.1 Add a `department_name` column and populate it

Suppose you’ve cloned `EMPLOYEES` into `EMPL6`, but forgotten `DEPARTMENT_NAME`. You add it:

```sql
ALTER TABLE empl6
  ADD department_name VARCHAR2(30);
```

Now populate it based on the `DEPARTMENTS` table:

```sql
UPDATE empl6 e
SET    department_name = (
         SELECT d.department_name
         FROM   departments d
         WHERE  d.department_id = e.department_id
       );
```

How it works:

- For each row in `EMPL6` (outer query), the correlated subquery:  
  - Looks up the matching `DEPARTMENTS` row by `department_id`  
  - Returns exactly one `department_name`  
  - Assigns it to `e.department_name`

Good news: no cursor loops, no procedural code, just one SQL statement.

---

## 4. Correlated Subqueries in `DELETE`

Deleting rows “that match something somewhere else” is where correlated deletes shine.

### 4.1 Remove “former employees” from the current list

You have:

- `EMPL6` – current employees (supposedly)  
- `EMP_HISTORY` – former employees

You want to delete from `EMPL6` any rows that also appear in `EMP_HISTORY` by `employee_id`.

```sql
DELETE FROM empl6 e
WHERE  EXISTS (
         SELECT 1
         FROM   emp_history h
         WHERE  h.employee_id = e.employee_id
       );
```

Effect:

- For each `EMPL6` row, Oracle checks whether a matching `EMP_HISTORY` row exists  
- If so, that `EMPL6` row is deleted  
- Everyone who looks suspiciously like they’ve already left the company gets removed from the “current” table

You can invert this pattern with `NOT EXISTS` if you ever want to keep only rows that **don’t** match.

---

## 5. Summary – What You Can Do Now (Besides Terrify Junior Devs)

By the end of this lesson, you should be able to:

- Use subqueries **inside DML**, not just in `SELECT`  
- Insert through views/inline views and enforce their filters with `WITH CHECK OPTION`  
- Use **correlated updates** to copy data from reference tables into working tables  
- Use **correlated deletes** to clean up rows based on related tables

Subqueries are no longer just the thing that makes `WHERE` clauses longer. They’re now the thing that also makes your `INSERT`, `UPDATE`, and `DELETE` statements more powerful – and, if you’re not careful, more destructive. So… be careful.  

