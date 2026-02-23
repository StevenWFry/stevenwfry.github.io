## Lesson 0 – Course Introduction (in which you realize SQL is both useful and slightly terrifying)

And look, when someone says “course objectives” your brain usually leaves the room. But this introduction actually matters, because it tells you **what kind of power** you’re about to get – and how easily you could use it to, say, delete 100,000 rows instead of 10.

By the end of this course you should be able to:

- Define the goals and structure of the Oracle 19c SQL Workshop.
- List key features of **Oracle Database 19c** and **MySQL**.
- Explain what a **relational database** is, both in theory and on disk.
- Describe how Oracle implements RDBMS and ORDBMS.
- Recognize the **HR schema** and tables used for all the examples.
- Pick and use sensible **development tools** (SQL Developer, MySQL Workbench, Live SQL, etc.).

So yes, this is the part where we set expectations – before later chapters demonstrate how those expectations can be exceeded, abused, and rolled back with flashback.

---

## 1. Course Roadmap (a guided tour of future chaos)

The course is structured into units and lessons that slowly escalate from “cute little SELECT” to “cross-database, time-zone-aware, multi-table upserts”.

You’ll work through:

- **Unit 1 – Retrieving, Restricting, and Sorting Data**  
  Basic `SELECT`, filtering, sorting, and row/column retrieval.

- **Unit 2 – Grouping, Joining, and Combining Data**  
  Group functions, table joins, subqueries, and set operators.

- **Unit 3 – Changing Structures and Data**  
  DML (INSERT, UPDATE, DELETE, MERGE) and DDL (CREATE, ALTER, DROP, etc.).

- **Unit 4 – Data Dictionary and Schema Objects**  
  Data dictionary views, sequences, synonyms, indexes, and views.

- **Unit 5 – Managing Schema Objects and Subqueries**  
  Managing objects and using subqueries to retrieve and manipulate data.

- **Unit 6 – Controlling User Access**  
  Privileges, roles, and the moment you realize you should not be the DBA.

- **Unit 7 – Advanced Queries and Time Zones**  
  Multi-table inserts, MERGE, flashback, and managing data across time zones.

Along the way you get:

- **Standard practices and solutions** – the exercises everyone sees.
- **Additional “challenge” practices** – the “are you sure you like pain?” option for extra SQL reps.

---

## 2. Icons, Databases, and Why There Are Two of Them

Because one database apparently wasn’t enough, this course uses **Oracle Database 19c** **and** **MySQL**.

- The **database cylinder icon on the left** → output from **Oracle Database**.
- The **icon on the right** → output from **MySQL**.

Same SQL family, different personalities:

- Oracle 19c is the big, enterprise-grade, “we run your bank” system.
- MySQL is the “we run your startup, social network, and at least one game you’re slightly ashamed to admit you play” system.

You’ll see both so that, later, you can’t say “oh, I only learned the *other* SQL.”

---

## 3. Oracle Database 19c and MySQL: The Big Picture

### 3.1 Oracle Database 19c focus areas

Oracle 19c exists to be extremely serious about your data in a few key areas:

- **Information Management** – store it, index it, keep it consistent.
- **Application Development** – PL/SQL, SQL, drivers, and tools for building apps.
- **Infrastructure / Grids / Cloud** – run on huge clusters or in Oracle Cloud.
- **Key feature themes**:
  - Manageability
  - Information integration
  - Security
  - Performance
  - High availability

Which is a polite way of saying: “we expect your system never to go down, ever, and also to be very fast.”

### 3.2 MySQL: the busy one

MySQL is a modern relational database used by both:

- **Digital disruptors** (startups, social networks, random apps that got huge), and
- **Massive enterprises** (governments, telcos, payment providers).

Real‑world scale examples:

- Mobile network: supports **800+ million subscribers**.
- Booking.com: **2 billion events per day**.
- Government ID system: **1+ billion citizens**.
- Social media: **1.7 billion** active users.
- PayPal: ~**100 TB** of user data.
- Candy Crush: **850 million** gameplays per day.

So yes, that time your query was slow was probably your fault, not MySQL’s.

Supported platforms include:

- Windows
- Linux
- Oracle Solaris
- macOS

And it can be compiled on other platforms because apparently someone, somewhere, is still running that strange OS from 2003.

### 3.3 MySQL Enterprise Edition extras

MySQL Enterprise Edition adds the features you want when “little side project” becomes “production system with customers and lawyers”.

Highlights:

- **Scalability & HA**: Thread Pool, Group Replication, InnoDB Cluster, high availability.
- **Security**: Enterprise Authentication, Audit, Encryption / TDE, Firewall.
- **Management**: Enterprise Monitor, Enterprise Backup.
- **Development & Admin**: Connectors, Workbench, Utilities.
- **Support**: Oracle Premier Support with 24×7×365 coverage, hot fixes, and people who actually know how the server works.

Why care? Because when things go wrong at 3 a.m., Stack Overflow is not contractually obligated to answer.

---

## 4. Relational Database Concepts (a.k.a. “why everything is in tables”)

The relational model was proposed by **Dr. E. F. Codd** in 1970 and has been quietly running most of civilization ever since.

Key ideas:

- Data lives in **relations** – which you know as **tables**.
- A relation has **rows** (tuples) and **columns** (attributes).
- There is a **set of operators** (SQL) to query and manipulate those relations.
- **Data integrity** rules keep everything accurate and consistent.

“Relational” doesn’t mean “it’s about relationships” in the human sense; it means data is stored in **related tables** that can be joined by keys.

### 4.1 From ideas to tables: entity and table models

The journey from business idea to database looks like this:

1. A human has an idea: “We need to track employees and departments.”
2. We build an **entity model** from that narrative.  
   - Entities = things we care about (Employee, Department).  
   - Attributes = properties (employee_id, last_name, department_id, etc.).
3. We map that to a **table model**: each entity becomes a **table**, each attribute becomes a **column**.

Conventions:

- **Entity (table)**: singular name, uppercase, drawn as a “soft box” (rounded corners).
- **Attributes (columns)**: usually lowercase in diagrams; mandatory ones marked with `*`, optional with `o`.
- **Primary identifier**: marked with `#` (primary key).
- Secondary identifiers can form **composite keys** (less common, but they exist).

### 4.2 Primary keys, foreign keys, and “who’s the parent?”

Every row should be uniquely identifiable. That’s the job of the **primary key**.

- In `EMPLOYEES`, the primary key is often `EMPLOYEE_ID`.
- In `DEPARTMENTS`, the primary key is `DEPARTMENT_ID`.

To relate tables:

- `DEPARTMENTS.DEPARTMENT_ID` is the **parent** (primary key).
- `EMPLOYEES.DEPARTMENT_ID` is the **child** (foreign key).

Foreign key rules:

- You must insert the **parent** rows first (departments).
- Only then can you insert **child** rows that reference them (employees).

So before you insert “Steven King in department 90”, department 90 has to exist in `DEPARTMENTS`. The database is basically insisting that your org chart make sense.

### 4.3 Rows, columns, fields, and NULLs

In relational terminology:

- **Row** – a single record (e.g., one employee). Runs horizontally.
- **Column** – a single attribute (e.g., salary). Runs vertically.
- **Field** – the intersection of a row and a column (one specific value).  
  In spreadsheet language, that’s a “cell”.
- **Primary key column** – uniquely identifies rows; no duplicates, no missing values.
- **Foreign key column** – references another table’s primary key; can repeat, can be `NULL`.
- **NULL** – “no value / unknown / not applicable”, not zero, not empty string.

In many tools, number columns are right‑aligned and character columns are left‑aligned, which is your first tiny clue about the data type.

---

## 5. The HR Schema: Your Playground

For this course you’ll mostly work with the **HR schema** – a fictional but suspiciously realistic human resources schema.

Key tables include:

- `EMPLOYEES`
- `DEPARTMENTS`
- `LOCATIONS`
- `COUNTRIES`
- `REGIONS`
- `JOBS`, `JOB_HISTORY`, `JOB_GRADES`

Some details:

- Table names (in black/bold in diagrams) = the **tables**.
- Column names (in lowercase) = the **attributes**.
- Columns in blue in the diagram = **primary key** columns.
- `JOB_HISTORY` uses a **composite key** (two columns together form the unique identifier).
- `EMPLOYEES` has a **self‑referential relationship**: an employee’s `MANAGER_ID` can point to another `EMPLOYEE_ID` in the same table. That gives you a hierarchy (think org chart).

About the data sets:

- For the **first half** of the course (roughly chapters 1–11), you use a smaller `EMPLOYEES` table with about **20** rows.
- From **chapter 12 onward**, you switch to a larger `EMPLOYEES` table with **107** employees.

So if your query result suddenly has five times more rows, it’s not necessarily wrong – you might just be in the “big data” version of HR.

---

## 6. SQL and Development Environments

### 6.1 What SQL actually is

**SQL** = Structured Query Language.

- ANSI standard language for relational databases.
- Lets you **define** objects, **retrieve** data, and **manipulate** data.
- Works at a **set/logical** level – you say *what* you want, not *how* to loop through rows.

Major categories of SQL statements:

- **DML (Data Manipulation Language)**  
  `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `MERGE`
- **DDL (Data Definition Language)**  
  `CREATE`, `ALTER`, `DROP`, `RENAME`, `TRUNCATE`, `COMMENT`
- **DCL (Data Control Language)**  
  `GRANT`, `REVOKE`
- **Transaction Control**  
  `COMMIT`, `ROLLBACK`, `SAVEPOINT`

### 6.2 Oracle development environments

You have a few options:

- **SQL Developer** – the main tool for this course. GUI, nice features, fewer chances to accidentally retype the same destructive command.
- **SQL*Plus** – command‑line, powerful, but less friendly for beginners.
- **Oracle Live SQL** – browser-based environment:
  - No install required.
  - Great for quick experiments and sharing snippets.

The course assumes SQL Developer as your day‑to‑day Oracle environment.

### 6.3 MySQL development environments

For MySQL you’ll see:

- **MySQL Workbench** – primary GUI for modeling, running queries, and administration.
- **`mysql` command-line client** – interactive shell; scriptable, quick, a bit unforgiving.

Again, think of Workbench as the place you’re meant to live, and the CLI as the place you go to when something is on fire.

---

## 7. Documentation, Resources, and Training Paths

### 7.1 Oracle 19c documentation highlights

Useful docs include:

- Oracle Database New Features Guide
- Oracle Database Concepts
- Oracle Database SQL Language Reference
- Oracle Database Reference
- Oracle SQL Developer User's Guide

Additional learning resources:

- Oracle Learning Library
- Oracle Cloud resources
- SQL Developer home page & tutorials

### 7.2 Oracle training and certification

For **developers** the typical path is:

- **Introductory**: Introduction to SQL (this course).
- **Intermediate**: PL/SQL Fundamentals.
- **Advanced**: SQL Tuning for Developers.

Formats include ILT (instructor-led training), IVC (virtual classroom), and TOD (training on demand).

Certification examples:

- Oracle Database SQL Certified Associate
- Oracle Database PL/SQL Certified Associate
- Oracle Database PL/SQL Certified Professional

Exams are delivered via **Pearson VUE** in 175+ countries, which means you can panic in a testing center almost anywhere on Earth.

### 7.3 MySQL resources, training, and certification

**Websites:**

- `mysql.com` – product information, services, white papers, webinars, trial versions of MySQL Enterprise Edition.
- `dev.mysql.com` – Developer Zone, documentation, downloads.
- GitHub – source code for the MySQL server and related tools.

**Training paths:**

- **Introductory**: MySQL Fundamentals (for devs and DBAs).
- **Intermediate**: MySQL for Developers, MySQL for Database Administrators.
- **Advanced**: MySQL Performance Tuning (for both), plus MySQL Cluster (for DBAs).

**Certification:**

- Oracle Certified Professional, MySQL 5.6 Database Administrator.
- Oracle Certified Professional, MySQL 5.6 Developer.

Yes, even your MySQL skills can come with official paperwork.

---

## 8. What You Should Take Away from This Introduction

By the end of this lesson, you should be able to:

- Explain the **goals of the course** and where each unit fits.
- Summarize key features of **Oracle Database 19c** and **MySQL**.
- Describe what a **relational database** is and how tables relate using keys.
- Recognize Oracle’s implementation of **RDBMS** and **ORDBMS** ideas.
- Identify the **HR schema** and its main tables as your practice playground.
- Choose and use appropriate **development environments** for Oracle and MySQL.

The practice for this lesson typically covers:

- Starting SQL Developer.
- Creating a new database connection.
- Browsing tables and schemas.

In other words: before we let you write queries that rearrange reality, we make sure you at least know how to log in.
