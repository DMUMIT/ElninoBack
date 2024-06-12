const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const router = express.Router();

// MySQL 데이터베이스 연결 설정
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

const pool = mysql.createPool(dbConfig);

// 회원가입
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const connection = await pool.getConnection();
        console.log('DB Connection established for registration');

        const [result] = await connection.execute(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username, email, hashedPassword]
        );
        console.log('User registered:', result);

        connection.release();
        res.status(201).send({ success: true, message: 'User created successfully' });
    } catch (error) {
        console.log('Error during registration:', error);
        res.status(500).send({ success: false, message: 'Error creating the user' });
    }
});

// 로그인
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log('Login attempt:', email);
    try {
        const connection = await pool.getConnection();
        console.log('DB Connection established for login');

        const [users] = await connection.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        connection.release();

        if (users.length === 0) {
            console.log('User not found for email:', email);
            return res.status(404).send({ success: false, message: 'User not found' });
        }

        const user = users[0];
        console.log('User found:', user);

        const isMatch = await bcrypt.compare(password, user.password);
        console.log('Password match status:', isMatch);

        if (!isMatch) {
            console.log('Invalid credentials for email:', email);
            return res.status(400).send({ success: false, message: 'Invalid credentials' });
        }

        console.log('Login successful for email:', email);
        res.send({ success: true, message: 'Login successful' });
    } catch (error) {
        console.error('Server error during login:', error);
        res.status(500).send({ success: false, message: 'Server error' });
    }
});

module.exports = router;
