## Lesson 2 – Retrieving Data Using the SQL SELECT Statement (or: how to politely interrogate your database)

And look, the `SELECT` statement is the thing you *thought* SQL was: “show me stuff from a table.” But it also hides a surprising number of ways to confuse yourself with aliases, NULLs, and operator precedence.

In this lesson you will learn to:

- List what a `SELECT` statement can actually do.
- Execute basic `SELECT` statements.
- Return all columns or just the ones you care about.
- Use column aliases, arithmetic expressions, and concatenation.
- Handle `NULL` properly instead of pretending it’s a zero.
- Use Oracle’s `DUAL` table, alternative quoting, and the `DISTINCT` keyword.
- Describe table structures with `DESCRIBE` / `DESC` or GUI tools.

---

## 1. SELECT Basics (Alex just wants Accounting)

Picture Alex: they want a list of employees in the **Accounting** department. Somewhere there’s an HR app where they choose `department = Accounting` and click **Go**, and magically a report appears.

Behind that magic is a `SELECT` statement, which:

- Chooses **columns** to display (`SELECT`).
- Chooses **tables** to read from (`FROM`).
- Optionally filters (`WHERE`), sorts (`ORDER BY`), and so on.

Syntax basics:

- SQL **keywords** (SELECT, FROM, WHERE, etc.) are **not case‑sensitive**.  
  `select`, `SeLeCt`, `SELECT` – all the same.
- **Data values** *can* be case‑sensitive, depending on collation.
- Statements can span multiple lines.
- Keywords **cannot** be abbreviated or split across lines.  
  `SEL` is not a thing. `SE` on one line and `LECT` on the next is also not a thing.
- Indentation and line breaks don’t change behavior, but they **do** change whether your coworkers like you.

Example formatting:

```
SELECT last_name,
       salary,
       hire_date,
       manager_id
FROM   employees;
```

Most tools (like SQL Developer) have a **Format** command that:

- Uppercases keywords.
- Indents columns and clauses.
- Makes your query look like it wasn’t written at 2 a.m.

Use it. Frequently.

---

## 2. SELECT and FROM: All Columns vs Specific Columns

### 2.1 Selecting all columns

The laziest (and sometimes useful) form:

```
SELECT *
FROM   employees;
```

- `*` means “all columns”.
- Great for quick exploration; terrible as a long‑term habit in production code.

### 2.2 Selecting specific columns

When you know what you want, list the columns explicitly:

```
SELECT last_name,
       job_id,
       salary
FROM   employees;
```

Rules:

- Separate column names with **commas**.
- No trailing comma after the last column.

---

## 3. Running SELECT in Different Tools

### 3.1 SQL Developer

- Type your statement in a SQL Worksheet.
- To run **one** statement: place the cursor in it and click **Execute Statement** (green triangle) or press `Ctrl+Enter`.
- To run a **script** (multiple statements): use **Run Script** or `F5`.

Column heading defaults:

- Headings are **uppercase** by default.
- In SQL Developer, all headings are left‑aligned in the grid.

### 3.2 SQL*Plus

- Type the statement, end with a semicolon, press **Enter**.
- Character and date column headings: left‑aligned.
- Number column headings: right‑aligned.
- Headings are uppercase.

### 3.3 MySQL Workbench

- Type in the SQL Editor.
- Execute current statement with `Ctrl+Enter` or the lightning bolt for “current.”
- Results appear in the Results Grid.

### 3.4 MySQL Command‑Line Client

- Type statements; press Enter to continue on another line.
- End with `;` and press Enter to execute.
- Results appear as a text table, retro‑style.

---

## 4. The DUAL Table and Constant Expressions

Sometimes you don’t want rows **from a table**; you just want a single calculated value, like today’s date.

In Oracle, that’s where the `DUAL` table comes in:

- `DUAL` has exactly **one row** and one column.
- It’s perfect when you want **one row of output** without relying on a real table.

Example – using `SYSDATE`:

```
-- This returns today's date once for every employee
SELECT first_name,
       SYSDATE
FROM   employees;

-- This returns today's date exactly once
SELECT SYSDATE
FROM   dual;
```

In **MySQL**:

- `FROM DUAL` is accepted but ignored. These are equivalent:
  - `SELECT SYSDATE();`
  - `SELECT SYSDATE() FROM DUAL;`
- Don’t put a space between `SYSDATE` and `(` unless your server is configured to forgive you.

---

## 5. Arithmetic Expressions and Operator Precedence

You can use arithmetic operators directly in the `SELECT` list:

Operators:

- `+` addition
- `-` subtraction
- `*` multiplication
- `/` division

Example – monthly salary vs annual salary:

```
SELECT last_name,
       salary,
       salary * 12    annual_salary
FROM   employees;
```

Now suppose you want to give everyone a hypothetical **$100/month raise** and see the new annual salary:

```
SELECT last_name,
       salary * 12,
       salary * 12 + 100    wrong_annual,
       (salary + 100) * 12  corrected_annual
FROM   employees;
```

Why two columns?

- `salary * 12 + 100` → multiplies first, then adds 100 **once**.
- `(salary + 100) * 12` → adds 100 to the monthly salary, then multiplies by 12.

Moral: when in doubt about precedence, **use parentheses** instead of trusting your memory.

---

## 6. NULL: The Four‑Meaning Troublemaker

`NULL` in SQL is not 0, not an empty string, and not “we’ll decide later.” It generally means one of:

- **Unavailable** – we don’t have the value yet.
- **Unassigned** – nobody has set it.
- **Unknown** – we genuinely don’t know.
- **Inapplicable** – doesn’t make sense for this row.

Example:

- Salespeople have a `commission_pct` value.
- Non‑sales employees have `commission_pct = NULL` because it **does not apply**.

Critical rule:

- Any arithmetic expression involving `NULL` yields **`NULL`**.

Example – annual salary including commission:

```
SELECT last_name,
       salary,
       salary * 12
         + salary * 12 * commission_pct   annual_with_commission
FROM   employees;
```

- For employees with a commission: calculation works.
- For employees whose `commission_pct` is `NULL`: the whole expression becomes `NULL`.

Later, you’ll see functions to substitute default values for `NULL` (like “treat NULL commission as 0”). For now, just remember: **NULL poisons arithmetic**.

---

## 7. Column Aliases

Column aliases let you rename the column heading in your result set:

- They appear **after** the expression.
- `AS` is optional but makes things clearer.
- If your alias contains spaces or mixed case, wrap it in **double quotes**.

Examples:

```
-- Simple alias
SELECT last_name AS name,
       salary    AS monthly_salary
FROM   employees;

-- Alias without AS (still works)
SELECT commission_pct commission
FROM   employees;

-- Alias with spaces and mixed case (quotes required)
SELECT salary * 12 AS "Annual Salary"
FROM   employees;
```

Without quotes, aliases default to **uppercase** in most tools. With double quotes, you get **exactly** the casing and spaces you specify.

---

## 8. Concatenation, Literals, and the CONCAT Function

### 8.1 The concatenation operator (`||`)

In Oracle, `||` combines strings (character expressions):

```
-- First and last name with a space
SELECT first_name || ' ' || last_name AS full_name
FROM   employees;
```

Notes:

- The result is always **character** data.
- If you concatenate a number, it’s **converted to text**:

```
SELECT first_name || ' earns ' || salary AS pay_info
FROM   employees;
```

You’ll see everything left‑aligned, including the number, because it’s now text.

### 8.2 CONCAT function (Oracle vs MySQL)

- Oracle’s `CONCAT` takes **exactly two arguments**.
- MySQL’s `CONCAT` happily takes **many**.

MySQL example:

```
SELECT CONCAT(first_name, ' ', last_name, ' is a ', job_id)
FROM   employees;
```

Oracle equivalent (nesting CONCAT):

```
SELECT CONCAT(CONCAT(first_name, ' '), last_name) AS full_name
FROM   employees;
```

Or, much simpler in Oracle: just use `||`.

### 8.3 Literal character strings

A **literal** is a hard‑coded value in your `SELECT` list, like a word or phrase.

- Character and date literals go in **single quotes**.
- They are repeated **for every row** returned.

Example:

```
SELECT last_name || ' is a ' || job_id AS description
FROM   employees;
```

This produces rows like “Abel is a SA_REP”.

---

## 9. Alternative Quote Operator (Oracle) and Escapes (MySQL)

What if your literal includes an apostrophe, like `isn't`? If you write this naively:

```
SELECT 'King isn't happy' AS msg
FROM   dual;
```

Oracle sees the `'` in `isn't` and panics.

### 9.1 Oracle’s alternative quote operator

Use `q` followed by a single quote and a pair of delimiters:

```
SELECT q'[King isn't happy]' AS msg
FROM   dual;
```

Pattern:

- `q'<text>'`
- You can use brackets, braces, parentheses, or other characters as delimiters:
  - `q'[text]'`
  - `q'{text}'`
  - `q'(text)'`
  - `q'<text>'`

Just don’t use `&` as a delimiter – that triggers substitution variables and a whole different adventure.

### 9.2 MySQL string escapes

In MySQL, you typically escape the single quote:

```
SELECT 'King isn\'t happy' AS msg;
```

or depending on configuration:

```
SELECT 'King isn''t happy' AS msg;
```

Either way: you’re telling the engine “this quote is part of the text, not the end of it.”

---

## 10. DISTINCT: Getting Rid of Duplicates

Sometimes you don’t care about every row – you just want **unique** values.

Example:

```
SELECT department_id
FROM   employees;
```

You’ll see many repeated department IDs. To shrink it down:

```
SELECT DISTINCT department_id
FROM   employees;
```

- `DISTINCT` applies to **all selected columns together**.
- If you write `SELECT DISTINCT department_id, job_id`, you’ll get unique **pairs** of `(department_id, job_id)`.

---

## 11. DESCRIBE / DESC: Seeing Table Structure

When you’re not sure what’s in a table, `DESCRIBE` is your friend.

In Oracle (SQL*Plus or SQL Developer script output):

```
DESCRIBE employees;
-- or shorter
DESC employees;
```

You’ll see:

- Column names
- Data types
- Whether each column can be `NULL`

In SQL Developer’s GUI:

- Click the table name (e.g., `DEPARTMENTS`) in the **Connections** tree.
- The right‑hand pane shows columns, data types, constraints, and more.

In MySQL Workbench:

- Run `DESCRIBE table_name;` in the SQL editor, **or**
- Right‑click the table → **Table Inspector** → **Columns** tab.

---

## 12. What You Should Now Be Able to Do

By the end of this lesson, you should be able to:

- Write a `SELECT` that returns **all** rows and columns from a table.
- Return only **specific columns** instead of relying on `*`.
- Use **column aliases** (with or without `AS`) to produce readable headings.
- Use arithmetic expressions and parentheses correctly in the `SELECT` list.
- Understand how `NULL` affects calculations.
- Concatenate columns and literals, and handle quotes safely.
- Use `DISTINCT` to eliminate duplicate rows.
- Describe the structure of a table using `DESCRIBE` / `DESC` or GUI tools.

If that feels like a lot for one lesson, remember: this is still just **reading** data. Writing and changing it comes later, and that’s when things get really exciting—or really broken—depending on how carefully you’ve learned this part.
