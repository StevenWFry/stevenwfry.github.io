## Lesson 19 – Controlling User Access (in which you discover you are **not** the database god you thought you were)

Welcome to the glamorous world of database security, where your dreams of unlimited power go to die under the watchful eye of the DBA.

In this lesson you will:

- Tell system privileges and object privileges apart without panicking.  
- Grant privileges on tables without accidentally giving Karen in Accounting the power to drop the database.  
- Use roles so you’re not copy‑pasting the same GRANT statement 37 times.  
- Understand why “WITH GRANT OPTION” is both amazing and mildly terrifying.  

---

## 1. System Privileges: Keys to the Kingdom (sort of)

The **DBA (Database Administrator)** is the bouncer, the keymaster, and occasionally the petty tyrant of your database.

- The DBA creates **users**, sets their **initial passwords**, and decides who gets which **privileges**.  
- A **schema** is just a fancy word for “all the objects that belong to a user” (tables, views, sequences, etc.). By default, schema name = username.  

System privileges let you do things *to the database itself*, such as:

- `CREATE SESSION` – permission to even *log in*. No session, no party.  
- `CREATE TABLE` – build your own tables.  
- `CREATE SEQUENCE`, `CREATE VIEW`, `CREATE PROCEDURE` – developer starter pack.  

Creating a user (normally done by the DBA):

```sql
CREATE USER demo IDENTIFIED BY demo_pwd;
```

Giving that user basic system privileges:

```sql
GRANT
  CREATE SESSION,
  CREATE TABLE,
  CREATE SEQUENCE,
  CREATE VIEW
TO demo;
```

No `CREATE SESSION` = no connection. You can type your password all day; Oracle will still ghost you.

---

## 2. Roles: Because Granting 200 Privileges by Hand Is Madness

There are **200+ system privileges**. Granting them one by one to many users is like mailing individual paperclips to everyone in the company.

Enter **roles**: named bundles of privileges.

- You grant **privileges to the role**.  
- Then you grant **the role to users**.  
- Later, you tweak the role once, and *everyone* using it changes automatically. Like group chat, but for power.

Create a role:

```sql
CREATE ROLE manager;
```

Grant privileges to the role:

```sql
GRANT
  CREATE TABLE,
  CREATE VIEW
TO manager;
```

Grant the role to a user:

```sql
GRANT manager TO alice;
```

You can even grant **roles to other roles**, which is how you accidentally create a tiny medieval feudal system inside your database.

---

## 3. Changing Passwords: Because “welcome123” Shouldn’t Be Forever

The DBA can:

- Create your account.  
- Set an **initial password**.  
- Mark it as **expired**, forcing you to change it on first login.  

You change your own password with:

```sql
ALTER USER demo IDENTIFIED BY new_password;
```

Congratulations, you are now slightly less of a security risk.

---

## 4. Object Privileges: Access to the Actual Data

System privileges affect the **database environment**.  
**Object privileges** affect **specific objects** like tables, views, and sequences.

Examples:

- **Sequences:** `SELECT`, `ALTER`  
- **Views:** `SELECT`, `INSERT`, `UPDATE`, `DELETE`  
- **Tables:** `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `ALTER`, `REFERENCES`, `INDEX`  

If you **own** an object, you automatically have all privileges on it. You are the landlord. You can then grant selectively to others.

Granting `SELECT` on a table:

```sql
GRANT SELECT ON employees TO demo;
```

Granting **column‑level** privileges (because you don’t trust people with everything):

```sql
GRANT UPDATE (department_name, location_id)
ON departments
TO demo, manager;
```

Here, users and roles can update only those two columns—no “accidental” salary adjustments.

---

## 5. WITH GRANT OPTION: Power That Spreads… and Bites Back

Sometimes you don’t just want someone to use your object—you want them to **pass that privilege on**.

That’s what `WITH GRANT OPTION` does:

```sql
GRANT SELECT, INSERT
ON departments
TO demo
WITH GRANT OPTION;
```

- `demo` can now grant `SELECT` and `INSERT` on `departments` to other users.  
- They can even grant `SELECT` to **PUBLIC**, meaning *everyone* who can log in. Bold choice.

But here’s the catch:

- If **you** granted the privilege with `WITH GRANT OPTION` and `demo` passes it on to `alex`,  
- **You cannot revoke it directly from `alex`**.  
- You must revoke it from **`demo`**, which then yanks it away from everyone they granted it to.  

It’s like giving someone your Netflix password and then needing to change it for *everyone* when your ex is still logged in.

---

## 6. Seeing Who Can Do What: Data Dictionary Views

Oracle gives you **data dictionary views** so you can find out:

- Which system privileges roles have.  
- Which privileges users have.  
- Which privileges have been granted *on your objects*.  
- Which privileges exist at the **column** level.  

Some of the useful views include (names vary by scope, but the pattern is clear):

- `USER_TAB_PRIVS_MADE` – object privileges **you granted** to others.  
- `USER_TAB_PRIVS_RECD` – object privileges **you received**.  
- Column‑level versions show who can do what on specific columns.

Example: seeing what you’ve handed out:

```sql
SELECT grantee, privilege, table_name
FROM   user_tab_privs_made;
```

This is the “who did I arm with what?” report.

---

## 7. Revoking Privileges: Taking the Toys Back

When something has gone horribly, predictably wrong, you can **revoke** privileges:

Generic syntax:

```sql
REVOKE privilege_list
ON object_name
FROM user_or_role;
```

Example:

```sql
REVOKE SELECT, INSERT
ON departments
FROM demo;
```

Important point:

- You **cannot revoke** a privilege *from someone you did not grant it to*.  
- If `ORA21` gave `SELECT` to `ORA22`, and `ORA22` gave it to `DEMO`,  
  - `ORA21` can’t revoke directly from `DEMO`.  
  - `ORA21` revokes from `ORA22`, and both `ORA22` and `DEMO` lose the privilege.  

After revocation, trying to use the privilege typically gives:

- “table or view does not exist” or  
- “insufficient privileges”  

Either way, the fun is over.

---

## 8. A Tiny Drama in Three Users

Here’s the mini‑soap opera from the demo:

1. `demo` is created but has **no `CREATE SESSION`**, so they cannot connect.  
2. As `SYSDBA`, the DBA grants `CREATE SESSION` to `demo`. Now demo can log in.  
3. User `ORA21` owns table `employees` and does:

   ```sql
   GRANT SELECT, UPDATE
   ON employees
   TO ora22
   WITH GRANT OPTION;
   ```

4. `ORA22` then does:

   ```sql
   GRANT SELECT
   ON ora21.employees
   TO demo;
   ```

   Now `demo` can query `ora21.employees`.

5. `ORA21` checks `USER_TAB_PRIVS_MADE` and sees:

   - Grants from `ORA21` to `ORA22`.  
   - Grants from `ORA22` to `DEMO`.  

6. `ORA21` tries to revoke from `DEMO` directly and fails:  
   “cannot revoke privileges that you did not grant.”

7. `ORA21` revokes from `ORA22` instead:

   ```sql
   REVOKE SELECT
   ON employees
   FROM ora22;
   ```

   Result: both `ORA22` **and** `DEMO` lose access.

Moral: with `WITH GRANT OPTION`, privileges form a little family tree, and you prune at the branch, not at the leaves.

---

## 9. What You Should Now Be Able to Do

By the end of this lesson, you should be able to:

- **Differentiate** system privileges and object privileges without mixing them up.  
- **Grant** system privileges and object privileges to users and roles.  
- **Create and use roles** to simplify privilege management.  
- **Use and respect** `WITH GRANT OPTION`, knowing how it spreads power and how revocation works.  
- **Inspect and clean up** privileges using data dictionary views and `REVOKE`.  

And if all of that still feels like a lot, remember: it’s better than discovering that “PUBLIC” can drop your tables. Because nothing says “Monday” like that.

