## Lesson 4 – Using Single-Row Functions to Customize Output (or: teaching your data a few party tricks)

And look, raw table data is honest, but it’s also aggressively unhelpful. Sometimes you want names capitalized nicely, salaries rounded, dates massaged into something readable, or strings glued together so they actually tell a story.

This is where **single-row functions** show up and say: “What if we made this look less like a spreadsheet export and more like something a human can read?”

In this lesson you will learn to:

- Describe the main categories of SQL functions.
- Use **character**, **number**, and **date** functions in `SELECT` statements.
- Nest functions to transform data in multiple ways at once.
- Understand key differences between Oracle and MySQL for these functions.

---

## 1. Single-Row vs Multi-Row Functions

SQL functions take **inputs** (arguments) and return **outputs** (values):

- Some accept **multiple arguments**.
- A few accept **no arguments** at all (e.g., `SYSDATE` in Oracle, `CURDATE()` in MySQL).
- All of them **return a value**.

Two big families:

- **Single-row functions** – operate on each row **individually** and return **one result per row**.
  - Example: `UPPER(last_name)` for every employee.
- **Multiple-row (aggregate) functions** – operate on **groups of rows** and return **one result per group**.
  - Example: `AVG(salary)` across all employees in China.

This lesson is about the first group – single-row functions – the ones you use to customize how individual rows look.

Single-row functions can:

- Modify data values (strings, numbers, dates).
- Possibly change the **data type** of the result.
- Be **nested** (function inside function).
- Accept arguments that are columns, constants, or expressions.

Main categories:

- Character functions
- Number functions
- Date functions
- Conversion functions
- General functions

We’ll focus on the first three.

---

## 2. Character Functions – Fixing Your Strings

Character functions manipulate text. Some change **case**; others slice, pad, or search strings.

### 2.1 Case-conversion: LOWER, UPPER, INITCAP

- `LOWER` – converts text to lowercase.
- `UPPER` – converts text to uppercase.
- `INITCAP` (Oracle) – capitalizes the first letter of each word.

Examples (Oracle & MySQL):

```sql
SELECT LOWER('Hello World')  AS all_lower,
       UPPER('Hello World')  AS all_upper
FROM   dual;        -- Oracle
```

```sql
SELECT LOWER('Hello World') AS all_lower,
       UPPER('Hello World') AS all_upper;
-- MySQL (no need for dual)
```

Oracle-only INITCAP:

```sql
SELECT INITCAP('hello world') AS nice_title
FROM   dual;
-- Result: 'Hello World'
```

These are especially handy for **case-insensitive searches**:

```sql
SELECT employee_id, last_name
FROM   employees
WHERE  UPPER(last_name) = UPPER('whalen');
```

On Oracle, this forces both sides to uppercase so you stop losing rows to picky capitalization.

> Note: MySQL is often case-insensitive by default for string comparisons, depending on collation, so this is less critical there.

---

### 2.2 CONCAT, SUBSTR/SUBSTRING, LENGTH, INSTR/INSTRING, LPAD, RPAD, TRIM, REPLACE

These are the Swiss Army knives of string manipulation.

#### CONCAT

Oracle:

- `CONCAT` takes **exactly two arguments**.
- To join more than two pieces, you **nest** it, or just use `||` instead.

```sql
SELECT CONCAT('Hello', ' World') AS greeting
FROM   dual;

-- Nesting
SELECT CONCAT(CONCAT('Hello', ' '), 'World') AS greeting
FROM   dual;
```

In Oracle, `first_name || ' ' || last_name` is usually easier.

MySQL:

- `CONCAT` can take **many arguments**:

```sql
SELECT CONCAT(first_name, ' ', last_name, ' is a ', job_id) AS description
FROM   employees;
```

#### SUBSTR / SUBSTRING

In Oracle: `SUBSTR(string, start_position [, length])`

```sql
-- First five characters
SELECT SUBSTR('Hello World', 1, 5) AS first_part FROM dual;  -- 'Hello'

-- Start at 7th character, 5 characters long
SELECT SUBSTR('Hello World', 7, 5) AS second_part FROM dual; -- 'World'

-- Start at 7th character, everything after
SELECT SUBSTR('Hello World', 7) AS rest FROM dual;           -- 'World'

-- Last character (negative start counts from the right)
SELECT SUBSTR('Hello World', -1, 1) AS last_char FROM dual;  -- 'd'
```

MySQL uses `SUBSTRING` with similar arguments.

#### LENGTH

Returns the number of characters:

```sql
SELECT LENGTH('Hello World') AS len FROM dual;  -- 11
```

(5 letters + space + 5 letters.)

#### INSTR (Oracle) / INSTR/LOCATE (MySQL)

Finds the **position** of a substring.

Oracle: `INSTR(string, substring [, start_position [, occurrence]])`

```sql
-- First occurrence of 'l'
SELECT INSTR('Hello World', 'l') AS first_l FROM dual;        -- 3

-- Second occurrence of 'l'
SELECT INSTR('Hello World', 'l', 1, 2) AS second_l FROM dual; -- 4

-- Third occurrence of 'l'
SELECT INSTR('Hello World', 'l', 1, 3) AS third_l FROM dual;  -- 10

-- Search from the right (negative start)
SELECT INSTR('Hello World', 'l', -1, 1) FROM dual;           -- 10
```

MySQL’s `INSTR` and `LOCATE` provide similar behavior (with slightly different parameter ordering).

#### LPAD and RPAD

Pad a string to a certain length with a fill character.

```sql
SELECT LPAD('Hello World', 15, '*') AS left_padded,
       RPAD('Hello World', 15, '*') AS right_padded
FROM   dual;

-- Result examples:
-- left_padded:  '****Hello World'
-- right_padded: 'Hello World****'
```

#### TRIM

Trim unwanted characters from the start and/or end.

Oracle default (both sides):

```sql
SELECT TRIM('d' FROM 'ddolly Worldd') AS trimmed FROM dual;
-- 'olly World'
```

You can also specify `LEADING` or `TRAILING`:

```sql
SELECT TRIM(LEADING 'd' FROM 'ddolly Worldd')   FROM dual; -- 'olly Worldd'
SELECT TRIM(TRAILING 'd' FROM 'ddolly Worldd')  FROM dual; -- 'ddolly World'
```

By default, without parameters, `TRIM` removes whitespace.

#### REPLACE

Replace all occurrences of a substring.

```sql
SELECT REPLACE('Jack and Jill', 'J', 'Z') AS new_text
FROM   dual;
-- 'Zack and Zill'
```

Put all of these together and, suddenly, your text columns look like they came from a UI designer instead of a log file.

---

### 2.3 Nesting Character Functions

You can stack functions to get multiple transformations in one expression.

Example:

```sql
SELECT UPPER(SUBSTR(last_name, 1, 8) || '_US') AS tag
FROM   employees;
```

Order of evaluation is from **innermost** to **outermost**:

1. `SUBSTR(last_name, 1, 8)` – first 8 characters.
2. `|| '_US'` – append `'_US'`.
3. `UPPER(...)` – convert everything to uppercase.

It’s like a tiny factory pipeline for each value.

---

## 3. Number Functions – Taming Your Decimals

Number functions manipulate numeric data. Common ones:

- `ROUND` – rounds a number.
- `TRUNC` (Oracle) / `TRUNCATE` (MySQL) – cuts off digits without rounding.
- `CEIL` / `CEILING` – smallest integer **greater than or equal to** a value.
- `FLOOR` – largest integer **less than or equal to** a value.
- `MOD` – remainder of division.

### 3.1 ROUND and TRUNC

Syntax (Oracle): `ROUND(number [, decimal_places])`, `TRUNC(number [, decimal_places])`.

Examples:

```sql
SELECT ROUND(45.926, 2) AS rounded_2,   -- 45.93
       TRUNC(45.926, 2) AS truncated_2  -- 45.92
FROM   dual;

SELECT ROUND(45.926, 0) AS rounded_0,   -- 46
       TRUNC(45.926, 0) AS truncated_0  -- 45
FROM   dual;

SELECT ROUND(45.926, -1) AS round_tens, -- 50
       TRUNC(45.926, -1) AS trunc_tens  -- 40
FROM   dual;
```

If you omit the second argument, both default to 0 (round/truncate at the decimal point).

MySQL:

- Uses `TRUNCATE(number, decimal_places)` instead of `TRUNC`.

### 3.2 CEIL / FLOOR / MOD

```sql
SELECT CEIL(45.1)   AS ceil_val,   -- 46
       FLOOR(45.9)  AS floor_val,  -- 45
       MOD(1600,300) AS remainder   -- 100
FROM   dual;
```

Example – find employees with even `employee_id` values:

```sql
SELECT employee_id,
       last_name
FROM   employees
WHERE  MOD(employee_id, 2) = 0;
```

If the remainder when dividing by 2 is 0, the number is even.

---

## 4. Date Fundamentals – Oracle vs MySQL

Dates in databases are not just strings; they include time information too.

### 4.1 Oracle date storage and display

Oracle stores dates as:

- Century, year, month, day
- Hours, minutes, seconds

Default display format:

- `DD-MON-RR` (e.g., `29-JUN-22`).

The `RR` year format performs “rounded century” logic so that two-digit years are mapped intelligently into previous/next century based on the current year. It’s… clever. And occasionally confusing.

Key takeaway: dates **include time**, even if you don’t see it.

### 4.2 Getting the current date and time (Oracle)

- `SYSDATE` – date & time from the **database server**.
- `CURRENT_DATE` – date & time from the **session time zone**.
- `CURRENT_TIMESTAMP` – date, time, and fractional seconds from the session.

If your database server is in New York and you’re in California, `SYSDATE` and `CURRENT_DATE` can differ by a few hours.

### 4.3 MySQL date functions

In MySQL, default date format is `YYYY-MM-DD`.

Common functions:

- `CURDATE()` – current date.
- `CURRENT_DATE` / `CURRENT_DATE()` – synonyms for `CURDATE()`.
- `NOW()` – current date and time.
- `CURRENT_TIMESTAMP` – synonym for `NOW()`.
- `SYSDATE()` – server’s current date and time.

Example:

```sql
SELECT CURDATE()      AS today,
       NOW()          AS now_dt,
       CURRENT_DATE() AS today2;
```

---

## 5. Arithmetic with Dates

You can perform arithmetic on dates, but the rules differ slightly between Oracle and MySQL.

### 5.1 Oracle date arithmetic

- `date + n` → `n` days after `date`.
- `date - n` → `n` days before `date`.
- `date1 - date2` → number of days between two dates.
- For hours: add `hours / 24`.

Example – weeks employed:

```sql
SELECT last_name,
       hire_date,
       (SYSDATE - hire_date) / 7 AS weeks_employed
FROM   employees;
```

### 5.2 MySQL date arithmetic

Use `DATE_ADD` and `DATE_SUB` with **intervals**:

```sql
SELECT hire_date,
       DATE_ADD(hire_date, INTERVAL 6 MONTH) AS six_months_later,
       DATEDIFF(CURDATE(), hire_date)        AS days_employed
FROM   employees
WHERE  hire_date >= DATE_SUB(CURDATE(), INTERVAL 4 YEAR);
```

Other helpful functions:

- `LAST_DAY(date)` – last day of the month.
- `MONTH(date)` – month number.
- `YEAR(date)` – year number.

---

## 6. Date Functions in Oracle – MONTHS_BETWEEN, ADD_MONTHS, NEXT_DAY, LAST_DAY, ROUND, TRUNC

These help you reason about months and calendar boundaries.

### 6.1 MONTHS_BETWEEN and ADD_MONTHS

```sql
SELECT MONTHS_BETWEEN(DATE '2016-08-01', DATE '2015-01-15') AS months_diff
FROM   dual;
-- ~19.67 months

SELECT ADD_MONTHS(DATE '2016-01-31', 1) AS plus_one_month
FROM   dual;
-- 29-FEB-16 (handles leap year)
```

If you reverse the argument order in `MONTHS_BETWEEN`, you’ll get a negative result.

### 6.2 NEXT_DAY and LAST_DAY

```sql
SELECT NEXT_DAY(DATE '2016-06-01', 'FRIDAY') AS next_friday
FROM   dual;
-- 03-JUN-16 or 10-JUN-16 depending on NLS settings

SELECT LAST_DAY(DATE '2016-04-01') AS last_of_month
FROM   dual;
-- 30-APR-16
```

### 6.3 ROUND and TRUNC with dates

Assume `SYSDATE` is 29-JUN-2018 in these examples.

```sql
-- Round to nearest month
SELECT ROUND(SYSDATE, 'MONTH') AS rounded_month
FROM   dual;
-- 01-JUL-2018 (past the middle of June)

-- Round to nearest year
SELECT ROUND(SYSDATE, 'YEAR') AS rounded_year
FROM   dual;
-- 01-JAN-2018 (not yet halfway through the year)

-- Truncate to start of month
SELECT TRUNC(SYSDATE, 'MONTH') AS month_start
FROM   dual;
-- 01-JUN-2018

-- Truncate to start of year
SELECT TRUNC(SYSDATE, 'YEAR') AS year_start
FROM   dual;
-- 01-JAN-2018
```

`ROUND` pays attention to how far into the month/year you are; `TRUNC` does not—it just snaps to the beginning.

---

## 7. Putting It Together – Typical Use Cases

A few realistic queries that use these functions together:

### 7.1 Clean, nicely formatted names and job titles

```sql
SELECT INITCAP(first_name || ' ' || last_name) AS full_name,
       LOWER(job_id)                           AS job_code
FROM   employees;
```

### 7.2 Years and months of service

Oracle example:

```sql
SELECT last_name,
       hire_date,
       TRUNC(MONTHS_BETWEEN(SYSDATE, hire_date) / 12) AS years_service,
       MOD(TRUNC(MONTHS_BETWEEN(SYSDATE, hire_date)), 12) AS months_service
FROM   employees;
```

MySQL example (approximate, using years only):

```sql
SELECT last_name,
       hire_date,
       YEAR(CURDATE()) - YEAR(hire_date) AS years_service
FROM   employees;
```

### 7.3 Filtering with case-insensitive patterns

```sql
SELECT last_name,
       email
FROM   employees
WHERE  UPPER(last_name) LIKE '%A%'
AND    UPPER(last_name) LIKE '%E%';
```

This finds employees whose last names contain both A and E, regardless of case.

---

## 8. What You Should Now Be Able to Do

By the end of this lesson, you should be able to:

- Explain the difference between **single-row** and **multi-row (aggregate)** functions.
- Use **character functions** (`LOWER`, `UPPER`, `INITCAP`, `CONCAT`, `SUBSTR`, `LENGTH`, `INSTR`, `LPAD`, `RPAD`, `TRIM`, `REPLACE`) to reshape text.
- Use **number functions** (`ROUND`, `TRUNC`/`TRUNCATE`, `CEIL`/`FLOOR`, `MOD`) to control numeric formatting.
- Use **date functions** in Oracle (`SYSDATE`, `MONTHS_BETWEEN`, `ADD_MONTHS`, `NEXT_DAY`, `LAST_DAY`, `ROUND`, `TRUNC`) and MySQL (`CURDATE()`, `NOW()`, `DATE_ADD`, `DATE_SUB`, `DATEDIFF`, `LAST_DAY`, `MONTH`, `YEAR`).
- Perform arithmetic with dates to compute differences and future/past dates.
- Nest functions to perform several transformations in a single expression.

In short, your `SELECT` statements no longer just regurgitate table contents—they **massage**, **clean**, and **reformat** data into something your HR reports might actually be proud of.
