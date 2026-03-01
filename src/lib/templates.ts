export interface Template {
  id: string;
  name: string;
  description: string;
  sql: string;
  defaultQuery: string;
}

export const TEMPLATES: Template[] = [
  {
    id: "empty",
    name: "Empty",
    description: "A clean slate with no tables.",
    sql: "",
    defaultQuery: "-- Write your SQL here\n",
  },
  {
    id: "ecommerce",
    name: "E-commerce",
    description: "Customers, orders, and shipping data.",
    sql: `
CREATE TABLE customers (
    cid INT PRIMARY KEY,
    fname VARCHAR(50),
    lname VARCHAR(50),
    age INT,
    country VARCHAR(50)
);

INSERT INTO customers VALUES
    (1, 'John', 'Doe', 31, 'USA'),
    (2, 'Robert', 'Luna', 22, 'USA'),
    (3, 'David', 'Robinson', 22, 'UK'),
    (4, 'John', 'Reinhardt', 25, 'UK'),
    (5, 'Betty', 'Doe', 28, 'UAE'),
    (6, 'Alice', 'Walker', 30, 'Canada');

CREATE TABLE orders (
    oid INT PRIMARY KEY,
    itm VARCHAR(50),
    amt INT,
    cid INT,
    FOREIGN KEY (cid) REFERENCES customers(cid)
);

INSERT INTO orders VALUES
    (1, 'Keyboard', 400, 4),
    (2, 'Mouse', 300, 4),
    (3, 'Monitor', 12000, 3),
    (4, 'Keyboard', 400, 1),
    (5, 'Mousepad', 250, 2),
    (6, 'Laptop', 45000, 1);

CREATE TABLE shippings (
    sid INT PRIMARY KEY,
    oid INT,
    status VARCHAR(50),
    FOREIGN KEY (oid) REFERENCES orders(oid)
);

INSERT INTO shippings VALUES
    (1, 1, 'Pending'),
    (2, 3, 'Delivered'),
    (3, 4, 'Shipped');
`,
    defaultQuery: "SELECT * FROM customers;",
  },
  {
    id: "school",
    name: "School Management",
    description: "Students, courses, and enrollments.",
    sql: `
CREATE TABLE students (
    student_id INT PRIMARY KEY,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    grade_level INT,
    email VARCHAR(100)
);

INSERT INTO students VALUES 
    (1, 'Alice', 'Smith', 10, 'alice@school.edu'),
    (2, 'Bob', 'Johnson', 11, 'bob@school.edu'),
    (3, 'Charlie', 'Brown', 9, 'charlie@school.edu'),
    (4, 'Diana', 'Prince', 12, 'diana@school.edu'),
    (5, 'Ethan', 'Hunt', 10, 'ethan@school.edu');

CREATE TABLE courses (
    course_id INT PRIMARY KEY,
    course_name VARCHAR(100),
    credits INT
);

INSERT INTO courses VALUES 
    (101, 'Introduction to SQL', 3),
    (102, 'Data Structures', 4),
    (103, 'Physics I', 4),
    (104, 'World History', 3);

CREATE TABLE enrollments (
    enrollment_id INT PRIMARY KEY,
    student_id INT,
    course_id INT,
    grade CHAR(1),
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (course_id) REFERENCES courses(course_id)
);

INSERT INTO enrollments VALUES 
    (1, 1, 101, 'A'),
    (2, 1, 102, 'B'),
    (3, 2, 101, 'C'),
    (4, 3, 103, 'A'),
    (5, 4, 104, 'B'),
    (6, 5, 101, 'A');
`,
    defaultQuery: "SELECT * FROM students;",
  },
  {
    id: "employee",
    name: "Employee Directory",
    description: "Departments, employees, and salaries.",
    sql: `
CREATE TABLE departments (
    dept_id INT PRIMARY KEY,
    dept_name VARCHAR(50)
);

INSERT INTO departments VALUES 
    (1, 'Engineering'),
    (2, 'Marketing'),
    (3, 'Human Resources'),
    (4, 'Sales');

CREATE TABLE employees (
    emp_id INT PRIMARY KEY,
    name VARCHAR(100),
    dept_id INT,
    salary INT,
    hire_date DATE,
    FOREIGN KEY (dept_id) REFERENCES departments(dept_id)
);

INSERT INTO employees VALUES 
    (1, 'Bob Jones', 1, 85000, '2022-01-15'),
    (2, 'Sarah Miller', 2, 72000, '2021-06-10'),
    (3, 'Mike Ross', 1, 95000, '2020-03-22'),
    (4, 'Jessica Pearson', 3, 110000, '2015-11-05'),
    (5, 'Louis Litt', 4, 90000, '2018-08-14');
`,
    defaultQuery: "SELECT * FROM employees;",
  },
  {
    id: "social",
    name: "Social Media",
    description: "Users, posts, and comments.",
    sql: `
CREATE TABLE users (
    user_id INT PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    bio TEXT
);

INSERT INTO users VALUES 
    (1, 'coder123', 'Loves SQL and Coffee'),
    (2, 'data_wiz', 'Data Science enthusiast'),
    (3, 'travel_bug', 'Exploring the world one query at a time');

CREATE TABLE posts (
    post_id INT PRIMARY KEY,
    user_id INT,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

INSERT INTO posts VALUES 
    (1, 1, 'My first SQL query worked! PGlite is awesome.'),
    (2, 2, 'Working with relational databases is fun.'),
    (3, 1, 'Anyone else attending the SQL workshop tomorrow?');

CREATE TABLE comments (
    comment_id INT PRIMARY KEY,
    post_id INT,
    user_id INT,
    content TEXT,
    FOREIGN KEY (post_id) REFERENCES posts(post_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

INSERT INTO comments VALUES 
    (1, 1, 2, 'Congrats! SQL is a superpower.'),
    (2, 2, 1, 'Agreed!'),
    (3, 3, 3, 'I will be there!');
`,
    defaultQuery: "SELECT * FROM users;",
  },
];

