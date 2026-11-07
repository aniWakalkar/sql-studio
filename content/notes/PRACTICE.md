# SQL Practice Guide

You have **1 practice database, `company`**, with 6 tables. Every table has **10 rows or fewer**, so you can check results by eye.

```
SQL/
├── notes/
│   ├── README.MD   ← theory / interview notes
│   └── PRACTICE.md ← this file (how to run + questions)
├── practice.sql    ← write your queries here
├── company.sql     ← the original data (CREATE TABLE + INSERT statements)
├── company.db      ← the database itself
├── run.py          ← runs your .sql file and prints the results
└── .vscode/        ← sets up the Ctrl + Shift + B shortcut
```

We use **SQLite**. It is a real SQL database, but the whole database is a single file, so there's no server, password or install.
About 95% of what you write here works the same in MySQL and PostgreSQL. The differences are listed at the bottom.

---

## Part 1 – How to run queries in VS Code

1. Open **`practice.sql`** and write your queries, each ending with `;`:
   ```sql
   SELECT * FROM employees;
   SELECT * FROM departments;
   ```
2. Press **`F5`** (or `Ctrl + Shift + B`). The first time, pick **"Run SQL file"** if VS Code asks.
   Or open the terminal (`` Ctrl + ` ``) and type:
   ```bash
   python run.py practice.sql
   ```
3. Every query's result prints in the terminal as a table (run commands from the `SQL` folder). A mistake in one query shows an `ERROR:` and the rest still run.

This works for any `.sql` file in the folder, so you can make `joins_practice.sql` and press `Ctrl + Shift + B` on it.

Quick one-line query:
```bash
python run.py "SELECT * FROM employees"
```

> The `USE company;` line at the top of `practice.sql` is optional. There is only one database, but it's good MySQL habit.

### Messed up the data? Reset it!
Practice `UPDATE`, `DELETE` and `DROP` as much as you like. To get the original data back, run:

```bash
python run.py --reset
```

---

## Part 2 – What's inside the database

### 🏢 `company.db`
| Table | Columns |
|-------|---------|
9 tables, **10 rows each**.

| Table | Columns |
|-------|---------|
| **employees** | emp_id, name, gender, salary, dept_id, level_id, manager_id, hire_date, email |
| **departments** | dept_id, dept_name, location |
| **levels** | level_id, level_name, min_salary, max_salary |
| **projects** | project_id, project_name, dept_id, budget, start_date, end_date |
| **devices** | device_id, device_type, brand, serial_no, emp_id, assigned_date |
| **addresses** | address_id, emp_id, address_type, street, city_id, pincode |
| **cities** | city_id, city_name, state_id |
| **states** | state_id, state_name, country_id |
| **countries** | country_id, country_name, country_code, continent |

```
departments ──< employees >── levels
     │            │  │  └──< devices      (one employee → many devices)
     │            │  └─────< addresses >── cities >── states >── countries
     └──< projects └── manager_id → employees (self join)
```
`──<` means "one → many". For example, one department has many employees.

Edge cases planted for you:
- **employees:** Neha has no department, two people are named *Amit Kumar*, some emails are NULL, two salaries are tied at 75000, `manager_id` points to another employee (self join)
- **departments:** Marketing, Operations, Legal, Support, R&D and Admin have no employees
- **levels:** Intern and Manager → CEO have nobody yet
- **projects:** AI Chatbot has no department
- **addresses:** Priya and Anjali have 2 addresses (Anjali's permanent one is in London), employees 9 and 10 have none
- **cities / states / countries:** Maharashtra has 2 cities, Ontario has no cities, Japan, Australia, UAE, Singapore and France have no states, several cities have no employees living there
- **devices:** 2 are unassigned, Rahul and Priya have 2 each

Extra questions to try:
1. Show each employee with their level name.
2. List employees who have no device.
3. Count the devices per employee, including people with 0.
4. Show the unassigned devices (`emp_id IS NULL`).
5. Show each employee's full address: street, city, state, country. *(4-table join)*
6. Find employees who have more than one address.
7. Count the employees living in each country.
8. List countries that have no states.
9. List cities where no employee lives.
10. Match each employee to a level by salary alone: `JOIN levels l ON e.salary BETWEEN l.min_salary AND l.max_salary` (a "non-equi join").

<details><summary>Answer to Q5 (full address)</summary>

```sql
SELECT e.name, a.address_type, a.street, c.city_name, s.state_name, co.country_name
FROM addresses a
JOIN employees e  ON a.emp_id     = e.emp_id
JOIN cities    c  ON a.city_id    = c.city_id
JOIN states    s  ON c.state_id   = s.state_id
JOIN countries co ON s.country_id = co.country_id;
```
</details>


---

## Part 3 – Practice Questions

Try each question yourself first, then click **"Answer"** to check.
(Open this file in **preview** to make the answers clickable: `Ctrl + Shift + V`)

### 🏢 Company (`company.db`)

**Level 1 – Basics**

1. Show all employees.
<details><summary>Answer</summary>

```sql
SELECT * FROM employees;
```
</details>

2. Show only the name and salary of employees earning more than 60000.
<details><summary>Answer</summary>

```sql
SELECT name, salary FROM employees WHERE salary > 60000;
```
</details>

3. Show all employees sorted by salary, highest first.
<details><summary>Answer</summary>

```sql
SELECT * FROM employees ORDER BY salary DESC;
```
</details>

4. Find employees whose name starts with 'A'.
<details><summary>Answer</summary>

```sql
SELECT * FROM employees WHERE name LIKE 'A%';
```
</details>

5. Find employees who have no email.
<details><summary>Answer</summary>

```sql
SELECT * FROM employees WHERE email IS NULL;
```
</details>

**Level 2 – Aggregates & GROUP BY**

6. Find the total number of employees and the average salary.
<details><summary>Answer</summary>

```sql
SELECT COUNT(*) AS total, AVG(salary) AS avg_salary FROM employees;
```
</details>

7. Find the number of employees in each department (dept_id).
<details><summary>Answer</summary>

```sql
SELECT dept_id, COUNT(*) AS total
FROM employees
GROUP BY dept_id;
```
</details>

8. Show the departments that have more than 2 employees.
<details><summary>Answer</summary>

```sql
SELECT dept_id, COUNT(*) AS total
FROM employees
GROUP BY dept_id
HAVING COUNT(*) > 2;
```
</details>

9. Find duplicate employee names.
<details><summary>Answer</summary>

```sql
SELECT name, COUNT(*) FROM employees
GROUP BY name
HAVING COUNT(*) > 1;
```
</details>

**Level 3 – JOINs**

10. Show each employee's name with their department name.
<details><summary>Answer</summary>

```sql
SELECT e.name, d.dept_name
FROM employees e
INNER JOIN departments d ON e.dept_id = d.dept_id;
```
Neha is missing because she has no department. Try a LEFT JOIN to see her too.
</details>

11. Show every department and how many employees it has, including departments with 0.
<details><summary>Answer</summary>

```sql
SELECT d.dept_name, COUNT(e.emp_id) AS total
FROM departments d
LEFT JOIN employees e ON d.dept_id = e.dept_id
GROUP BY d.dept_name;
```
</details>

12. Show each employee with their manager's name (self join).
<details><summary>Answer</summary>

```sql
SELECT e.name AS employee, m.name AS manager
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.emp_id;
```
</details>

**Level 4 – Interview Favourites**

13. Find the second highest salary.
<details><summary>Answer</summary>

```sql
SELECT MAX(salary) FROM employees
WHERE salary < (SELECT MAX(salary) FROM employees);
```
</details>

14. Find employees who earn more than the average salary.
<details><summary>Answer</summary>

```sql
SELECT name, salary FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees);
```
</details>

15. Find the highest-paid employee in each department.
<details><summary>Answer</summary>

```sql
SELECT name, dept_id, salary FROM (
    SELECT name, dept_id, salary,
           RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS rnk
    FROM employees
) t
WHERE rnk = 1;
```
Sales shows **two** people because Amit and Kavya both earn 60000, and RANK gives ties the same rank. Change `RANK()` to `ROW_NUMBER()` and see what changes.
</details>

16. Label each salary as 'High' (> 70000), 'Medium' (> 50000) or 'Low'.
<details><summary>Answer</summary>

```sql
SELECT name, salary,
       CASE
           WHEN salary > 70000 THEN 'High'
           WHEN salary > 50000 THEN 'Medium'
           ELSE 'Low'
       END AS level
FROM employees;
```
</details>

---

### 🛠️ DDL Practice

Try these to practise creating and changing structure:

```sql
-- Create a new table
CREATE TABLE test_table (
    id    INTEGER PRIMARY KEY,
    name  VARCHAR(50) NOT NULL,
    score INTEGER DEFAULT 0
);

-- Add a column
ALTER TABLE test_table ADD COLUMN city VARCHAR(50);

-- Rename the table
ALTER TABLE test_table RENAME TO my_table;

-- Insert and view
INSERT INTO my_table (id, name, city) VALUES (1, 'Test', 'Pune');
SELECT * FROM my_table;

-- Remove it
DROP TABLE my_table;
```

---

## Part 4 – SQLite vs MySQL (small differences)

| Task | SQLite (here) | MySQL |
|------|---------------|-------|
| Year from a date | `strftime('%Y', hire_date)` | `YEAR(hire_date)` |
| Month from a date | `strftime('%m', hire_date)` | `MONTH(hire_date)` |
| Today's date | `DATE('now')` | `CURDATE()` |
| Days between dates | `JULIANDAY(d2) - JULIANDAY(d1)` | `DATEDIFF(d2, d1)` |
| Join text | `name \|\| ' ' \|\| city` or `CONCAT()` | `CONCAT(name, ' ', city)` |
| Auto-number id | `INTEGER PRIMARY KEY` | `INT AUTO_INCREMENT PRIMARY KEY` |
| Show tables | `SELECT name FROM sqlite_master WHERE type='table';` | `SHOW TABLES;` |
| Table structure | `PRAGMA table_info(employees);` | `DESCRIBE employees;` |

> 💡 `RIGHT JOIN` and `FULL OUTER JOIN` work here (SQLite 3.39+). You can also flip the tables and use a `LEFT JOIN`, which gives the same result.

Happy practising! 🚀
