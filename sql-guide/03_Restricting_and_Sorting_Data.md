## Lesson 3 – Restricting and Sorting Data (or: teaching your queries to have standards)

And look, a `SELECT` that returns every row in a table is technically correct, but it’s also the database equivalent of shouting “EVERYBODY IN HERE” and being surprised when you get trampled. In real life you almost always want **some** rows, in **some** order.

In this lesson you will learn to:

- Limit which rows are returned using the `WHERE` clause.
- Use comparison operators, ranges, lists, and pattern matching.
- Handle `NULL` conditions properly.
- Combine conditions with `AND`, `OR`, and `NOT` (without confusing yourself).
- Sort results using `ORDER BY` on columns, aliases, and positions.
- Use row limiting (`FETCH` / `LIMIT`) for “Top‑N” style reports.
- Add flexibility with substitution variables (`&` / `&&`) and MySQL user variables.

---

## 1. The WHERE Clause: Because “everyone” is rarely the right answer

Previously, you wrote queries like:

```sql
SELECT employee_id,
       last_name,
       job_id,
       department_id
FROM   employees;
```

That returns *every* employee. But if you only want employees in **department 90**, you add a **filter**:

```sql
SELECT employee_id,
       last_name,
       job_id,
       department_id
FROM   employees
WHERE  department_id = 90;
```

Key points:

- `WHERE` comes **after** `FROM`.
- The condition must evaluate to **TRUE** for a row to be returned.
- Character and date literals must be in **single quotes**:

  ```sql
  WHERE last_name = 'Whalen'
  WHERE hire_date = DATE '2015-01-01'
  ```

Default date display formats:

- Oracle: `DD-MON-RR` (with the `RR` year format doing “rounded century” magic).
- MySQL: `YYYY-MM-DD`.

Also: data values are often **case‑sensitive**. If `Whalen` is stored as `Whalen` (InitCap), searching for `'whalen'` may **not** match, depending on collation. SQL keywords can be lazy about case; your data cannot.

---

## 2. Comparison Operators: Making the database pick a side

You can filter on:

- `=`  equal to
- `>`  greater than
- `>=` greater than or equal to
- `<`  less than
- `<=` less than or equal to
- `<>` or `!=` not equal

Examples:

```sql
-- Salary less than or equal to 3000
SELECT last_name,
       salary
FROM   employees
WHERE  salary <= 3000;

-- Find a specific last name
SELECT last_name,
       salary
FROM   employees
WHERE  last_name = 'Abel';
```

So yes, this is where you start drawing arbitrary salary lines in the sand.

---

## 3. Ranges with BETWEEN (and NOT BETWEEN)

To filter within a range, use `BETWEEN`:

```sql
SELECT last_name,
       salary
FROM   employees
WHERE  salary BETWEEN 10000 AND 17000;
```

Important:

- `BETWEEN` is **inclusive** – it includes 10000 and 17000.
- The **lower bound** must be on the left, upper bound on the right.

To exclude the range, use `NOT`:

```sql
SELECT last_name,
       salary
FROM   employees
WHERE  salary NOT BETWEEN 10000 AND 17000;
```

Same idea in Oracle and MySQL; the math is equally unforgiving in both.

---

## 4. Lists with IN (and NOT IN)

If you want rows that match **one of several** values, you can either chain `OR`s like it’s 1995…

```sql
WHERE department_id = 20 OR department_id = 90
```

…or you can use `IN`:

```sql
WHERE department_id IN (20, 90);

-- More values? Just add them
WHERE department_id IN (20, 50, 90);
```

To get everyone **except** those departments:

```sql
WHERE department_id NOT IN (20, 50, 90);
```

The database understands “in this group” more gracefully than most people do.

---

## 5. Pattern Matching with LIKE, Wildcards, and ESCAPE

Sometimes you don’t know exactly what you’re looking for, just the **shape** of it. That’s `LIKE`.

Wildcards:

- `%` – zero or more characters.
- `_` – exactly one character.

Examples:

```sql
-- Last names starting with capital H
WHERE last_name LIKE 'H%';

-- Last names containing capital H anywhere
WHERE last_name LIKE '%H%';

-- Last names where the third character is 'n'
WHERE last_name LIKE '__n%';
```

Now, what if the data itself contains an underscore or percent sign, like job IDs `SA_REP`?

By default, `_` and `%` are wildcards. To treat them as **literal characters**, use the `ESCAPE` clause:

```sql
WHERE job_id LIKE 'SA\_%' ESCAPE '\';
```

Here:

- `\_` means “actual underscore” instead of “any single character.”
- `%` still acts as “zero or more characters.”

The pattern tools are powerful. They’re also how you accidentally discover everyone named “King” when you weren’t emotionally ready for that.

---

## 6. Testing for NULL

To find rows **with** or **without** values, use `IS NULL` and `IS NOT NULL`.

Example – employees without a manager:

```sql
SELECT last_name,
       manager_id
FROM   employees
WHERE  manager_id IS NULL;
```

This usually gives you the top of the org chart (e.g., King) – the person who reports to no one.

Employees **with** a manager:

```sql
WHERE manager_id IS NOT NULL;
```

Never use `= NULL` or `<> NULL`. SQL will quietly evaluate those to unknown, and you’ll get **no rows** and lots of confusion.

---

## 7. Logical Operators: AND, OR, NOT (and how they actually behave)

You can combine conditions using:

- `AND` – returns TRUE only if **both** conditions are TRUE.
- `OR`  – returns TRUE if **either** condition is TRUE.
- `NOT` – reverses the result.

Examples:

```sql
-- Salary = 10000 OR department = 90
SELECT last_name,
       salary,
       department_id
FROM   employees
WHERE  salary = 10000
   OR  department_id = 90;
```

- This returns anyone making 10000 **plus** anyone in department 90.

```sql
-- Salary = 24000 AND department = 90
WHERE salary = 24000
  AND department_id = 90;
```

- This returns employees who meet **both** conditions.

`NOT` flips truth:

```sql
-- Employees who DO have a manager
WHERE NOT manager_id IS NULL;

-- Employees whose job_id is none of these
WHERE job_id NOT IN ('AD_PRES', 'AD_VP', 'AD_ASST');
```

### 7.1 Operator precedence and parentheses

Precedence (highest to lowest):

1. `NOT`
2. `AND`
3. `OR`

So this:

```sql
WHERE salary >= 10000
  AND job_id LIKE '%MAN%';
```

…does what you expect. But once you mix `AND` and `OR`, it gets tricky.

Example 1:

```sql
WHERE department_id = 80
  AND salary > 10000
   OR department_id = 60;
```

Interpreted as:

```sql
WHERE (department_id = 80 AND salary > 10000)
   OR department_id = 60;
```

Example 2 (with parentheses):

```sql
WHERE (department_id IN (60, 80))
  AND salary > 10000;
```

Completely different result set.

Moral: when mixing `AND` and `OR`, **always use parentheses**, unless you enjoy subtle, production‑grade bugs.

---

## 8. Sorting with ORDER BY

By default, queries return rows in whatever order the database finds convenient—often “deeply unhelpful.” Use `ORDER BY` to fix that.

Syntax:

```sql
SELECT last_name,
       manager_id,
       department_id
FROM   employees
ORDER BY manager_id;
```

- Default sort order is **ascending** (`ASC`).
- You can specify explicitly:

  ```sql
  ORDER BY manager_id ASC;
  ORDER BY manager_id DESC;
  ```

Using multiple sort keys:

```sql
ORDER BY department_id ASC,
         manager_id   DESC;
```

- First sorted by department.
- Within each department, managers are sorted highest to lowest.

You can also sort by **column position** (less readable, but works):

```sql
-- Sort by the 2nd column, then 3rd
ORDER BY 2 ASC,
         3 DESC;
```

Or by **alias**:

```sql
SELECT last_name AS lname,
       salary
FROM   employees
ORDER BY lname;
```

If you used double quotes in the alias (`"LName"`), you must use the same case and quotes in `ORDER BY`.

NULLs typically sort:

- Last for ascending order.
- First for descending order.

(Exact behavior can vary by DB and settings.)

---

## 9. Row Limiting: Top‑N and Pagination

Sometimes you only want the **top few** rows—highest salaries, latest hires, etc.

### 9.1 Oracle row limiting with FETCH

Example – top 5 salaries:

```sql
SELECT last_name,
       salary
FROM   employees
ORDER BY salary DESC
FETCH FIRST 5 ROWS ONLY;
```

With ties:

```sql
FETCH FIRST 2 ROWS WITH TIES;
```

- If the 2nd and 3rd rows have the same salary, both are returned.

Pagination with offset:

```sql
ORDER BY salary DESC
OFFSET 5 ROWS
FETCH NEXT 5 ROWS ONLY;
```

- Skips the first 5 rows and returns the next 5.

You can also limit by **percentage**:

```sql
FETCH FIRST 5 PERCENT ROWS ONLY;
```

On a 107‑row table, 5% ≈ 6 rows.

### 9.2 MySQL LIMIT

MySQL uses `LIMIT` instead:

```sql
-- First 7 rows
SELECT last_name, salary
FROM   employees
ORDER BY salary DESC
LIMIT 7;

-- Skip first 5, return next 7
SELECT last_name, salary
FROM   employees
ORDER BY salary DESC
LIMIT 7 OFFSET 5;
```

Same idea, different syntax.

---

## 10. Substitution Variables (Oracle): Making Queries Ask Questions

Sometimes you don’t want to hard‑code a value; you want the **user** to supply it at runtime. Enter **substitution variables**.

They start with:

- `&variable_name` – prompt the user each time it’s encountered.
- `&&variable_name` – prompt **once**, then reuse the value for the rest of the session.

Example – prompt for department:

```sql
SELECT last_name,
       salary,
       department_id
FROM   employees
WHERE  department_id = &dept_id;
```

When executed, SQL Developer/SQL*Plus prompts:

> Enter value for dept_id:

Type `90`, and the query runs with `WHERE department_id = 90`.

### 10.1 Single vs double ampersand

Using the same variable twice:

```sql
SELECT last_name,
       &column_name
FROM   employees
ORDER BY &column_name;
```

With a **single** `&`, you’ll be prompted **twice**.

With `&&` on the first occurrence:

```sql
SELECT last_name,
       &&column_name
FROM   employees
ORDER BY &column_name;
```

- Prompted once.
- The value is remembered for the rest of the session.

To clear it:

```sql
UNDEFINE column_name;
```

### 10.2 Quotes for character and date input

If your variable is used where a **string** or **date** is expected, surround the variable with single quotes:

```sql
WHERE last_name = '&last_name';

WHERE hire_date = DATE '&hire_date';
```

Numbers do **not** need quotes.

### 10.3 VERIFY and ECHO

In SQL*Plus / script-style output you can:

- `SET VERIFY ON` – shows the original statement and the version with substituted values.
- `SET ECHO ON` – prints each command before its output.

Both are useful for figuring out what actually ran, especially when multiple variables are involved.

---

## 11. MySQL User Variables

MySQL doesn’t use `&` substitution; it uses **user-defined variables** with `@`.

Example:

```sql
SET @employee_num = 200;

SELECT last_name,
       salary
FROM   employees
WHERE  employee_id = @employee_num;
```

You assign them with `SET` or in queries, and refer to them using `@variable_name`.

---

## 12. What You Should Now Be Able to Do

By the end of this lesson, you should be able to:

- Limit rows with `WHERE` using comparison, range, list, pattern, and `NULL` conditions.
- Combine conditions safely with `AND`, `OR`, and `NOT`, using parentheses to control precedence.
- Sort results using `ORDER BY` with columns, aliases, and positions.
- Use row limiting (`FETCH` in Oracle, `LIMIT` in MySQL) for Top‑N and pagination.
- Use substitution variables (`&`, `&&`, `DEFINE`, `UNDEFINE`) in Oracle to make queries interactive.
- Use MySQL user variables to parameterize conditions.

You now have enough control to ask the database *exactly* who you want and *exactly* how you want them sorted—which, to be clear, is both extremely useful and exactly how bad dashboards are born.
