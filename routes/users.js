const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const router = express.Router();

const userRoutes = require('./users'); 

// MySQL 데이터베이스 연결 설정
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'tiger',
  database: 'myapp'
};

const pool = mysql.createPool(dbConfig);

router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const connection = await pool.getConnection();
        console.log('DB Connection established');

        const [result] = await connection.execute(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username, email, hashedPassword]
        );
        console.log('User registered:', result);

        connection.release();
        res.status(201).send('User created successfully');
    } catch (error) {
        console.log(error);
        res.status(500).send('Error creating the user');
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const connection = await pool.getConnection();
        console.log('DB Connection established');

        const [users] = await connection.execute(
            'SELECT password FROM users WHERE email = ?',
            [email]
        );
        connection.release();

        if (users.length === 0) {
            return res.status(404).send('User not found');
        }

        const isMatch = await bcrypt.compare(password, users[0].password);
        if (!isMatch) {
            return res.status(400).send('Invalid credentials');
        }
        res.send('Login successful');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

module.exports = router;
