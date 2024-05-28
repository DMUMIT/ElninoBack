const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const User = require('./models/User');  // User 모델을 불러옵니다.

const app = express();
const port = 3000;
const bcrypt = require('bcrypt');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// MongoDB 연결 설정
mongoose.connect('mongodb://localhost:27017/myapp');

app.post('/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // 비밀번호 암호화
        const hashedPassword = await bcrypt.hash(password, 10);

        // 새 유저 생성 및 저장
        const newUser = new User({
            username,
            email,
            password: hashedPassword
        });

        await newUser.save();

        res.status(201).send('User created successfully');
    } catch (error) {
        console.log(error);
        res.status(500).send('Error creating the user');
    }
});

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 데이터베이스에서 사용자 찾기
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(404).send('User not found');
        }

        // 비밀번호 확인
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).send('Invalid credentials');
        }

        res.send('Login successful');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
