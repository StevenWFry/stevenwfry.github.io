## Lesson 5 – Using Conversion Functions and Conditional Expressions (or: when your data insists on being the wrong type)

And look, databases are pedantic. They care deeply about whether something is a **number**, a **string**, a **date**, or now even **JSON**, and they will absolutely throw an error if you try to compare `'01-JAN-22'` (a string) to a real date like `DATE '2022-01-01'` without converting it.

This lesson is about making the database a little less fussy by using **conversion** and **conditional** functions.

You will learn to:

- Describe implicit vs explicit data type conversion.
- Use `TO_CHAR`, `TO_NUMBER`, and `TO_DATE` (Oracle) and `CAST`/`CONVERT` in MySQL.
- Control how numbers and dates are formatted with **format models**.
- Use general/conditional functions such as `NVL`, `NVL2`, `NULLIF`, `COALESCE`, `IFNULL`.
- Use `CASE`, searched `CASE`, and `DECODE` for IF‑THEN‑ELSE logic.
- Recognize basic SQL/JSON functions like `JSON_QUERY` and `JSON_TABLE`.

---

## 1. Implicit vs Explicit Conversion

SQL is strongly typed but occasionally “helpful”. It will sometimes convert data types **for you** (implicit conversion), and other times it will fail loudly and dramatically.

### 1.1 Implicit conversion (Oracle)

Oracle will automatically convert between strings and numbers/dates **when it thinks it can**.

**Strings → numbers**

```sql
SELECT employee_id,
       department_id
FROM   employees
WHERE  department_id = CONCAT('9', '0');  -- implicitly becomes 90
```

- `'9'` and `'0'` are character values.
- `CONCAT('9', '0')` → `'90'` (still a string).
- Oracle implicitly converts `'90'` into number `90` to compare with numeric `department_id`.

**Numbers → strings**

```sql
SELECT last_name,
       salary
FROM   employees
WHERE  INSTR(salary, '5') > 0;
```

- `salary` is numeric.
- `INSTR` expects a string, so Oracle implicitly converts `salary` to text and searches for `'5'`.

This is convenient, right up to the moment a NLS setting changes and your “helpful” conversion starts behaving differently. Which is why the grown‑up way is **explicit conversion**.

### 1.2 Explicit conversion

You take control and tell Oracle **exactly** how to interpret a value:

- `TO_CHAR` – convert date/number → string.
- `TO_NUMBER` – convert string → number.
- `TO_DATE` – convert string → date.
- `CAST` – generic conversion between data types.

MySQL uses `CAST` / `CONVERT` for similar purposes.

---

## 2. TO_CHAR (Dates and Numbers) – Because Output Should Look Nice

`TO_CHAR` is how you turn dates and numbers into **formatted strings**.

### 2.1 TO_CHAR with dates (Oracle)

Basic usage:

```sql
SELECT SYSDATE,
       TO_CHAR(SYSDATE, 'DD-MON-RR') AS default_like
FROM   dual;
```

The **format model** (the second argument) tells Oracle how to render the date. Common elements:

- `YYYY` – 4‑digit year (e.g., `2022`).
- `YEAR` – year spelled out (e.g., `TWENTY TWENTY-TWO`).
- `MON` – abbreviated month (e.g., `FEB`).
- `MONTH` – full month name (e.g., `FEBRUARY`).
- `DD` – day of month.
- `D` – day of week (1–7).
- `DY` – abbreviated day name (e.g., `MON`).
- `DDTH` – day of month with ordinal (e.g., `7TH`).
- `DDSPTH` – day spelled out with ordinal (e.g., `SEVENTH`).
- `HH:MI:SS` – hour, minute, second (12‑hour clock).
- `HH24` – 24‑hour hour.
- `AM` / `PM` – meridian indicator.
- `"literal"` – literal text in the format.
- `FM` – “fill mode” (suppresses leading zeros and spaces).

Examples:

```sql
-- Year spelled out
SELECT TO_CHAR(SYSDATE, 'YYYY')    AS year_4,
       TO_CHAR(SYSDATE, 'Year')    AS year_name
FROM   dual;

-- Day and month, with literal text
SELECT TO_CHAR(SYSDATE, 'DDth "of" Month') AS pretty_date
FROM   dual;
-- e.g., '7th of February'

-- Include time
SELECT TO_CHAR(SYSDATE, 'DD-MON-YYYY HH24:MI:SS') AS full_stamp
FROM   dual;

-- Use FM to remove padding and leading zeros
SELECT TO_CHAR(SYSDATE, 'FMDD Month YYYY') AS nice_date
FROM   dual;
```

Without `FM`, Oracle reserves space for the **longest** month name and for leading zeros; with `FM`, output becomes more compact.

### 2.2 TO_CHAR with numbers (Oracle)

`TO_CHAR` can also format numbers with currency symbols, commas, and zero padding.

Common format elements:

- `9` – digit placeholder (optional position).
- `0` – digit placeholder that **forces** a zero if there’s no digit.
- `$` – floating dollar sign.
- `L` – floating local currency symbol.
- `.` – decimal point.
- `,` – thousands separator.

Examples:

```sql
SELECT salary,
       TO_CHAR(salary, '$99,999.00') AS formatted,
       TO_CHAR(salary, 'L99999')     AS local_currency,
       TO_CHAR(salary, '000000')     AS zero_padded
FROM   employees
WHERE  employee_id = 100;  -- e.g., Ernst
```

If your format isn’t wide enough, you’ll get `########` instead of a number, which is the database’s way of saying “you didn’t think this through.”

---

## 3. TO_DATE and TO_NUMBER – Turning Strings Back Into Something Useful

### 3.1 TO_DATE (Oracle)

Use `TO_DATE` when you have a **string** and want a real date.

```sql
SELECT last_name,
       hire_date,
       TO_CHAR(hire_date, 'DD-MON-RR') AS hire_char
FROM   employees
WHERE  hire_date < TO_DATE('01-JAN-10', 'DD-MON-RR');
```

- `'01-JAN-10'` is a string.
- `TO_DATE` with format `'DD-MON-RR'` converts it into a **date**.
- Oracle can then compare `hire_date` with it correctly.

The `RR` year format performs “rounded century” logic so that two‑digit years behave sensibly as time marches toward 2049.

### 3.2 TO_NUMBER (Oracle)

`TO_NUMBER` converts a string to a number, using an optional format model.

```sql
SELECT TO_NUMBER('12,345.67', '99,999.99') AS val
FROM   dual;
```

You’ll typically use this when ingesting data as strings but needing to do math on it.

---

## 4. CAST in Oracle and MySQL

`CAST` is the ANSI‑standard way to convert between types.

Oracle examples:

```sql
-- Concatenate '9' and '0', cast to decimal, compare to numeric department_id
SELECT first_name,
       last_name,
       department_id
FROM   employees
WHERE  department_id < CAST(CONCAT('9', '0') AS DECIMAL(2,0));

-- Cast salary to a string so INSTR can search it
SELECT last_name,
       salary
FROM   employees
WHERE  INSTR(CAST(salary AS VARCHAR2(30)), '5') > 0;
```

MySQL examples:

```sql
SELECT first_name,
       last_name,
       department_id
FROM   employees
WHERE  department_id < CAST(CONCAT('9','0') AS DECIMAL(2,0));

SELECT last_name,
       salary
FROM   employees
WHERE  INSTR(CAST(salary AS CHAR(30)), '5') > 0;
```

`CAST` is explicit, portable, and makes your intent clear—three things implicit conversion is not.

---

## 5. Dealing with NULLs: NVL, NVL2, IFNULL, NULLIF, COALESCE

NULLs are what you get when the database shrugs. These functions let you decide what to do about it.

### 5.1 NVL (Oracle) and IFNULL (MySQL)

`NVL(expr, replacement)` – if `expr` is `NULL`, return `replacement`; otherwise return `expr`.

MySQL’s `IFNULL(expr, replacement)` behaves similarly.

Important: **data types must be compatible**. Oracle may try to implicitly convert one to match the other, but that can go badly.

**Classic example – annual salary including commission:**

```sql
SELECT last_name,
       salary,
       commission_pct,
       salary * 12
         + salary * 12 * NVL(commission_pct, 0) AS annual_salary
FROM   employees;
```

- Without `NVL`, if `commission_pct` is `NULL`, the entire expression becomes `NULL`.
- With `NVL(commission_pct, 0)`, non‑sales employees are treated as having 0 commission, so their annual salary is just `salary * 12`.

To see the effect directly:

```sql
SELECT last_name,
       salary,
       NVL(commission_pct, 0) AS comm_or_zero
FROM   employees;
```

MySQL version:

```sql
SELECT last_name,
       salary,
       IFNULL(commission_pct, 0) AS comm_or_zero
FROM   employees;
```

### 5.2 NVL2 (Oracle)

`NVL2(expr, value_if_not_null, value_if_null)`:

- If `expr` is **NOT NULL**, return `value_if_not_null`.
- If `expr` **is NULL**, return `value_if_null`.

Example – describe how someone’s pay is determined:

```sql
SELECT last_name,
       salary,
       commission_pct,
       NVL2(commission_pct,
             'Salary + Commission',
             'Salary only') AS salary_basis
FROM   employees;
```

- If `commission_pct` is not null → `'Salary + Commission'`.
- If `commission_pct` is null → `'Salary only'`.

`value_if_not_null` and `value_if_null` should be the **same data type**, or Oracle will attempt a conversion.

### 5.3 NULLIF

`NULLIF(expr1, expr2)` returns:

- `NULL` if `expr1 = expr2`.
- `expr1` if they are different.

Example – compare lengths of first and last names:

```sql
SELECT first_name,
       last_name,
       LENGTH(first_name) AS len_first,
       LENGTH(last_name)  AS len_last,
       NULLIF(LENGTH(first_name), LENGTH(last_name)) AS length_diff
FROM   employees;
```

- If lengths are equal, `NULLIF` returns `NULL` (meaning “no difference”).
- If different, it returns the length of `first_name`.

### 5.4 COALESCE – Multiple Fallbacks

`COALESCE(expr1, expr2, ..., exprN)` returns the **first non‑NULL** expression in the list.

This is its main advantage over `NVL`/`IFNULL`, which only offer **one** fallback.

Simple example:

```sql
SELECT last_name,
       COALESCE(phone_number, mobile_phone, 'No phone') AS contact_phone
FROM   employees;
```

- Try `phone_number`.
- If `NULL`, try `mobile_phone`.
- If still `NULL`, return `'No phone'`.

More complex example matching the lesson demo:

```sql
SELECT last_name,
       salary,
       commission_pct,
       manager_id,
       department_id,
       COALESCE(commission_pct,
                manager_id,
                department_id) AS numeric_fallback
FROM   employees;
```

- If an employee has a commission → returns `commission_pct`.
- Else if they have a manager → returns `manager_id`.
- Else → returns `department_id`.

You can also mix in text by converting everything to character:

```sql
SELECT last_name,
       COALESCE(TO_CHAR(commission_pct),
                TO_CHAR(manager_id),
                TO_CHAR(department_id),
                'No commission or manager') AS info
FROM   employees;
```

All arguments must ultimately be compatible data types, or you must explicitly convert them as shown.

### 5.5 COALESCE and IFNULL (MySQL)

MySQL supports both `IFNULL(expr, replacement)` and `COALESCE(expr1, expr2, ...)` with the same semantics as in Oracle.

---

## 6. Conditional Expressions: CASE, Searched CASE, DECODE

Sometimes you want IF‑THEN‑ELSE logic **inside** a SQL statement. That’s what conditional expressions are for.

### 6.1 Simple CASE expression

A simple `CASE` compares one expression (a **selector**) against several possible values.

```sql
SELECT last_name,
       salary,
       job_id,
       CASE job_id
         WHEN 'IT_PROG' THEN salary * 1.25
         WHEN 'AD_VP'   THEN salary * 1.50
         WHEN 'AD_PRES' THEN salary * 2
         ELSE               salary * 0.90
       END AS raise_or_not
FROM   employees;
```

- `CASE job_id` is the selector.
- Each `WHEN` compares `job_id` to a constant.
- The `ELSE` clause gives everyone else a 10% pay cut (rude, but valid).

Do not forget the `END` keyword; the parser will not forgive you.

### 6.2 Searched CASE expression

A searched `CASE` lets each `WHEN` have its **own condition**, not just equality tests.

```sql
SELECT last_name,
       salary,
       job_id,
       CASE
         WHEN job_id = 'IT_PROG' THEN salary * 1.25
         WHEN job_id = 'AD_VP'   AND employee_id = 101 THEN salary * 1.50
         WHEN job_id = 'AD_PRES' THEN salary * 2
         ELSE                         salary * 0.90
       END AS raise_or_not
FROM   employees;
```

- You can check multiple columns per `WHEN` clause.
- In this example, only one VP (say, employee 101) gets the raise; the other gets a cut.

### 6.3 DECODE (Oracle‑only)

`DECODE` is an Oracle function that behaves like a compact, equality‑based `CASE`.

Syntax:

```sql
DECODE(expr,
       search1, result1,
       search2, result2,
       ...,
       default_result)
```

Example equivalent to the simple `CASE` above:

```sql
SELECT last_name,
       salary,
       job_id,
       DECODE(job_id,
              'IT_PROG', salary * 1.25,
              'AD_VP',   salary * 1.50,
              'AD_PRES', salary * 2,
                         salary * 0.90) AS raise_or_not
FROM   employees;
```

Another example from the book: determine tax rates based on scaled salary in department 80:

```sql
SELECT last_name,
       department_id,
       salary,
       DECODE(TRUNC(salary / 2000),
              0,  0.00,
              1,  0.09,
              2,  0.20,
              3,  0.30,
              4,  0.40,
                  0.45) AS tax_rate
FROM   employees
WHERE  department_id = 80;
```

MySQL does **not** have `DECODE`, but fully supports `CASE` and searched `CASE`.

---

## 7. SQL/JSON Functions (JSON_QUERY and JSON_TABLE)

Because of course your relational database also has to store JSON now.

Oracle’s SQL/JSON functions help you treat JSON data in a relational way:

- `JSON_QUERY` – extract JSON values as a JSON‑formatted string.
- `JSON_TABLE` – project JSON data into a **relational** result set (virtual table).

Example – `JSON_QUERY` (simplified):

```sql
SELECT JSON_QUERY(json_column, '$.employees[*].name') AS employee_names
FROM   some_table;
```

- Takes JSON stored in `json_column`.
- Finds values matching the JSON path (`$.employees[*].name`).
- Returns them as a character string containing JSON.

Example – `JSON_TABLE` (very high level):

```sql
SELECT jt.name,
       jt.salary
FROM   some_table t,
       JSON_TABLE(t.json_column,
                  '$.employees[*]'
                  COLUMNS (
                    name   VARCHAR2(50) PATH '$.name',
                    salary NUMBER       PATH '$.salary'
                  )) jt;
```

- `JSON_TABLE` turns JSON array elements into rows (`jt`).
- You can then use them like a regular relational table.

You don’t need to master these for basic SQL, but you should recognize the names when they appear.

---

## 8. MySQL Conversion Recap

For MySQL specifically:

- Use `CAST(expr AS type)` or `CONVERT(expr, type)` to explicitly change types.
- Common types: `DECIMAL(p,s)`, `SIGNED`, `UNSIGNED`, `CHAR(n)`, `DATE`, `DATETIME`.
- Use `IFNULL(expr, replacement)` or `COALESCE(expr1, expr2, ...)` for null handling.

Examples:

```sql
-- String to decimal
SELECT CAST('123.45' AS DECIMAL(5,2));

-- Salary as text for pattern search
SELECT last_name,
       salary
FROM   employees
WHERE  INSTR(CAST(salary AS CHAR(20)), '5') > 0;
```

---

## 9. What You Should Now Be Able to Do

By the end of this lesson, you should be able to:

- Distinguish between **implicit** and **explicit** conversions and know why explicit is safer.
- Use `TO_CHAR` with dates and numbers to format output using format models.
- Use `TO_DATE` and `TO_NUMBER` to convert strings into proper date/number values.
- Use `CAST` to convert between types in a more portable way.
- Handle `NULL` values with `NVL`, `NVL2`, `IFNULL`, `NULLIF`, and `COALESCE`.
- Apply conditional expressions (`CASE`, searched `CASE`, `DECODE`) inside `SELECT` to categorize or label data.
- Recognize `JSON_QUERY` and `JSON_TABLE` as tools for working with JSON data in SQL.

In short, you can now stop blaming “data type mismatch” errors on the database and start blaming them on whichever developer didn’t bother to convert their strings—or their JSON.
