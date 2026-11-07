# SQL Studio Guide

SQL Studio is a small, VS Code-style tool for learning SQL.
It runs **real PostgreSQL** inside your browser, so there is no server, password or install.

| Screen | What it does |
|--------|--------------|
| **Left: Explorer** | Your databases. Click ▸ to see how many tables each has, then expand a table to see its columns. 🔑 = primary key, 🔗 = foreign key. |
| **Middle: Editor** | Write SQL here. It is the same editor as VS Code. |
| **Right: Output** | Results of every query you run, plus errors and hints. |

Your query files and data are saved automatically **in this browser**.

---

## Running queries

| How | What runs |
|-----|-----------|
| **▶ Run** button or <kbd>F5</kbd> | The selected text, or the **whole file** if nothing is selected |
| <kbd>Ctrl</kbd> + <kbd>Enter</kbd> | The **statement under the cursor** (it flashes blue) |
| Select a query, then <kbd>Enter</kbd> | Just the **selected** text |
| ▶ next to a table in the Explorer | `SELECT * FROM that_table;` |
| **Open in editor** on a code block in the notes | Adds the example to your file and selects it. Press <kbd>Enter</kbd> to run it |

If a query has an error, the wrong word gets a **red underline** in the editor. Hover over it to read the message.

Try it:

```sql
SELECT name, salary FROM employees WHERE salary > 60000 ORDER BY salary DESC;
```

---

## Keyboard shortcuts

These work just like in VS Code.

| Shortcut | Action |
|----------|--------|
| <kbd>Ctrl</kbd>+<kbd>C</kbd> / <kbd>X</kbd> / <kbd>V</kbd> | Copy / cut / paste (with nothing selected: the whole line) |
| <kbd>Ctrl</kbd>+<kbd>Z</kbd> / <kbd>Ctrl</kbd>+<kbd>Y</kbd> | Undo / redo |
| <kbd>Ctrl</kbd>+<kbd>Space</kbd> | Suggestions: tables, columns, functions, snippets |
| <kbd>Ctrl</kbd>+<kbd>/</kbd> | Comment / uncomment line (`--`) |
| <kbd>Shift</kbd>+<kbd>Alt</kbd>+<kbd>F</kbd> | Format the SQL nicely |
| <kbd>Ctrl</kbd>+<kbd>D</kbd> | Select the next match of the current word |
| <kbd>Alt</kbd>+<kbd>↑</kbd> / <kbd>↓</kbd> | Move line up / down |
| <kbd>Shift</kbd>+<kbd>Alt</kbd>+<kbd>↑</kbd> / <kbd>↓</kbd> | Copy line up / down |
| <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>K</kbd> | Delete line |
| <kbd>Alt</kbd>+Click | Add another cursor |
| <kbd>Ctrl</kbd>+<kbd>F</kbd> / <kbd>Ctrl</kbd>+<kbd>H</kbd> | Find / replace |
| <kbd>Ctrl</kbd>+<kbd>G</kbd> | Go to line |
| <kbd>F1</kbd> | Command palette (all editor commands) |
| <kbd>Ctrl</kbd>+<kbd>B</kbd> | Show / hide the Explorer |
| <kbd>Alt</kbd>+<kbd>N</kbd> | New query file |
| <kbd>Alt</kbd>+<kbd>W</kbd> | Close tab |
| <kbd>Ctrl</kbd>+<kbd>S</kbd> | Save (files also save automatically) |

**Snippets:** type one of these words and press <kbd>Tab</kbd> or <kbd>Enter</kbd>:
`sel`, `selw`, `join`, `ljoin`, `grp`, `ins`, `upd`, `del`, `crt`, `case`, `cte`, `win`, `tx`.
Then press <kbd>Tab</kbd> to jump between the blanks.

**Autocomplete:** type `e.` after `FROM employees e` and you get only the columns of `employees`.

---

## Databases

- `company` is your practice database. It has the 9 tables from `SQL/company.sql`.
- Make your own database: the **+** next to *Databases*, or run:

```sql
CREATE DATABASE playground;
```

- Switch databases with the dropdown above the editor, by clicking one in the Explorer, or in SQL:

```sql
USE company;
```

- **Messed up the data?** Hover over `company` in the Explorer and click ↺ (Reset). Everything goes back to the original data.

---

## PostgreSQL vs MySQL / SQLite

This tool uses **PostgreSQL**. Some MySQL habits are different here.
SQL Studio understands the common ones and shows you the real PostgreSQL way:

| You type (MySQL) | PostgreSQL way | psql shortcut |
|------------------|----------------|---------------|
| `USE company;` | connect to the database | `\c company` |
| `SHOW DATABASES;` | `SELECT datname FROM pg_database;` | `\l` |
| `SHOW TABLES;` | `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';` | `\dt` |
| `DESCRIBE employees;` | query `information_schema.columns` | `\d employees` |

Other differences worth knowing:

| Task | MySQL | PostgreSQL |
|------|-------|------------|
| Auto-number id | `INT AUTO_INCREMENT` | `SERIAL` or `INT GENERATED ALWAYS AS IDENTITY` |
| Year of a date | `YEAR(hire_date)` | `EXTRACT(YEAR FROM hire_date)` |
| Days between dates | `DATEDIFF(d2, d1)` | `d2 - d1` |
| Today | `CURDATE()` | `CURRENT_DATE` |
| Join text | `CONCAT(a, b)` | `a \|\| b` or `CONCAT(a, b)` |
| Case-insensitive LIKE | `LIKE` | `ILIKE` |
| Text in quotes | `'text'` or `"text"` | `'text'` only. `"..."` means a column/table name |

```sql
SELECT name,
       EXTRACT(YEAR FROM hire_date) AS joined_year,
       CURRENT_DATE - hire_date     AS days_in_company
FROM employees
ORDER BY days_in_company DESC;
```

**Practise safely with a transaction.** Nothing is saved until you `COMMIT`:

```sql
BEGIN;
DELETE FROM devices WHERE emp_id IS NULL;
SELECT COUNT(*) FROM devices;   -- 8
ROLLBACK;                        -- undo! back to 10
```
