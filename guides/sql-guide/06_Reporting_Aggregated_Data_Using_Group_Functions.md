## Lesson 6 – Reporting Aggregated Data Using Group Functions (or: how to stop counting things by hand)

And look, at some point “one row per employee” stops cutting it. HR doesn’t want *every* salary; they want **average salary by department**, or **total pay for sales reps**, or “how many people do we even have?”. That’s where **group functions** show up and say: “What if we crushed all these rows down into one useful number?”

In this lesson you will learn to:

- Identify the main **group (aggregate) functions**.
- Describe how group functions work.
- Group data with `GROUP BY`.
- Filter groups with `HAVING`.

---

## 1. Group Functions: What They Are and Why They Exist

Group (aggregate) functions operate on **sets of rows** and return **one result per group**.

Common group functions:

- `AVG` – average value.
- `SUM` – total of values.
- `MIN` – smallest value.
- `MAX` – largest value.
- `COUNT` – how many rows/values.
- `LISTAGG` – concatenates values into a single string (Oracle).
- `STDDEV` – standard deviation.
- `VARIANCE` – variance.

Syntax pattern:

```sql
SELECT AVG(salary)   AS avg_sal,
       SUM(salary)   AS total_sal,
       MIN(salary)   AS min_sal,
       MAX(salary)   AS max_sal
FROM   employees
WHERE  job_id LIKE '%REP%';
```

- Input: many `salary` values.
- Output: **one row** with four aggregated numbers.

Group functions ignore `NULL` values in their input columns—unless you drag them back in with something like `NVL`/`IFNULL`.

---

## 2. AVG, SUM, MIN, MAX, COUNT – The Core Four (Plus One)

### 2.1 AVG and SUM

Example:

```sql
SELECT AVG(salary) AS avg_sal,
       SUM(salary) AS total_sal
FROM   employees
WHERE  job_id LIKE '%REP%';
```

- `AVG` and `SUM` consider only **non‑NULL** `salary` values.
- If some salaries were `NULL`, they simply don’t participate.

### 2.2 MIN and MAX

Work on **numbers, text, and dates**.

```sql
SELECT MIN(salary) AS lowest_pay,
       MAX(salary) AS highest_pay
FROM   employees;

SELECT MIN(last_name) AS first_name_alpha,
       MAX(last_name) AS last_name_alpha
FROM   employees;

SELECT MIN(hire_date) AS earliest_hire,
       MAX(hire_date) AS latest_hire
FROM   employees;
```

- For text, “minimum” and “maximum” are alphabetical.
- For dates, they’re earliest and latest in time.

### 2.3 COUNT

Two important forms:

- `COUNT(*)` – count **all rows** (including rows where some columns are `NULL`).
- `COUNT(expr)` – count rows where `expr` is **not NULL**.

Examples:

```sql
-- Total employees
SELECT COUNT(*) AS total_emps
FROM   employees;               -- e.g., 107

-- How many employees have a commission
SELECT COUNT(commission_pct) AS commission_emps
FROM   employees;               -- NULL values ignored
```

If you want to count only unique values, add `DISTINCT`.

---

## 3. DISTINCT and NULLs in Group Functions

`DISTINCT` with aggregates lets you ignore duplicate values.

Example – distinct department IDs:

```sql
SELECT COUNT(department_id)          AS dept_count_incl_nulls,
       COUNT(DISTINCT department_id) AS distinct_depts
FROM   employees;
```

- `COUNT(department_id)` returns the number of **non‑NULL** department IDs (e.g., 106).
- `COUNT(DISTINCT department_id)` returns the number of **unique, non‑NULL** department IDs (e.g., 11).

If you query the values directly:

```sql
SELECT DISTINCT department_id
FROM   employees;
```

You may see 12 rows including one `NULL`, which explains why `COUNT(DISTINCT department_id)` returned 11.

### 3.1 Forcing NULLs into the party with NVL / IFNULL

By default, aggregates ignore `NULL`s. To include them, substitute a placeholder value first.

Example – average commission **only** across employees who earn one:

```sql
SELECT AVG(commission_pct) AS avg_comm_sales_only
FROM   employees;
```

Example – average commission across **all employees** (non‑sales treated as 0):

```sql
SELECT AVG(NVL(commission_pct, 0)) AS avg_comm_all
FROM   employees;
```

MySQL version:

```sql
SELECT AVG(IFNULL(commission_pct, 0)) AS avg_comm_all
FROM   employees;
```

Now every employee contributes to the average, even those with no commission.

---

## 4. GROUP BY – Turning a Single Result into Many Named Groups

Without grouping, aggregates collapse all rows into **one** result.

```sql
-- Grand total salary cost
SELECT SUM(salary) AS total_salary
FROM   employees;
```

To see totals **per department**, you add `GROUP BY`:

```sql
SELECT department_id,
       SUM(salary) AS total_sal
FROM   employees
GROUP  BY department_id;
```

Rules:

- Every column or expression in the `SELECT` list that **is not** an aggregate
  **must appear** in the `GROUP BY` clause.
- Otherwise, you get errors like `not a GROUP BY expression` or `not a single-group group function`.

Example error case:

```sql
SELECT department_id,
       SUM(salary)
FROM   employees;
-- ERROR: not a single-group group function
```

Fix with `GROUP BY department_id`.

### 4.1 GROUP BY without selecting the grouping column

Odd but legal: you can group by something you don’t display.

```sql
SELECT AVG(salary) AS avg_sal
FROM   employees
GROUP  BY department_id;
```

This returns one average per department, but without showing which department is which. It’s allowed; it’s just not very helpful unless you’re using the result as a subquery.

### 4.2 Grouping by multiple columns

You can group on more than one column.

```sql
SELECT department_id,
       manager_id,
       SUM(salary) AS total_sal
FROM   employees
GROUP  BY department_id, manager_id;
```

Now you get **sum of salaries per (department, manager)** pair.

If you forget to include `manager_id` in the `GROUP BY` here, Oracle will complain loudly.

---

## 5. HAVING – Filtering Groups After Aggregation

`WHERE` filters **rows** before grouping. `HAVING` filters **groups** after aggregation.

Example – total salary per department, but only show departments where total salary > 7000:

```sql
SELECT department_id,
       SUM(salary) AS total_sal
FROM   employees
GROUP  BY department_id
HAVING SUM(salary) > 7000;
```

Execution order (conceptually):

1. `FROM` – choose the table.
2. `WHERE` – filter individual rows.
3. `GROUP BY` – form groups.
4. Aggregate functions – compute `SUM`, `AVG`, etc. per group.
5. `HAVING` – filter groups based on aggregated values.
6. `ORDER BY` – sort the final result.

### 5.1 You can’t use group functions in WHERE

This fails:

```sql
SELECT department_id,
       SUM(salary)
FROM   employees
WHERE  SUM(salary) > 7000
GROUP  BY department_id;
-- ERROR: group function is not allowed here
```

Because `WHERE` happens **before** grouping, it can’t see `SUM(salary)` yet.

Instead, filter rows in `WHERE`, and filter aggregated results in `HAVING`.

Example combining both:

```sql
SELECT job_id,
       SUM(salary) AS total_sal
FROM   employees
WHERE  job_id NOT LIKE '%REP%'         -- remove reps entirely
GROUP  BY job_id
HAVING SUM(salary) > 20000            -- only big totals
ORDER  BY total_sal DESC;
```

- `WHERE` removes reps before any grouping.
- `GROUP BY` aggregates remaining rows by `job_id`.
- `HAVING` keeps only job groups with `SUM(salary) > 20000`.

---

## 6. Nesting Group Functions (But Only a Little)

You can nest group functions, but Oracle limits the depth to **two**.

Example – average of department averages (conceptual):

```sql
SELECT AVG(avg_sal)
FROM (
  SELECT department_id,
         AVG(salary) AS avg_sal
  FROM   employees
  GROUP  BY department_id
);
```

Within a **single** `SELECT`, you can nest aggregates like:

```sql
SELECT MAX(AVG(salary))
FROM   employees
GROUP  BY department_id;
```

But if you nest more deeply (e.g., `SUM(MAX(AVG(...)))`), Oracle will complain: `group function is nested too deeply`.

For anything complex, it’s usually clearer to compute one aggregate layer in a subquery, then aggregate that.

---

## 7. MySQL Grouping and Aggregation

Everything you’ve seen conceptually also exists in MySQL with nearly identical syntax:

```sql
SELECT department_id,
       AVG(salary) AS avg_sal,
       COUNT(*)    AS emp_count
FROM   employees
GROUP  BY department_id
HAVING AVG(salary) > 8000
ORDER  BY avg_sal DESC;
```

- Aggregates ignore `NULL`s.
- `IFNULL` can be used to substitute values before aggregating.
- `GROUP BY` and `HAVING` rules are the same.

Just watch for MySQL‑specific default behaviors around `ONLY_FULL_GROUP_BY` mode; stricter settings require explicit `GROUP BY` on all non‑aggregates, which aligns with Oracle’s rules.

---

## 8. What You Should Now Be Able to Do

By the end of this lesson, you should be able to:

- Use group functions (`COUNT`, `MAX`, `MIN`, `SUM`, `AVG`, and friends) to summarize data.
- Explain how aggregates handle `NULL` values, and use `NVL` / `IFNULL` to include them when needed.
- Write queries with `GROUP BY` to produce per‑group results.
- Use `HAVING` to include or exclude groups based on aggregated values.
- Recognize when grouping rules require you to add columns to the `GROUP BY` clause.

In short, you can now make the jump from “tell me about every employee” to “tell me about each **department** / manager / job as a whole”—which is how you accidentally become the person everyone asks for reports.
