# SQL Commands – Complete Level-Wise Classification

SQL mein sirf Database, Table aur Data create/delete hi nahi karte. Hum Database ka name, Table ka name, Column ka name, Column ka data type, constraints, default values aur bhi bahut kuch change kar sakte hain.

Ye PostgreSQL ke according complete interview revision hai.

> **SQL Studio mein practice karni hai?** Pehle ek alag database bana lo, taaki `company` ka data safe rahe:
>
> ```sql
> CREATE DATABASE playground;
> USE playground;
> ```
>
> `ALTER DATABASE ... OWNER` aur `ALTER DATABASE ... SET` ko real PostgreSQL server chahiye, isliye ye SQL Studio mein nahi chalenge. Database ka create, drop aur rename chalta hai.
>
> `OWNER TO admin_user` wale examples ke liye pehle role banana padta hai: `CREATE ROLE admin_user;`

SQL operations ko 4 levels mein divide karte hain:

1. Database Level
2. Table Level
3. Column Level
4. Row / Data Level

---

# 1. Database Level Operations

Database level par hum poore database ko manage karte hain.

| Operation       | SQL Command           | Purpose                           |
| --------------- | --------------------- | --------------------------------- |
| Create Database | CREATE DATABASE       | New database banana               |
| Delete Database | DROP DATABASE         | Database delete karna             |
| Rename Database | ALTER DATABASE RENAME | Database ka naam change karna     |
| Change Owner    | ALTER DATABASE OWNER  | Database ka owner change karna    |
| Change Settings | ALTER DATABASE SET    | Database ki settings change karna |

### Examples

**1. Create Database**

```sql
CREATE DATABASE company;
```

**2. Delete Database**

```sql
DROP DATABASE company;
```

**3. Rename Database**

```sql
ALTER DATABASE company
RENAME TO company_db;
```

**4. Change Database Owner**

```sql
ALTER DATABASE company_db
OWNER TO admin_user;
```

**5. Change Database Settings**

```sql
ALTER DATABASE company_db
SET timezone TO 'Asia/Kolkata';
```

> **Important:** PostgreSQL mein database rename karte waqt us database se connected nahi hona chahiye. Database drop karne ke liye bhi us database se connected nahi rehna chahiye.

---

# 2. Table Level Operations

Table level par hum poori table ko manage karte hain.

| Operation    | SQL Command            | Purpose                                |
| ------------ | ---------------------- | -------------------------------------- |
| Create Table | CREATE TABLE           | New table banana                       |
| Delete Table | DROP TABLE             | Table delete karna                     |
| Rename Table | ALTER TABLE RENAME     | Table ka naam change karna             |
| Empty Table  | TRUNCATE TABLE         | Saara data remove karna                |
| Change Owner | ALTER TABLE OWNER      | Table ka owner change karna            |
| Move Table   | ALTER TABLE SET SCHEMA | Table ko doosre schema mein move karna |

### Examples

**1. Create Table**

```sql
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    salary INTEGER
);
```

**2. Delete Table**

```sql
DROP TABLE employees;
```

**3. Rename Table**

```sql
ALTER TABLE employees
RENAME TO employee_details;
```

**4. Empty Table**

```sql
TRUNCATE TABLE employee_details;
```

**5. Change Table Owner**

```sql
ALTER TABLE employee_details
OWNER TO admin_user;
```

**6. Move Table to Another Schema**

```sql
ALTER TABLE employee_details
SET SCHEMA public;
```

---

# 3. Column Level Operations

Ye bahut important section hai. Interview mein isse related kaafi practical questions pooche jaate hain.

Column level par hum column add, delete, rename, modify aur uski properties change kar sakte hain.

| Operation        | SQL Command                | Purpose                         |
| ---------------- | -------------------------- | ------------------------------- |
| Add Column       | ADD COLUMN                 | New column add karna            |
| Delete Column    | DROP COLUMN                | Column delete karna             |
| Rename Column    | RENAME COLUMN              | Column ka naam change karna     |
| Change Data Type | ALTER COLUMN TYPE          | Column ka datatype change karna |
| Set Default      | ALTER COLUMN SET DEFAULT   | Default value set karna         |
| Remove Default   | ALTER COLUMN DROP DEFAULT  | Default value remove karna      |
| Set NOT NULL     | ALTER COLUMN SET NOT NULL  | NULL values prevent karna       |
| Remove NOT NULL  | ALTER COLUMN DROP NOT NULL | NULL allow karna                |

### Examples

Assume humare paas ye table hai:

```sql
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    salary INTEGER
);
```

**1. Add New Column**

```sql
ALTER TABLE employees
ADD COLUMN email VARCHAR(150);
```

Multiple columns bhi add kar sakte ho:

```sql
ALTER TABLE employees
ADD COLUMN age INTEGER,
ADD COLUMN gender VARCHAR(10);
```

**2. Delete Column**

```sql
ALTER TABLE employees
DROP COLUMN email;
```

**3. Rename Column**

```sql
ALTER TABLE employees
RENAME COLUMN name TO employee_name;
```

**4. Change Data Type**

Maan lo salary ka datatype INTEGER se BIGINT karna hai:

```sql
ALTER TABLE employees
ALTER COLUMN salary TYPE BIGINT;
```

INTEGER se VARCHAR karna hai:

```sql
ALTER TABLE employees
ALTER COLUMN salary TYPE VARCHAR(50)
USING salary::VARCHAR;
```

`USING` ka use tab hota hai jab existing data ko naye datatype mein convert karna ho aur PostgreSQL ko explicit conversion batani pade.

**5. Set Default Value**

```sql
ALTER TABLE employees
ALTER COLUMN salary SET DEFAULT 25000;
```

Ab agar salary insert nahi karoge toh default value 25000 use hogi.

**6. Remove Default Value**

```sql
ALTER TABLE employees
ALTER COLUMN salary DROP DEFAULT;
```

**7. Set NOT NULL**

```sql
ALTER TABLE employees
ALTER COLUMN name SET NOT NULL;
```

Ab name column mein NULL value insert nahi kar sakte.

**8. Remove NOT NULL**

```sql
ALTER TABLE employees
ALTER COLUMN name DROP NOT NULL;
```

Ab name column mein NULL allow hoga.

---

# 4. Constraint Level Operations

Constraints database mein rules apply karne ke liye use hote hain.

| Constraint  | Purpose                      |
| ----------- | ---------------------------- |
| PRIMARY KEY | Unique identification        |
| FOREIGN KEY | Tables ke beech relationship |
| UNIQUE      | Duplicate values prevent     |
| NOT NULL    | NULL values prevent          |
| CHECK       | Specific condition apply     |
| DEFAULT     | Default value provide        |

### Examples

**1. Add Primary Key**

```sql
ALTER TABLE employees
ADD CONSTRAINT employees_pkey
PRIMARY KEY (id);
```

Note: Agar primary key already exist karti hai toh dobara add nahi kar sakte.

**2. Add UNIQUE Constraint**

```sql
ALTER TABLE employees
ADD CONSTRAINT unique_email
UNIQUE (email);
```

**3. Add CHECK Constraint**

```sql
ALTER TABLE employees
ADD CONSTRAINT check_salary
CHECK (salary >= 0);
```

**4. Add Foreign Key**

```sql
ALTER TABLE employees
ADD COLUMN dept_id INTEGER;

ALTER TABLE employees
ADD CONSTRAINT fk_department
FOREIGN KEY (dept_id)
REFERENCES departments(dept_id);
```

**5. Drop Constraint**

```sql
ALTER TABLE employees
DROP CONSTRAINT check_salary;
```

**6. Change Column Default**

```sql
ALTER TABLE employees
ALTER COLUMN salary SET DEFAULT 30000;
```

---

# 5. Row / Data Level Operations

Yahan hum table ke andar actual records par operations perform karte hain.

| Operation   | SQL Command | Purpose                |
| ----------- | ----------- | ---------------------- |
| Insert Data | INSERT      | New record add         |
| Update Data | UPDATE      | Existing record modify |
| Delete Data | DELETE      | Record delete          |
| Fetch Data  | SELECT      | Records retrieve       |

### Examples

**1. INSERT – New Data Add**

```sql
INSERT INTO employees (name, salary)
VALUES ('Rahul', 50000);
```

Multiple rows:

```sql
INSERT INTO employees (name, salary)
VALUES
('Amit', 60000),
('Raj', 70000),
('Vijay', 45000);
```

**2. UPDATE – Existing Data Modify**

```sql
UPDATE employees
SET salary = 80000
WHERE id = 1;
```

Multiple columns update:

```sql
UPDATE employees
SET salary = 90000,
    name = 'Rahul Sharma'
WHERE id = 1;
```

**3. DELETE – Record Delete**

```sql
DELETE FROM employees
WHERE id = 1;
```

All records delete:

```sql
DELETE FROM employees;
```

**4. SELECT – Data Fetch**

```sql
SELECT * FROM employees;
```

Specific columns:

```sql
SELECT name, salary
FROM employees;
```

With conditions:

```sql
SELECT *
FROM employees
WHERE salary > 50000;
```

With sorting:

```sql
SELECT *
FROM employees
ORDER BY salary DESC;
```

---

# 6. TRUNCATE – Special Command

TRUNCATE ko DDL mein classify kiya jata hai. Ye table ke saare records remove karta hai, lekin table structure delete nahi karta.

**1. Remove all records**

```sql
TRUNCATE TABLE employees;
```

**2. Remove records and reset auto-increment identity**

```sql
TRUNCATE TABLE employees
RESTART IDENTITY;
```

**3. Truncate with related tables**

```sql
TRUNCATE TABLE employees
CASCADE;
```

`CASCADE` related tables ko bhi truncate kar sakta hai. Iska use carefully karna chahiye.

---

# 7. Additional Important SQL Operations

Ye commands bhi developer interviews mein useful hain.

| Operation     | Command             | Purpose              |
| ------------- | ------------------- | -------------------- |
| Create Index  | CREATE INDEX        | Searching faster     |
| Delete Index  | DROP INDEX          | Index remove         |
| Create View   | CREATE VIEW         | Virtual table create |
| Delete View   | DROP VIEW           | View remove          |
| Rename View   | ALTER VIEW RENAME   | View rename          |
| Create Schema | CREATE SCHEMA       | New schema create    |
| Delete Schema | DROP SCHEMA         | Schema delete        |
| Rename Schema | ALTER SCHEMA RENAME | Schema rename        |

Examples:

```sql
-- Create Index
CREATE INDEX idx_employee_name
ON employees(name);

-- Delete Index
DROP INDEX idx_employee_name;

-- Create View
CREATE VIEW employee_view AS
SELECT name, salary
FROM employees;

-- Delete View
DROP VIEW employee_view;

-- Create Schema
CREATE SCHEMA company;

-- Rename Schema
ALTER SCHEMA company
RENAME TO company_data;

-- Delete Schema
DROP SCHEMA company_data;
```

---

# 8. Complete Interview Revision Table

Is table ko save kar lena. Ye tumhara SQL command cheat sheet hai.

| Level      | Operation       | Command                |
| ---------- | --------------- | ---------------------- |
| Database   | Create          | CREATE DATABASE        |
| Database   | Delete          | DROP DATABASE          |
| Database   | Rename          | ALTER DATABASE RENAME  |
| Database   | Change Owner    | ALTER DATABASE OWNER   |
| Database   | Change Settings | ALTER DATABASE SET     |
| Table      | Create          | CREATE TABLE           |
| Table      | Delete          | DROP TABLE             |
| Table      | Rename          | ALTER TABLE RENAME     |
| Table      | Empty           | TRUNCATE TABLE         |
| Table      | Change Owner    | ALTER TABLE OWNER      |
| Table      | Move Schema     | ALTER TABLE SET SCHEMA |
| Column     | Add             | ADD COLUMN             |
| Column     | Delete          | DROP COLUMN            |
| Column     | Rename          | RENAME COLUMN          |
| Column     | Change Type     | ALTER COLUMN TYPE      |
| Column     | Set Default     | SET DEFAULT            |
| Column     | Remove Default  | DROP DEFAULT           |
| Column     | Set NOT NULL    | SET NOT NULL           |
| Column     | Remove NOT NULL | DROP NOT NULL          |
| Constraint | Add             | ADD CONSTRAINT         |
| Constraint | Delete          | DROP CONSTRAINT        |
| Data       | Insert          | INSERT                 |
| Data       | Update          | UPDATE                 |
| Data       | Delete          | DELETE                 |
| Data       | Fetch           | SELECT                 |
| Index      | Create          | CREATE INDEX           |
| Index      | Delete          | DROP INDEX             |

---

# 9. Interview mein ye 5 differences zaroor yaad rakhna

| Question                                    | Answer                               |
| ------------------------------------------- | ------------------------------------ |
| Database ka name kaise change karoge?       | ALTER DATABASE                       |
| Table ka name kaise change karoge?          | ALTER TABLE RENAME                   |
| Column ka name kaise change karoge?         | ALTER TABLE RENAME COLUMN            |
| Column ka datatype kaise change karoge?     | ALTER TABLE ALTER COLUMN TYPE        |
| Column mein default value kaise set karoge? | ALTER TABLE ALTER COLUMN SET DEFAULT |

**Ek important PostgreSQL point:** Database ke andar schemas hote hain, schemas ke andar tables, aur tables ke andar columns aur rows hote hain.

```
Database
└── Schema
    └── Table
        ├── Columns:  id | name  | salary
        └── Rows:     1  | Rahul | 50000
                      2  | Amit  | 60000
```

**Advice:** PostgreSQL mein `ALTER` command ko achhe se practice karo. Iske through tum database, schema, table, column, datatype, constraints, owner aur settings tak modify kar sakte ho.
