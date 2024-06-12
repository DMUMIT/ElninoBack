const express = require('express');
const mysql = require('mysql2/promise');
const router = express.Router();

// MySQL 데이터베이스 연결 설정
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  };

const pool = mysql.createPool(dbConfig);

// router.get('/courses', async (req, res) => {
//     try {
//         const connection = await pool.getConnection();
//         const [rows] = await connection.execute('SELECT * FROM courses');
//         connection.release();
//         res.json(rows);
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Error fetching courses');
//     }
// });
router.get('/courses', async (req, res) => {
    const { email } = req.query;
    if (!email) {
        return res.status(400).send('Email is required');
    }
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.execute('SELECT * FROM courses WHERE email = ?', [email]);
        connection.release();
        res.json(rows);
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).send('Error fetching courses');
    }
});

module.exports = router;
