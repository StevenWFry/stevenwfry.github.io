# 21 – Managing Data in Different Time Zones (Or: Your Timestamps Are Lying to You)

And look, storing dates without time zones is like scheduling a global meeting and only writing “9 AM” in the invite. *Whose* 9 AM? Where? On which planet? This lesson is about not doing that.

After this chapter you should be able to:

- Use datetime data types that store fractional seconds and time zones  
- Store the **difference** between two datetime values using `INTERVAL` types  
- Use key datetime functions like `CURRENT_DATE`, `CURRENT_TIMESTAMP`, `LOCALTIMESTAMP`, `EXTRACT`, `FROM_TZ`, and the various `INTERVAL` helpers

---

## 1. Session Time Zone vs Database Time Zone

Scenario:

- Rick is in Australia happily ordering from “OracleKart”.  
- The servers are in the US.  
- The order timestamp needs to reflect **Rick’s local time**, not “whatever time the server happens to be on.”

Key idea: Oracle maintains:

- A **database time zone** – where the database lives  
- A **session time zone** – where *you* live (or at least where your client pretends you live)

You can set the session time zone:

```sql
ALTER SESSION SET TIME_ZONE = '-07:00';  -- absolute offset
ALTER SESSION SET TIME_ZONE = DBTIMEZONE;
ALTER SESSION SET TIME_ZONE = LOCAL;
ALTER SESSION SET TIME_ZONE = 'Australia/Sydney';  -- named region
```

Then inspect:

```sql
SELECT dbtimezone, sessiontimezone
FROM   dual;
```

Database time zone = server’s reality. Session time zone = user’s reality. You need both.

---

## 2. `SYSDATE` vs `CURRENT_DATE`, `CURRENT_TIMESTAMP`, `LOCALTIMESTAMP`

This is where people get confused and blame Oracle when it was really their choice of function all along.

- `SYSDATE`
  - Type: `DATE`
  - Source: **database server** clock (no session time zone involved)

- `CURRENT_DATE`
  - Type: `DATE`
  - Source: **user session** time zone

- `CURRENT_TIMESTAMP`
  - Type: `TIMESTAMP WITH TIME ZONE`
  - Source: **user session** time zone, with fractional seconds + zone

- `LOCALTIMESTAMP`
  - Type: `TIMESTAMP`
  - Source: **user session** time zone, **without** time zone field

Example:

```sql
ALTER SESSION SET NLS_DATE_FORMAT = 'DD-MON-YYYY HH24:MI:SS';
ALTER SESSION SET TIME_ZONE = '-07:00';

SELECT SYSDATE          AS sysdate,
       CURRENT_DATE     AS current_date,
       CURRENT_TIMESTAMP,
       LOCALTIMESTAMP
FROM   dual;
```

Change the session time zone:

```sql
ALTER SESSION SET TIME_ZONE = '+08:00';
```

Run the same `SELECT` again:

- `SYSDATE` stays tied to the server’s time zone  
- `CURRENT_DATE`, `CURRENT_TIMESTAMP`, `LOCALTIMESTAMP` jump to the new **session** time zone

Which is exactly what you want when Rick in Sydney is talking to a database in California.

---

## 3. Datetime Data Types: Beyond `DATE`

### 3.1 `TIMESTAMP`

Fields:

- `YEAR`, `MONTH`, `DAY`  
- `HOUR`, `MINUTE`, `SECOND`  
- Fractional seconds (up to 9 digits)

Example:

```sql
TIMESTAMP '2016-03-06 11:00:00.123456'
```

### 3.2 `TIMESTAMP WITH TIME ZONE`

All of `TIMESTAMP` **plus**:

- `TIMEZONE_HOUR`, `TIMEZONE_MINUTE`  
- Or `TIMEZONE_REGION` (e.g. `Europe/London`)

Example:

```sql
TIMESTAMP '2016-03-06 11:00:00.123456 -08:00'
```

### 3.3 `TIMESTAMP WITH LOCAL TIME ZONE`

- Internally stored in the **database time zone**  
- Automatically converted to the **session time zone** on SELECT  
- Displays like a `TIMESTAMP`, but values are “localised” per session

This is great for “always show this time in the user’s local zone” semantics.

---

## 4. Example: `WEB_ORDERS` with Timed Delivery

Imagine an online store:

```sql
CREATE TABLE web_orders (
  order_id      NUMBER,
  order_date    TIMESTAMP WITH TIME ZONE,
  delivery_time TIMESTAMP WITH LOCAL TIME ZONE
);
```

Insert using current session’s date/time:

```sql
INSERT INTO web_orders (order_id, order_date, delivery_time)
VALUES (
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP + INTERVAL '2' DAY  -- deliver in two days
);
```

Query:

```sql
SELECT order_id,
       order_date,
       delivery_time
FROM   web_orders;
```

`order_date` shows the exact instant + time zone.  
`delivery_time` is stored in database time zone, but displays in your **session** time zone.

---

## 5. `INTERVAL` Data Types: Storing Differences, Not Points

Two families:

- `INTERVAL YEAR TO MONTH` – year/month differences  
- `INTERVAL DAY TO SECOND` – day/time differences (with fractional seconds)

### 5.1 `INTERVAL YEAR TO MONTH`

Example table:

```sql
CREATE TABLE warranty (
  product_id    NUMBER,
  warranty_time INTERVAL YEAR(3) TO MONTH
);
```

Insert:

```sql
INSERT INTO warranty VALUES (123, INTERVAL '8' MONTH);
INSERT INTO warranty VALUES (155, INTERVAL '200' YEAR(3));
INSERT INTO warranty VALUES (678, INTERVAL '200-11' YEAR(3) TO MONTH);
```

Result:

```sql
SELECT * FROM warranty;
-- 123  +00-08
-- 155  +200-00
-- 678  +200-11
```

### 5.2 `INTERVAL DAY TO SECOND`

Example table:

```sql
CREATE TABLE lab (
  experiment_id NUMBER,
  test_time     INTERVAL DAY(2) TO SECOND
);
```

Insert:

```sql
INSERT INTO lab VALUES (100012, INTERVAL '90' DAY);
INSERT INTO lab VALUES (56098, INTERVAL '6 03:30:16' DAY TO SECOND);
```

Result:

```sql
SELECT * FROM lab;
-- 100012  +90 00:00:00
-- 56098   +06 03:30:16
```

These types are ideal when you care about “how long” rather than “what exact timestamp.”

---

## 6. Useful Datetime Functions

### 6.1 `EXTRACT`

Pull a specific field (year, month, etc.) from a datetime:

```sql
SELECT last_name,
       hire_date,
       EXTRACT(YEAR  FROM hire_date) AS hire_year,
       EXTRACT(MONTH FROM hire_date) AS hire_month
FROM   employees;
```

Filter by year:

```sql
SELECT last_name, hire_date
FROM   employees
WHERE  EXTRACT(YEAR FROM hire_date) > 2007;
```

### 6.2 `SESSIONTIMEZONE`, `DBTIMEZONE`, and `TZ_OFFSET`

Find out what your session thinks the time zone is:

```sql
SELECT sessiontimezone, dbtimezone
FROM   dual;
```

Get offset for a named region:

```sql
SELECT tz_offset('US/Eastern')    AS us_eastern,
       tz_offset('Canada/Yukon')  AS canada_yukon,
       tz_offset('Europe/London') AS london
FROM   dual;
```

### 6.3 `FROM_TZ` and `TO_TIMESTAMP`

Convert a local timestamp to `TIMESTAMP WITH TIME ZONE`:

```sql
SELECT FROM_TZ(
         TO_TIMESTAMP('06-MAR-2016 11:00:00',
                      'DD-MON-YYYY HH24:MI:SS'),
         'Australia/North'
       ) AS aussie_time
FROM   dual;
```

Or just parse string → timestamp:

```sql
SELECT TO_TIMESTAMP('06-MAR-2016 11:00:00',
                    'DD-MON-YYYY HH24:MI:SS') AS ts
FROM   dual;
```

### 6.4 `TO_YMINTERVAL` and `TO_DSINTERVAL`

Apply year/month or day/second offsets:

```sql
-- Add 1 year 2 months
SELECT hire_date,
       hire_date + TO_YMINTERVAL('01-02') AS plus_1y2m
FROM   employees;

-- Add 100 days 10 hours
SELECT hire_date,
       hire_date + TO_DSINTERVAL('100 10:00:00') AS plus_100d10h
FROM   employees;
```

These functions are much clearer (and less error‑prone) than trying to remember “how many days is 18 months again?”

---

## 7. Daylight Saving Time (The Part Where Everything Gets Weird)

Daylight saving time introduces two kinds of special moments:

- **Spring forward**:  
  - Time jumps from `01:59:59` to `03:00:00`.  
  - Times from `02:00:00` to `02:59:59` **do not exist**.

- **Fall back**:  
  - Time jumps from `02:00:00` back to `01:00:01`.  
  - Times between `01:00:01` and `02:00:00` are **ambiguous** (you see them twice).

If you store proper `TIMESTAMP WITH TIME ZONE` values, Oracle can distinguish between those two different `1:30 AM`s. If you just use `DATE` with no zone, good luck.

---

## What You Should Be Able To Do Now

By the end of this lesson you should be able to:

- Choose between `SYSDATE`, `CURRENT_DATE`, `CURRENT_TIMESTAMP`, and `LOCALTIMESTAMP` without guessing  
- Use `TIMESTAMP`, `TIMESTAMP WITH TIME ZONE`, and `TIMESTAMP WITH LOCAL TIME ZONE` appropriately  
- Store and use `INTERVAL YEAR TO MONTH` and `INTERVAL DAY TO SECOND` values  
- Use functions like `EXTRACT`, `TZ_OFFSET`, `FROM_TZ`, `TO_TIMESTAMP`, `TO_YMINTERVAL`, and `TO_DSINTERVAL` in real queries  
- Reason about how daylight saving and time zones affect stored and displayed dates

In short, you can now timestamp things in a way that survives crossing time zones, DST changes, and users who insist on working from anywhere with decent Wi‑Fi. Which, given the state of the world, is pretty much everyone.  

