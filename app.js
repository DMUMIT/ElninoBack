require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const cors = require('cors');

const userRoutes = require('./routes/users');
const surveyRoutes = require('./survey');
const { sequelize } = require('./models'); // Sequelize 인스턴스 가져오기

const app = express();
const port = process.env.PORT || 8080;

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/survey', surveyRoutes);
app.use('/users', userRoutes);

app.get('/', (req, res) => {
    res.send('Welcome to the home page!');
});

// Sequelize를 사용하여 데이터베이스를 동기화하고 서버를 시작합니다.
sequelize.sync()
    .then(() => {
        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });
