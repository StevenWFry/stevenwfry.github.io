# 16 – Retrieving Data by Using Subqueries (Because One `SELECT` Wasn’t Enough)

And look, plain single‑table queries are fine… if your data model was designed by a golden retriever. For actual systems, you’re going to need subqueries talking to other subqueries, sometimes about other subqueries. This lesson is where that madness becomes intentional.

After this chapter you should be able to:

- Write **multiple‑column** subqueries (pairwise vs non‑pairwise)  
- Use **scalar** subqueries anywhere a single value can go  
- Solve problems with **correlated** subqueries  
- Use `EXISTS` / `NOT EXISTS` like a grown‑up  
- Use the `WITH` clause (including recursive `WITH`) to keep big queries sane

---

## 1. Subqueries as Data Sources

You’ve already used subqueries in `WHERE` and `HAVING`. Here we lean into them as full‑blown data sources.

Example pattern:

```sql
SELECT d.department_name,
       v.avg_sal
FROM   departments d
NATURAL JOIN (
  SELECT department_id, AVG(salary) AS avg_sal
  FROM   employees
  GROUP  BY department_id
) v;
```

Why do this?

- To prototype the query that will become a **view**  
- To factor complex logic into a readable “inner result set”  
- To join base tables to pre‑aggregated or filtered subsets

Think of the inner `SELECT` as a disposable view you didn’t have to `CREATE`.

---

## 2. Multiple‑Column Subqueries: Pairwise vs Non‑Pairwise

Sometimes your condition depends on **combinations** of columns, not just one. That’s where multiple‑column subqueries show up.

### 2.1 The “John and *that* John’s manager” problem

Goal:  
> “Find employees who work with John **and** are managed by John’s manager – but don’t show John.”

Interpretation 1 – *“any John, any manager”* (non‑pairwise):

```sql
SELECT last_name, department_id, manager_id
FROM   employees
WHERE  department_id IN (
         SELECT department_id
         FROM   employees
         WHERE  first_name = 'John'
       )
AND    manager_id IN (
         SELECT manager_id
         FROM   employees
         WHERE  first_name = 'John'
       )
AND    first_name <> 'John';
```

Here you separately:

- Grab all departments containing a “John”  
- Grab all managers of any “John”  
- Combine them like a Cartesian dating app

Result: potentially more rows than intended, because any “John department” + any “John manager” is allowed.

### 2.2 Pairwise comparison – “*that* John’s manager”

Use a multi‑column subquery to keep department and manager **paired**:

```sql
SELECT last_name, department_id, manager_id
FROM   employees e
WHERE  (department_id, manager_id) IN (
         SELECT department_id, manager_id
         FROM   employees
         WHERE  first_name = 'John'
       )
AND    first_name <> 'John';
```

Key idea:  
`(department_id, manager_id)` on the outer row must match one of the `(department_id, manager_id)` *pairs* returned by the subquery. No cross‑mixing.

**Takeaway:**  
- `(col1, col2) IN (SELECT col1, col2 …)` → **pairwise**  
- `col1 IN (SELECT col1 …) AND col2 IN (SELECT col2 …)` → **non‑pairwise**, more permissive

---

## 3. Scalar Subqueries: Tiny Queries in Weird Places

A **scalar subquery** returns exactly **one row, one column**. Oracle will then happily treat it like a single value.

You can use scalar subqueries:

- Inside `CASE` / `DECODE`  
- In `SELECT`, `WHERE`, `ORDER BY`, `HAVING`  
- In `UPDATE` `SET` and `WHERE` clauses  
- Basically anywhere an expression is allowed (except `GROUP BY`)

### 3.1 Scalar subquery in a `CASE` expression

```sql
SELECT employee_id,
       last_name,
       CASE 
         WHEN department_id = (
                SELECT department_id
                FROM   departments
                WHERE  department_name = 'Sales'
              )
         THEN 'Canada'
         ELSE 'USA'
       END AS country_guess
FROM   employees;
```

Here the inner query returns a single `department_id` (for Sales). The `CASE` reads like:

> if this employee’s `department_id` equals *that* value, label ‘Canada’, else ‘USA’.

### 3.2 Scalar subquery as a “derived column”

Count employees per department without a `JOIN`:

```sql
SELECT d.department_id,
       d.department_name,
       (SELECT COUNT(*)
        FROM   employees e
        WHERE  e.department_id = d.department_id) AS emp_count
FROM   departments d;
```

For each department row, the scalar subquery:

1. Uses `d.department_id` from the outer query  
2. Counts employees in that department  
3. Returns a single number as `emp_count`

Yes, it’s technically a correlated subquery too – welcome to overlapping terminology.

---

## 4. Correlated Subqueries: The Ping‑Pong Pattern

Normal subquery: inner query runs once, outer query uses the result.  
**Correlated** subquery: outer row feeds into the inner query, over and over.

Process:

1. Take a candidate row from the outer query  
2. Plug its values into the subquery  
3. Use subquery result to accept/reject the row  
4. Repeat for the next outer row

### 4.1 Classic: managers vs non‑managers

Non‑correlated version (manager list first):

```sql
-- Managers
SELECT last_name
FROM   employees
WHERE  employee_id IN (
         SELECT DISTINCT manager_id
         FROM   employees
         WHERE  manager_id IS NOT NULL
       );
```

Correlated + `EXISTS` version:

```sql
-- Managers
SELECT e.last_name
FROM   employees e
WHERE  EXISTS (
         SELECT 1
         FROM   employees m
         WHERE  m.manager_id  = e.employee_id
       );
```

Here:

- Outer row = candidate employee `e`  
- Inner query asks, “does anyone have `e.employee_id` as their `manager_id`?”  
- If yes → row qualifies.

Switch to `NOT EXISTS` for non‑managers:

```sql
SELECT e.last_name
FROM   employees e
WHERE  NOT EXISTS (
         SELECT 1
         FROM   employees m
         WHERE  m.manager_id = e.employee_id
       );
```

Unlike `NOT IN`, `NOT EXISTS` doesn’t lose its mind because of a `NULL` in the subquery.

### 4.2 “More than the average salary for their department”

```sql
SELECT e.employee_id,
       e.last_name,
       e.department_id,
       e.salary
FROM   employees e
WHERE  e.salary >
       (SELECT AVG(salary)
        FROM   employees i
        WHERE  i.department_id = e.department_id);
```

Per outer row:

- Grab that employee’s `department_id`  
- Compute the average salary for that department in the inner query  
- Return the row if `salary` exceeds that average

This pattern generalises to “top earners per group”, “rows above group average”, and basically any “compare to group metric” logic without a self‑join.

---

## 5. `EXISTS` and `NOT EXISTS`: Boolean Subqueries

`EXISTS` doesn’t care *what* the subquery returns, only whether it returns **at least one row**.

Basic form:

```sql
SELECT ...
FROM   outer_table o
WHERE  EXISTS (
         SELECT 1
         FROM   inner_table i
         WHERE  i.some_col = o.some_col
       );
```

Notes:

- `SELECT 1` could be `SELECT 'x'` or `SELECT NULL` – it’s ignored.  
- `EXISTS` stops at the **first match**, so it can be more efficient than `IN` on complex subqueries.

Example from the lesson:

- `EXISTS` → employees who **are** managers  
- `NOT EXISTS` → employees who **are not** managers

And crucially, `NOT EXISTS` behaves even if the inner query returns `NULL`s. `NOT IN` with a `NULL` in the subquery, on the other hand, is where logic goes to die.

---

## 6. The `WITH` Clause: CTEs So Your Query Doesn’t Look Like Fan Fiction

And look, once your query gets past about 20 lines, you either:

- Break it up with `WITH` (common table expressions), or  
- End up with a single `SELECT` that no one will ever maintain again.

### 6.1 Non‑recursive `WITH`

Use `WITH` to name subqueries you want to reuse or just stop from visually melting your brain.

```sql
WITH avg_sal_tab AS (
  SELECT AVG(salary) AS avg_sal
  FROM   employees
)
SELECT last_name,
       salary,
       (SELECT avg_sal FROM avg_sal_tab) AS avg_sal
FROM   employees
WHERE  salary >
       (SELECT avg_sal FROM avg_sal_tab);
```

What actually happens:

1. `avg_sal_tab` is materialised in your session’s temp area (or cache).  
2. Main query joins / references it like a tiny, temporary table.  
3. Oracle can reuse that result instead of recomputing the average multiple times.

### 6.2 CTE with grouping per department

From the example:

```sql
WITH cnt_dept AS (
  SELECT department_id,
         COUNT(*) AS dept_count
  FROM   employees
  GROUP  BY department_id
)
SELECT e.employee_id,
       e.salary / d.dept_count AS salary_per_head
FROM   employees e
JOIN   cnt_dept d
  ON   e.department_id = d.department_id;
```

For each employee, you divide their salary by the number of employees in their department (because nothing says “motivation” like seeing your salary diluted by your coworkers).

### 6.3 Recursive `WITH`

Recursive CTEs let you walk hierarchies or paths without writing procedural loops.

Structure:

- **Anchor** query: base rows  
- `UNION ALL`  
- **Recursive** query: reuses the CTE name to build further levels

Flight‑time example (simplified):

```sql
WITH reachable_from (source, destination, total_time) AS (
  -- Anchor: direct flights
  SELECT source, destination, flight_time
  FROM   flights

  UNION ALL

  -- Recursive: extend routes
  SELECT rf.source,
         f.destination,
         rf.total_time + f.flight_time
  FROM   reachable_from rf
  JOIN   flights        f
    ON   rf.destination = f.source
)
SELECT *
FROM   reachable_from;
```

The result includes:

- Direct paths from `flights`  
- Multi‑hop paths with accumulated `total_time`

This lets you answer questions like “how can I get from San Jose to Boston, and how long will it take, assuming planes connect and no one drops my luggage in Denver?”

---

## What You Should Be Able To Do Now

By the end of this lesson, you should be able to:

- Write **multiple‑column subqueries**, and know when to use pairwise vs non‑pairwise comparisons  
- Drop **scalar subqueries** into `SELECT`, `CASE`, `UPDATE`, and enjoy the power  
- Use **correlated subqueries** to compare each row to group metrics or related data  
- Reach for `EXISTS` / `NOT EXISTS` instead of `IN` / `NOT IN` when dealing with complex or `NULL`‑laden subqueries  
- Use the `WITH` clause – including recursive `WITH` – to structure and speed up ugly queries

In other words, you can now write the sort of queries that cause less experienced developers to say “wait, that’s legal?” – and yes, yes it is. Just don’t forget to format them.  

