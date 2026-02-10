-- -- Droping the Database for Clean New Start
DROP DATABASE IF EXISTS settleup;

-- Creating the Main Database
CREATE DATABASE settleup;

-- Selecting the new created Database
USE settleup;

-- Table for Users
CREATE TABLE users 
(
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL 
);

-- Table for Groups (enclosed in backticks because 'groups' can be a reserved word)
CREATE TABLE `groups` 
(
    group_id INT AUTO_INCREMENT PRIMARY KEY,
    group_name VARCHAR(100) NOT NULL,
    created_by INT NOT NULL,
    FOREIGN KEY (created_by) REFERENCES users(user_id)
);

-- Table to link Users to Groups (Many-to-Many relationship)
CREATE TABLE group_members 
(
    group_id INT,
    user_id INT,
    PRIMARY KEY (group_id, user_id),
    FOREIGN KEY (group_id) REFERENCES `groups`(group_id), 
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Table for Expenses
CREATE TABLE expenses 
(
    expense_id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT, 
    paid_by INT NOT NULL,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES `groups`(group_id), 
    FOREIGN KEY (paid_by) REFERENCES users(user_id)
);

-- Table for splitting the expense amounts (Who will pay Whom)
CREATE TABLE transaction_splits 
(
    split_id INT AUTO_INCREMENT PRIMARY KEY,
    expense_id INT NOT NULL,
    owed_by INT NOT NULL,
    share_amount DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (expense_id) REFERENCES expenses(expense_id),
    FOREIGN KEY (owed_by) REFERENCES users(user_id)
);
