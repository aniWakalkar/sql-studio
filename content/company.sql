-- =========================================
-- DATABASE: company
-- Tables (10 rows each):
--   countries, states, cities, departments, levels,
--   employees, projects, addresses, devices
--
-- addresses -> cities -> states -> countries
-- =========================================

DROP TABLE IF EXISTS devices;
DROP TABLE IF EXISTS addresses;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS levels;
DROP TABLE IF EXISTS departments;
DROP TABLE IF EXISTS cities;
DROP TABLE IF EXISTS states;
DROP TABLE IF EXISTS countries;

CREATE TABLE countries (
    country_id    INTEGER PRIMARY KEY,
    country_name  VARCHAR(50) NOT NULL UNIQUE,
    country_code  CHAR(2) NOT NULL UNIQUE,
    continent     VARCHAR(20)
);

CREATE TABLE states (
    state_id    INTEGER PRIMARY KEY,
    state_name  VARCHAR(50) NOT NULL,
    country_id  INTEGER NOT NULL,
    FOREIGN KEY (country_id) REFERENCES countries(country_id)
);

CREATE TABLE cities (
    city_id    INTEGER PRIMARY KEY,
    city_name  VARCHAR(50) NOT NULL,
    state_id   INTEGER NOT NULL,
    FOREIGN KEY (state_id) REFERENCES states(state_id)
);

CREATE TABLE departments (
    dept_id    INTEGER PRIMARY KEY,
    dept_name  VARCHAR(50) NOT NULL UNIQUE,
    location   VARCHAR(50)
);

CREATE TABLE levels (
    level_id    INTEGER PRIMARY KEY,
    level_name  VARCHAR(30) NOT NULL UNIQUE,
    min_salary  DECIMAL(10,2),
    max_salary  DECIMAL(10,2)
);

CREATE TABLE employees (
    emp_id      INTEGER PRIMARY KEY,
    name        VARCHAR(50) NOT NULL,
    gender      CHAR(1) CHECK (gender IN ('M', 'F')),
    salary      DECIMAL(10,2),
    dept_id     INTEGER,
    level_id    INTEGER,
    manager_id  INTEGER,
    hire_date   DATE,
    email       VARCHAR(100),
    FOREIGN KEY (dept_id)    REFERENCES departments(dept_id),
    FOREIGN KEY (level_id)   REFERENCES levels(level_id),
    FOREIGN KEY (manager_id) REFERENCES employees(emp_id)
);

CREATE TABLE projects (
    project_id    INTEGER PRIMARY KEY,
    project_name  VARCHAR(100) NOT NULL,
    dept_id       INTEGER,
    budget        DECIMAL(12,2),
    start_date    DATE,
    end_date      DATE,
    FOREIGN KEY (dept_id) REFERENCES departments(dept_id)
);

CREATE TABLE addresses (
    address_id    INTEGER PRIMARY KEY,
    emp_id        INTEGER NOT NULL,
    address_type  VARCHAR(20) CHECK (address_type IN ('Current', 'Permanent')),
    street        VARCHAR(100),
    city_id       INTEGER NOT NULL,
    pincode       VARCHAR(10),
    FOREIGN KEY (emp_id)  REFERENCES employees(emp_id),
    FOREIGN KEY (city_id) REFERENCES cities(city_id)
);

CREATE TABLE devices (
    device_id      INTEGER PRIMARY KEY,
    device_type    VARCHAR(20) NOT NULL,
    brand          VARCHAR(30),
    serial_no      VARCHAR(20) UNIQUE,
    emp_id         INTEGER,            -- NULL = device is not assigned to anyone
    assigned_date  DATE,
    FOREIGN KEY (emp_id) REFERENCES employees(emp_id)
);

INSERT INTO countries (country_id, country_name, country_code, continent) VALUES
(1,  'India',          'IN', 'Asia'),
(2,  'United States',  'US', 'North America'),
(3,  'United Kingdom', 'GB', 'Europe'),
(4,  'Germany',        'DE', 'Europe'),
(5,  'Canada',         'CA', 'North America'),
(6,  'Japan',          'JP', 'Asia'),          -- countries 6-10 have no states
(7,  'Australia',      'AU', 'Oceania'),
(8,  'UAE',            'AE', 'Asia'),
(9,  'Singapore',      'SG', 'Asia'),
(10, 'France',         'FR', 'Europe');

INSERT INTO states (state_id, state_name, country_id) VALUES
(1,  'Maharashtra', 1),
(2,  'Delhi',       1),
(3,  'Gujarat',     1),
(4,  'West Bengal', 1),
(5,  'Karnataka',   1),
(6,  'California',  2),
(7,  'Texas',       2),
(8,  'England',     3),
(9,  'Bavaria',     4),
(10, 'Ontario',     5);   -- has no cities

INSERT INTO cities (city_id, city_name, state_id) VALUES
(1,  'Pune',          1),
(2,  'Mumbai',        1),   -- Maharashtra has 2 cities
(3,  'New Delhi',     2),
(4,  'Ahmedabad',     3),
(5,  'Kolkata',       4),
(6,  'Bangalore',     5),
(7,  'San Francisco', 6),
(8,  'Austin',        7),
(9,  'London',        8),
(10, 'Munich',        9);

INSERT INTO departments (dept_id, dept_name, location) VALUES
(10,  'HR',         'Mumbai'),
(20,  'IT',         'Pune'),
(30,  'Sales',      'Delhi'),
(40,  'Finance',    'Mumbai'),
(50,  'Marketing',  'Bangalore'),   -- departments 50-100 have NO employees
(60,  'Operations', 'Hyderabad'),
(70,  'Legal',      'Chennai'),
(80,  'Support',    'Pune'),
(90,  'R&D',        'Bangalore'),
(100, 'Admin',      'Delhi');

INSERT INTO levels (level_id, level_name, min_salary, max_salary) VALUES
(1,  'Intern',         10000,  29999),
(2,  'Junior',         30000,  49999),
(3,  'Associate',      50000,  64999),
(4,  'Senior',         65000,  79999),
(5,  'Lead',           80000,  99999),
(6,  'Manager',        100000, 149999),   -- levels 1 and 6-10 have nobody yet
(7,  'Senior Manager', 150000, 199999),
(8,  'Director',       200000, 299999),
(9,  'Vice President', 300000, 499999),
(10, 'CEO',            500000, 1000000);

INSERT INTO employees (emp_id, name, gender, salary, dept_id, level_id, manager_id, hire_date, email) VALUES
(1,  'Rahul Sharma', 'M', 90000, 20,   5, NULL, '2018-03-15', 'rahul@company.com'),
(2,  'Priya Patel',  'F', 75000, 20,   4, 1,    '2019-07-01', 'priya@company.com'),
(3,  'Amit Kumar',   'M', 60000, 30,   3, 1,    '2020-01-10', 'amit@company.com'),
(4,  'Sneha Joshi',  'F', 75000, 10,   4, 1,    '2019-11-20', NULL),
(5,  'Vikram Singh', 'M', 50000, 30,   3, 3,    '2021-05-05', 'vikram@company.com'),
(6,  'Anjali Mehta', 'F', 85000, 40,   5, 1,    '2018-09-12', 'anjali@company.com'),
(7,  'Rohan Das',    'M', 45000, 20,   2, 2,    '2022-02-28', 'rohan@company.com'),
(8,  'Kavya Nair',   'F', 60000, 30,   3, 3,    '2021-08-16', 'kavya@company.com'),
(9,  'Amit Kumar',   'M', 55000, 40,   3, 6,    '2023-01-09', 'amit.k@company.com'),  -- duplicate name
(10, 'Neha Gupta',   'F', 40000, NULL, 2, NULL, '2024-04-01', NULL);                 -- no department

INSERT INTO projects (project_id, project_name, dept_id, budget, start_date, end_date) VALUES
(1,  'Website Revamp',   20,   500000, '2024-01-01', '2024-06-30'),
(2,  'Mobile App',       20,   800000, '2024-03-15', NULL),
(3,  'Sales Campaign',   30,   200000, '2024-02-01', '2024-04-30'),
(4,  'Payroll System',   40,   300000, '2023-10-01', '2024-02-28'),
(5,  'Hiring Drive',     10,   100000, '2024-05-01', NULL),
(6,  'AI Chatbot',       NULL, 650000, '2024-07-01', NULL),          -- no department assigned
(7,  'Data Warehouse',   20,   900000, '2023-06-01', '2024-03-31'),
(8,  'Brand Launch',     50,   400000, '2024-08-01', NULL),
(9,  'Legal Compliance', 70,   150000, '2024-04-15', '2024-09-30'),
(10, 'Customer Portal',  80,   350000, '2024-09-01', NULL);

INSERT INTO addresses (address_id, emp_id, address_type, street, city_id, pincode) VALUES
(1,  1, 'Current',   '12 MG Road',          1, '411001'),
(2,  2, 'Current',   '45 FC Road',          1, '411004'),
(3,  2, 'Permanent', '8 CG Road',           4, '380009'),   -- Priya has 2 addresses
(4,  3, 'Current',   '22 Connaught Place',  3, '110001'),
(5,  4, 'Current',   '5 Marine Drive',      2, '400002'),
(6,  5, 'Current',   '17 Karol Bagh',       3, '110005'),
(7,  6, 'Current',   '9 Bandra West',       2, '400050'),
(8,  6, 'Permanent', '221B Baker Street',   9, 'NW16XE'),   -- Anjali's permanent home is in London
(9,  7, 'Current',   '30 Koregaon Park',    1, '411001'),
(10, 8, 'Current',   '14 Indiranagar',      6, '560038');
-- employees 9 and 10 have no address on record

INSERT INTO devices (device_id, device_type, brand, serial_no, emp_id, assigned_date) VALUES
(1,  'Laptop',  'Dell',    'DL-1001', 1,    '2018-03-15'),
(2,  'Mobile',  'Apple',   'AP-2001', 1,    '2020-06-01'),
(3,  'Laptop',  'HP',      'HP-1002', 2,    '2019-07-01'),
(4,  'Laptop',  'Lenovo',  'LN-1003', 3,    '2020-01-10'),
(5,  'Monitor', 'Samsung', 'SM-3001', 2,    '2021-02-15'),
(6,  'Laptop',  'Dell',    'DL-1004', 6,    '2018-09-12'),
(7,  'Mobile',  'Samsung', 'SM-2002', 5,    '2021-05-05'),
(8,  'Laptop',  'Apple',   'AP-1005', 7,    '2022-02-28'),
(9,  'Laptop',  'HP',      'HP-1006', NULL, NULL),          -- spare, not assigned
(10, 'Monitor', 'Dell',    'DL-3002', NULL, NULL);          -- spare, not assigned
