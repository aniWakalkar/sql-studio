# Top 20 SQL Interview Questions & Answers

Important questions for a Backend Developer with 2–3 years of experience, explained in simple English with examples.

> **Practising in SQL Studio?** These examples are general. In the `company` database the employee key is `emp_id` (not `id`), and tables like `customers` and `accounts` don't exist, so adjust those names before running a query.

---

## 1. SQL Basics

### Q1. What is SQL? What are its different types of commands?

**Answer:**

SQL (Structured Query Language) is used to communicate with relational databases. We use it to store, retrieve, update, and delete data.

There are 5 main categories:

| Type | Full Form                    | Commands                      |
| ---- | ---------------------------- | ----------------------------- |
| DDL  | Data Definition Language     | CREATE, ALTER, DROP, TRUNCATE |
| DML  | Data Manipulation Language   | INSERT, UPDATE, DELETE        |
| DQL  | Data Query Language          | SELECT                        |
| DCL  | Data Control Language        | GRANT, REVOKE                 |
| TCL  | Transaction Control Language | COMMIT, ROLLBACK, SAVEPOINT   |

### Q2. Difference between DELETE, TRUNCATE, and DROP?

**Answer:**

| DELETE                       | TRUNCATE                | DROP                    |
| ---------------------------- | ----------------------- | ----------------------- |
| Deletes selected or all rows | Deletes all rows        | Deletes entire table    |
| Supports WHERE               | No WHERE                | No WHERE                |
| Table structure remains      | Table structure remains | Table structure removed |
| DML command                  | DDL command             | DDL command             |

Example:

```sql
-- Delete specific rows
DELETE FROM employees WHERE id = 5;

-- Delete all records
TRUNCATE TABLE employees;

-- Delete complete table
DROP TABLE employees;
```

### Q3. Difference between WHERE and HAVING?

**Answer:**

- WHERE filters individual rows before grouping.
- HAVING filters groups after GROUP BY.

Example:

```sql
-- WHERE
SELECT *
FROM employees
WHERE salary > 50000;
```

```sql
-- HAVING
SELECT dept_id, COUNT(*)
FROM employees
GROUP BY dept_id
HAVING COUNT(*) > 5;
```

### Q4. Difference between PRIMARY KEY and UNIQUE KEY?

**Answer:**

| Primary Key                               | Unique Key                             |
| ----------------------------------------- | -------------------------------------- |
| Uniquely identifies each row              | Ensures unique values                  |
| Cannot contain NULL                       | NULL handling depends on database      |
| Only one primary key constraint per table | Multiple unique constraints allowed    |
| Can be referenced by foreign keys         | Can also be referenced by foreign keys |

### Q5. Difference between NULL, 0, and empty string?

**Answer:**

- NULL: Value is missing or unknown.
- 0: Numeric value is zero.
- Empty string (`''`): A string containing no characters.

Example:

```sql
SELECT *
FROM employees
WHERE salary IS NULL;
```

Remember: Use `IS NULL`, not `= NULL`.

---

## 2. SQL Joins

### Q6. What are Joins in SQL? Explain different types.

**Answer:**

Joins are used to retrieve related data from multiple tables.

Suppose we have two tables:

**employees**

| id | name   | dept_id |
| -- | ------ | ------- |
| 1  | Rahul  | 10      |
| 2  | Amit   | 20      |
| 3  | Vikram | 30      |

**departments**

| dept_id | dept_name |
| ------- | --------- |
| 10      | IT        |
| 20      | HR        |
| 40      | Finance   |

**1. INNER JOIN:** Returns only matching records.

```sql
SELECT e.name, d.dept_name
FROM employees e
INNER JOIN departments d
ON e.dept_id = d.dept_id;
```

Result: Rahul–IT, Amit–HR.

**2. LEFT JOIN:** Returns all records from the left table and matching records from the right table.

```sql
SELECT e.name, d.dept_name
FROM employees e
LEFT JOIN departments d
ON e.dept_id = d.dept_id;
```

Result: Rahul–IT, Amit–HR, Vikram–NULL.

**3. RIGHT JOIN:** Returns all records from the right table and matching records from the left table.

```sql
SELECT e.name, d.dept_name
FROM employees e
RIGHT JOIN departments d
ON e.dept_id = d.dept_id;
```

Result includes Finance with NULL employee name.

**4. FULL OUTER JOIN:** Returns all matching and non-matching records from both tables.

```sql
SELECT e.name, d.dept_name
FROM employees e
FULL OUTER JOIN departments d
ON e.dept_id = d.dept_id;
```

**5. CROSS JOIN:** Returns every possible combination of rows.

```sql
SELECT *
FROM employees
CROSS JOIN departments;
```

**6. SELF JOIN:** Joins a table with itself.

```sql
SELECT e.name AS employee,
       m.name AS manager
FROM employees e
LEFT JOIN employees m
ON e.manager_id = m.id;
```

### Q7. Difference between INNER JOIN and LEFT JOIN?

**Answer:**

- INNER JOIN returns only matching records from both tables.
- LEFT JOIN returns all records from the left table, including unmatched records.

### Q8. What is SELF JOIN?

**Answer:**

SELF JOIN means joining a table with itself.

It is useful when we need to retrieve hierarchical relationships, such as employees and their managers.

```sql
SELECT
    e.name AS employee_name,
    m.name AS manager_name
FROM employees e
LEFT JOIN employees m
ON e.manager_id = m.id;
```

### Q9. Difference between UNION and UNION ALL?

**Answer:**

| UNION                     | UNION ALL               |
| ------------------------- | ----------------------- |
| Removes duplicate records | Keeps duplicate records |
| Usually slower            | Usually faster          |
| Combines results          | Combines results        |

Example:

```sql
SELECT name FROM employees
UNION
SELECT name FROM customers;
```

```sql
SELECT name FROM employees
UNION ALL
SELECT name FROM customers;
```

Both queries require the same number of columns with compatible data types.

---

## 3. Aggregate Functions and Subqueries

### Q10. What are aggregate functions in SQL?

**Answer:**

Aggregate functions perform calculations on multiple rows and return a single result per group or for the complete result set.

| Function | Purpose            |
| -------- | ------------------ |
| COUNT()  | Counts rows/values |
| SUM()    | Calculates total   |
| AVG()    | Calculates average |
| MIN()    | Finds minimum      |
| MAX()    | Finds maximum      |

Example:

```sql
SELECT
    COUNT(*) AS total_employees,
    SUM(salary) AS total_salary,
    AVG(salary) AS average_salary,
    MIN(salary) AS minimum_salary,
    MAX(salary) AS maximum_salary
FROM employees;
```

### Q11. Difference between GROUP BY and ORDER BY?

**Answer:**

- GROUP BY groups rows having similar values.
- ORDER BY sorts the result in ascending or descending order.

Example:

```sql
SELECT dept_id, COUNT(*) AS total
FROM employees
GROUP BY dept_id
ORDER BY total DESC;
```

This query counts employees in each department and sorts departments by employee count.

### Q12. What is a Subquery? Explain correlated and non-correlated subqueries.

**Answer:**

A subquery is a query written inside another SQL query.

**Non-correlated subquery:** Executes independently of the outer query.

```sql
SELECT *
FROM employees
WHERE salary > (
    SELECT AVG(salary)
    FROM employees
);
```

**Correlated subquery:** Depends on the outer query and references its columns.

```sql
SELECT *
FROM employees e
WHERE salary > (
    SELECT AVG(salary)
    FROM employees
    WHERE dept_id = e.dept_id
);
```

This returns employees earning more than their department's average salary.

### Q13. Difference between IN, EXISTS, and JOIN?

**Answer:**

- IN: Checks whether a value exists in a list or subquery result.
- EXISTS: Checks whether a subquery returns at least one row.
- JOIN: Combines columns from multiple tables based on a relationship.

Example:

```sql
-- IN
SELECT *
FROM employees
WHERE dept_id IN (
    SELECT dept_id FROM departments
);
```

```sql
-- EXISTS
SELECT *
FROM employees e
WHERE EXISTS (
    SELECT 1
    FROM departments d
    WHERE d.dept_id = e.dept_id
);
```

```sql
-- JOIN
SELECT e.*, d.dept_name
FROM employees e
JOIN departments d
ON e.dept_id = d.dept_id;
```

---

## 4. Advanced SQL Questions

### Q14. What is an Index in SQL?

**Answer:**

An index is a database object that helps retrieve records faster without scanning the entire table in many cases.

Example:

```sql
CREATE INDEX idx_employee_email
ON employees(email);
```

Advantages:

- Faster SELECT queries.
- Faster searching and filtering.
- Improves JOIN performance in suitable cases.

Disadvantages:

- Requires additional storage.
- INSERT, UPDATE, and DELETE operations can become slower because indexes need maintenance.

### Q15. Difference between Clustered and Non-Clustered Index?

**Answer:**

- Clustered index determines how table data is physically organized in database storage.
- Non-clustered index stores indexed values and references to the corresponding table rows separately.

Important PostgreSQL note: PostgreSQL does not have SQL Server-style clustered indexes. It supports indexes and the `CLUSTER` command to physically reorder a table based on an index, but that ordering is not automatically maintained.

### Q16. What are Window Functions? Explain ROW_NUMBER(), RANK(), and DENSE_RANK().

**Answer:**

Window functions perform calculations across related rows without combining them into one row like GROUP BY.

Example:

```sql
SELECT
    name,
    salary,
    ROW_NUMBER() OVER (ORDER BY salary DESC) AS row_num,
    RANK() OVER (ORDER BY salary DESC) AS rank_num,
    DENSE_RANK() OVER (ORDER BY salary DESC) AS dense_rank
FROM employees;
```

Suppose salaries are:

| Employee | Salary | ROW_NUMBER | RANK | DENSE_RANK |
| -------- | ------ | ---------- | ---- | ---------- |
| Rahul    | 90000  | 1          | 1    | 1          |
| Amit     | 80000  | 2          | 2    | 2          |
| Vikram   | 80000  | 3          | 2    | 2          |
| Raj      | 60000  | 4          | 4    | 3          |

Remember:

- ROW_NUMBER(): Assigns a unique sequential number.
- RANK(): Gives the same rank to ties, leaving gaps.
- DENSE_RANK(): Gives the same rank to ties without leaving gaps.

### Q17. What is CTE (Common Table Expression)?

**Answer:**

CTE is a temporary named result set that makes complex queries easier to read and maintain.

It is created using the `WITH` keyword.

Example:

```sql
WITH high_salary AS (
    SELECT *
    FROM employees
    WHERE salary > 50000
)
SELECT *
FROM high_salary;
```

CTEs can also be recursive.

### Q18. Difference between Stored Procedure and Function?

**Answer:**

| Function                                                    | Stored Procedure                                          |
| ----------------------------------------------------------- | --------------------------------------------------------- |
| Returns a value or table                                    | Can return results using output parameters or result sets |
| Can be used in SQL expressions (depending on function type) | Called using CALL in PostgreSQL                           |
| Commonly used for calculations                              | Commonly used for business operations                     |
| Cannot independently manage transactions in PostgreSQL      | Can manage transactions in supported procedure contexts   |

### Q19. What are ACID properties in DBMS?

**Answer:**

ACID properties ensure reliable database transactions.

1. **Atomicity:** Either all operations happen or none happen.
2. **Consistency:** Database remains valid before and after a transaction.
3. **Isolation:** Concurrent transactions should not interfere improperly.
4. **Durability:** Once committed, changes are persistent.

Example: Bank transfer of ₹1,000:

```sql
BEGIN;

UPDATE accounts
SET balance = balance - 1000
WHERE id = 1;

UPDATE accounts
SET balance = balance + 1000
WHERE id = 2;

COMMIT;
```

If something goes wrong before committing, use `ROLLBACK`.

### Q20. What is Database Normalization? Explain 1NF, 2NF, and 3NF.

**Answer:**

Simple meaning: Database mein duplicate data ko kam karna aur data ko properly organize karna is called Normalization.

Maan lo humare paas ek `employees` table hai:

#### Without Normalization

| emp_id | emp_name | dept_name | dept_location |
| ------ | -------- | --------- | ------------- |
| 1      | Rahul    | IT        | Pune          |
| 2      | Amit     | IT        | Pune          |
| 3      | Raj      | HR        | Mumbai        |
| 4      | Vijay    | HR        | Mumbai        |

Problem:

- IT department ki details baar-baar repeat ho rahi hain.
- Agar IT department ka location change hua, toh multiple rows update karni padengi.
- Isse data inconsistency ho sakti hai.

Normalization isi problem ko solve karta hai.

#### First Normal Form (1NF)

Simple meaning: Ek cell mein sirf ek value honi chahiye. Multiple values nahi honi chahiye.

**Wrong example**

| emp_id | emp_name | skills            |
| ------ | -------- | ----------------- |
| 1      | Rahul    | Python, SQL, Java |
| 2      | Amit     | React, Node.js    |

**Correct example**

| emp_id | emp_name | skill   |
| ------ | -------- | ------- |
| 1      | Rahul    | Python  |
| 1      | Rahul    | SQL     |
| 1      | Rahul    | Java    |
| 2      | Amit     | React   |
| 2      | Amit     | Node.js |

Remember: One cell = One value.

#### Second Normal Form (2NF)

Simple meaning: Table 1NF mein honi chahiye aur har non-key column ko complete primary key par depend karna chahiye.

Isko samajhne ke liye example: maan lo ek student multiple courses mein enroll kar sakta hai.

**Wrong example**

| student_id | course_id | student_name | course_name |
| ---------- | --------- | ------------ | ----------- |
| 1          | 101       | Rahul        | Python      |
| 1          | 102       | Rahul        | SQL         |
| 2          | 101       | Amit         | Python      |

Yahan composite primary key hai: `(student_id, course_id)`.

Problem:

- `student_name` sirf `student_id` par depend karta hai.
- `course_name` sirf `course_id` par depend karta hai.
- Dono complete composite key par depend nahi karte.

**Correct example**

Students Table

| student_id | student_name |
| ---------- | ------------ |
| 1          | Rahul        |
| 2          | Amit         |

Courses Table

| course_id | course_name |
| --------- | ----------- |
| 101       | Python      |
| 102       | SQL         |

Enrollments Table

| student_id | course_id |
| ---------- | --------- |
| 1          | 101       |
| 1          | 102       |
| 2          | 101       |

Remember: Every non-key column must depend on the whole key, not just part of it.

#### Third Normal Form (3NF)

Simple meaning: Table 2NF mein honi chahiye aur non-key column kisi doosre non-key column par depend nahi hona chahiye.

**Wrong example**

| emp_id | emp_name | dept_id | dept_name |
| ------ | -------- | ------- | --------- |
| 1      | Rahul    | 10      | IT        |
| 2      | Amit     | 10      | IT        |
| 3      | Raj      | 20      | HR        |

Problem:

- `emp_id` determines `dept_id`.
- `dept_id` determines `dept_name`.
- Isliye department name indirectly employee ID par depend kar raha hai.

**Correct example**

Employees Table

| emp_id | emp_name | dept_id |
| ------ | -------- | ------- |
| 1      | Rahul    | 10      |
| 2      | Amit     | 10      |
| 3      | Raj      | 20      |

Departments Table

| dept_id | dept_name |
| ------- | --------- |
| 10      | IT        |
| 20      | HR        |

Ab department name sirf Departments table mein store hoga.

Remember: Non-key column should depend only on the key, not on another non-key column.

#### Quick Revision for Interviews

| Normal Form | Simple Rule                                                |
| ----------- | ---------------------------------------------------------- |
| 1NF         | One cell = One value                                       |
| 2NF         | Complete primary key par dependency                        |
| 3NF         | Non-key column should not depend on another non-key column |

#### Interview mein aise answer dena

> "Normalization is a process of organizing database tables to reduce data duplication and maintain data consistency.
>
> - 1NF means each cell should contain only one value.
> - 2NF means it should be in 1NF and every non-key column should depend on the complete primary key.
> - 3NF means it should be in 2NF and non-key columns should not depend on other non-key columns."

---

# Top 10 SQL Practical Interview Questions with Answers

These are particularly important for backend developer interviews.

### 1. Find the second-highest salary.

```sql
SELECT MAX(salary)
FROM employees
WHERE salary < (
    SELECT MAX(salary)
    FROM employees
);
```

### 2. Find the highest salary in each department.

```sql
SELECT dept_id, MAX(salary) AS highest_salary
FROM employees
GROUP BY dept_id;
```

### 3. Find duplicate records.

```sql
SELECT email, COUNT(*)
FROM employees
GROUP BY email
HAVING COUNT(*) > 1;
```

### 4. Delete duplicate records while keeping one.

PostgreSQL example:

```sql
WITH duplicates AS (
    SELECT id,
           ROW_NUMBER() OVER (
               PARTITION BY email
               ORDER BY id
           ) AS rn
    FROM employees
)
DELETE FROM employees
WHERE id IN (
    SELECT id
    FROM duplicates
    WHERE rn > 1
);
```

### 5. Find employees who have the same salary.

```sql
SELECT salary, COUNT(*)
FROM employees
GROUP BY salary
HAVING COUNT(*) > 1;
```

### 6. Find employees who do not belong to any department.

```sql
SELECT *
FROM employees
WHERE dept_id IS NULL;
```

If you mean employees whose department ID has no matching department:

```sql
SELECT e.*
FROM employees e
LEFT JOIN departments d
ON e.dept_id = d.dept_id
WHERE d.dept_id IS NULL;
```

### 7. Find employees earning more than average salary.

```sql
SELECT *
FROM employees
WHERE salary > (
    SELECT AVG(salary)
    FROM employees
);
```

### 8. Find the top 3 highest-paid employees in each department.

```sql
SELECT *
FROM (
    SELECT *,
           DENSE_RANK() OVER (
               PARTITION BY dept_id
               ORDER BY salary DESC
           ) AS rnk
    FROM employees
) t
WHERE rnk <= 3;
```

This returns the top 3 distinct salary ranks per department, including ties.

### 9. Find employees who joined in the last 30 days.

```sql
SELECT *
FROM employees
WHERE hire_date >= CURRENT_DATE - INTERVAL '30 days';
```

### 10. Find departments having more than 5 employees.

```sql
SELECT dept_id, COUNT(*) AS total_employees
FROM employees
GROUP BY dept_id
HAVING COUNT(*) > 5;
```

---

# What to Master First

For 2–3 years of backend development experience, don't just memorize definitions. Be able to explain and write queries.

| Topic               | Importance |
| ------------------- | ---------- |
| Joins               | Very High  |
| GROUP BY / HAVING   | Very High  |
| Subqueries          | Very High  |
| Indexes             | Very High  |
| Window Functions    | Very High  |
| CTE                 | High       |
| Constraints         | High       |
| Transactions / ACID | High       |
| Normalization       | High       |
| Query Optimization  | Very High  |

**Next step:** Practice these questions one by one. Try writing the SQL query yourself before checking the answer. This will help much more than memorizing all 20 answers.
