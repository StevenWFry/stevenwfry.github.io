## Lesson 8 – Using Subqueries to Solve Queries (or: asking your query to ask another query)

And look, sometimes your `WHERE` clause doesn’t know enough to do its job. You want “everyone hired after Davies”, but you don’t actually know when Davies was hired. You could run one query, copy the date, paste it into another query… or you could act like it’s the 21st century and use a **subquery**.

This lesson is about teaching queries to **call other queries**.

You will learn to:

- Define what a subquery is and where it can be used.
- Describe problems that subqueries solve (including “I don’t know the value yet”).
- Identify **single‑row**, **multiple‑row**, and **multiple‑column** subqueries.
- Use appropriate operators with each type (`=`, `IN`, `ANY`, `ALL`, etc.).

---

## 1. What Is a Subquery?

A **subquery** is a query **inside** another query:

- The inner query = **subquery** (or **inner query**).
- The outer query = **main query** (or **outer query**).
- The subquery typically runs **first**, and its result is used by the outer query.

Classic example: “employees hired after Davies” when you don’t know Davies’s hire date.

Step 1 – find Davies’s hire date:

```sql
SELECT hire_date
FROM   employees
WHERE  last_name = 'Davies';
```

Step 2 – use that result in the outer query:

```sql
SELECT last_name,
       hire_date
FROM   employees
WHERE  hire_date > (
         SELECT hire_date
         FROM   employees
         WHERE  last_name = 'Davies'
       );
```

- Subquery returns `29-JAN-2005` (for example).
- Outer query returns everyone hired **after** that date.

Guidelines:

- Enclose subqueries in **parentheses**.
- Put the subquery on the **right side** of the comparison operator; it’s easier to read.
- Use **single‑row operators** with subqueries that return **one row**.
- Use **multiple‑row operators** with subqueries that can return **more than one row**.

---

## 2. Single‑Row vs Multiple‑Row Subqueries

### 2.1 Single‑row subqueries

A **single‑row subquery** returns **exactly one row**.

Single‑row comparison operators:

- `=`
- `>`
- `>=`
- `<`
- `<=`
- `<>` / `!=`

Example – people hired after Davies (single‑row subquery):

```sql
SELECT last_name,
       hire_date
FROM   employees
WHERE  hire_date > (
         SELECT hire_date
         FROM   employees
         WHERE  last_name = 'Davies'
       );
```

If the subquery returns **more than one** row, you get an error like:

> `ORA-01427: single-row subquery returns more than one row`

…which is polite Oracle for “you used the wrong operator.”

### 2.2 Multiple‑row subqueries

A **multiple‑row subquery** can return **several** rows.

Multiple‑row comparison operators:

- `IN` – equals **any** value in the list.
- `ANY` – compares using `=`, `>`, `<`, etc. to **any** value.
- `ALL` – compares using `>`, `<`, etc. to **all** values.

Example – multiple Kings in the data:

```sql
SELECT hire_date
FROM   employees
WHERE  last_name = 'King';
-- returns two hire dates
```

Using a single‑row operator:

```sql
SELECT last_name,
       hire_date
FROM   employees
WHERE  hire_date = (
         SELECT hire_date
         FROM   employees
         WHERE  last_name = 'King'
       );
```

This fails because the subquery returns two rows.

Fix with a multiple‑row operator, e.g. `IN`:

```sql
SELECT last_name,
       hire_date
FROM   employees
WHERE  hire_date IN (
         SELECT hire_date
         FROM   employees
         WHERE  last_name = 'King'
       );
```

`IN` is essentially shorthand for `= ANY`:

```sql
WHERE hire_date = ANY (
        SELECT hire_date
        FROM   employees
        WHERE  last_name = 'King'
     );
```

---

## 3. Single‑Row Subqueries with Group Functions and HAVING

Subqueries often pair with **group functions**.

Example – employees earning the **minimum** salary in the company:

```sql
SELECT last_name,
       salary
FROM   employees
WHERE  salary = (
         SELECT MIN(salary)
         FROM   employees
       );
```

Here the subquery returns a **single value** (the minimum salary), so `=` is valid.

### 3.1 Using subqueries in HAVING

You can use subqueries inside `HAVING` when comparing aggregates.

Example – show departments whose **minimum salary** is greater than the **minimum salary in department 50**:

```sql
SELECT department_id,
       MIN(salary) AS min_sal
FROM   employees
GROUP  BY department_id
HAVING MIN(salary) > (
         SELECT MIN(salary)
         FROM   employees
         WHERE  department_id = 50
       );
```

Here:

- Inner query returns one value: min salary in department 50.
- Outer query compares each department’s `MIN(salary)` against it.

### 3.2 When a group subquery returns multiple rows

If your subquery does **its own** `GROUP BY`, it may return **several** rows:

```sql
SELECT MIN(salary)
FROM   employees
GROUP  BY department_id;
```

Using this with `=` in a `WHERE` or `HAVING` will fail, because it’s now a **multiple‑row** subquery. You must use `IN`, `ANY`, or `ALL`.

For example:

```sql
HAVING MIN(salary) IN (
         SELECT MIN(salary)
         FROM   employees
         GROUP  BY department_id
       );
```

---

## 4. Multiple‑Row Subqueries: IN, ANY, ALL

### 4.1 IN (equals any value in the list)

`IN (subquery)` is the friendliest multiple‑row operator:

```sql
SELECT last_name,
       salary
FROM   employees
WHERE  salary IN (
         SELECT salary
         FROM   employees
         WHERE  department_id = 50
       );
```

This finds employees whose salary matches **any** salary found in department 50.

### 4.2 ANY

`< ANY (subquery)` means “less than **at least one** of these values”.

Example – employees whose salary is less than **any** programmer salary:

```sql
SELECT last_name,
       salary
FROM   employees
WHERE  salary < ANY (
         SELECT salary
         FROM   employees
         WHERE  job_id = 'IT_PROG'
       )
AND    job_id <> 'IT_PROG';
```

If programmer salaries are 9000, 6000, and 4200, then:

- `salary < ANY(...)` means salary < 9000 **or** < 6000 **or** < 4200.
- Effectively: salary < 9000 (the maximum) – quite a broad condition.

### 4.3 ALL

`< ALL (subquery)` means “less than **every** value in the list”.

Using the same set [9000, 6000, 4200]:

```sql
SELECT last_name,
       salary
FROM   employees
WHERE  salary < ALL (
         SELECT salary
         FROM   employees
         WHERE  job_id = 'IT_PROG'
       )
AND    job_id <> 'IT_PROG';
```

- `salary < ALL(...)` means salary < 9000 **and** < 6000 **and** < 4200.
- Which collapses to “salary less than **4200**” – the **minimum** programmer salary.

So:

- `x < ANY (list)` ≈ `x < MAX(list)`.
- `x < ALL (list)` ≈ `x < MIN(list)`.

The same logic applies for `> ANY`, `> ALL`, etc., just inverted.

---

## 5. Multiple‑Column Subqueries

Sometimes you need to match **combinations** of columns.

Example: display all employees who have the **lowest salary in their department**.

You can do this with a multiple‑column subquery:

```sql
SELECT last_name,
       department_id,
       salary
FROM   employees
WHERE  (department_id, salary) IN (
         SELECT department_id,
                MIN(salary)
         FROM   employees
         GROUP  BY department_id
       );
```

Here:

- The subquery returns **pairs**: `(department_id, min_salary_for_that_dept)`.
- The outer query returns employees whose `(department_id, salary)` pair matches one of those.

This is a **pairwise** comparison: both columns must match together.

Multiple‑column subqueries can also appear in the `FROM` clause as inline views, but the main idea is exactly this: let the subquery produce “interesting combinations,” then match against them.

---

## 6. Subqueries and NULL: The NOT IN Trap

Subqueries that return `NULL` values can behave badly with certain operators—especially `NOT IN`.

Example – find employees who are managers:

```sql
SELECT DISTINCT manager_id
FROM   employees;
```

This list often includes a `NULL` (for non‑managed employees).

Now, to list employees **who are managers**:

```sql
SELECT last_name,
       employee_id
FROM   employees
WHERE  employee_id IN (
         SELECT DISTINCT manager_id
         FROM   employees
       );
```

Works fine.

But if you try to find employees who are **not** managers:

```sql
SELECT last_name,
       employee_id
FROM   employees
WHERE  employee_id NOT IN (
         SELECT DISTINCT manager_id
         FROM   employees
       );
```

…and the subquery returns a `NULL`, **no rows** are returned. Why?

Because SQL three‑valued logic plus `NOT IN` and `NULL` combine into a tiny disaster:

- `x NOT IN (1, 2, NULL)` is neither clearly true nor false, so it effectively becomes unknown.

**Fix:** filter out `NULL` in the subquery:

```sql
SELECT last_name,
       employee_id
FROM   employees
WHERE  employee_id NOT IN (
         SELECT DISTINCT manager_id
         FROM   employees
         WHERE  manager_id IS NOT NULL
       );
```

Now the `NOT IN` list has no nulls, and you get the expected non‑manager employees.

Moral: if you use `NOT IN (subquery)`, **always check** whether the subquery can return `NULL`.

---

## 7. When Subqueries Return No Rows

If a subquery returns **no rows**, the comparison usually evaluates to **FALSE** and the outer query returns no rows either.

Example – looking for a job that doesn’t exist:

```sql
SELECT last_name,
       salary
FROM   employees
WHERE  job_id = (
         SELECT job_id
         FROM   employees
         WHERE  job_title = 'ARCHITECT'   -- not present
       );
```

The inner query returns nothing, the outer condition becomes false/unknown, and you get no rows.

This is often a logic bug (“we mis‑typed the filter”), but sometimes exactly what you want.

---

## 8. What You Should Now Be Able to Do

By the end of this lesson, you should be able to:

- Define a subquery and explain how the inner/outer queries relate.
- Choose **single‑row** vs **multiple‑row** operators based on what the subquery returns.
- Use `IN`, `ANY`, and `ALL` correctly for multiple‑row subqueries.
- Write multiple‑column subqueries for pairwise comparisons (e.g., lowest salary per department).
- Use subqueries in `WHERE` and `HAVING` to compare against aggregated values.
- Avoid common pitfalls, especially `NOT IN` with `NULL` values.

You can now write queries that **figure out their own criteria** instead of waiting for a human to copy‑paste values, which is both more powerful and less error‑prone—unless, of course, you forget that `NULL` exists.
