CREATE DATABASE IF NOT EXISTS healthcare;
USE healthcare;

CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS doctors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    department VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO admins (username, password, full_name)
VALUES
    ('healthcareadmin', 'HealthCare@2026', 'System Administrator')
ON DUPLICATE KEY UPDATE password = VALUES(password), full_name = VALUES(full_name);

INSERT INTO doctors (username, password, full_name, department)
VALUES
    ('dr_supriya', 'doc123', 'Dr. Supriya Shinde', 'Cardiology'),
    ('dr_rohit', 'doc123', 'Dr. Rohit Sharma', 'Neurology'),
    ('dr_priya', 'doc123', 'Dr. Priya Deshmukh', 'Dermatology')
ON DUPLICATE KEY UPDATE password = VALUES(password), full_name = VALUES(full_name), department = VALUES(department);

INSERT INTO users (username, password, full_name)
VALUES
    ('rahul', 'patient123', 'Rahul Sharma'),
    ('priya', 'patient123', 'Priya Singh'),
    ('amit', 'patient123', 'Amit Verma')
ON DUPLICATE KEY UPDATE password = VALUES(password), full_name = VALUES(full_name);

SELECT 'Database initialized successfully' AS status;
