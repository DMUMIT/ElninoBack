const axios = require("axios");
const cheerio = require("cheerio");
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const express = require('express');
const router = express.Router();
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

const pool = mysql.createPool(dbConfig);
const surveyDataPath = path.join(__dirname, '..', 'data', 'surveyData.json'); // 데이터 파일 경로 설정

// 설문조사 데이터 확인
router.get('/checkSurvey', async (req, res) => {
  const { email } = req.query;
  try {
    const data = fs.readFileSync(surveyDataPath, 'utf8');
    const surveys = JSON.parse(data);
    const existingSurvey = surveys.find(survey => survey.email === email);
    if (existingSurvey) {
      res.json({ exists: true, survey: existingSurvey });
    } else {
      res.json({ exists: false });
    }
  } catch (err) {
    console.error('Failed to read or process survey data:', err);
    res.status(500).send('Internal server error');
  }
});

// 설문조사 데이터 제출
// router.post('/submit', async (req, res) => {
//   const surveyData = req.body;
//   try {
//     let data = fs.readFileSync(surveyDataPath, 'utf8');
//     let surveys = JSON.parse(data);

//     const existingSurveyIndex = surveys.findIndex(survey => survey.email === surveyData.email);
//     if (existingSurveyIndex !== -1) {
//       surveys[existingSurveyIndex] = surveyData;
//     } else {
//       surveys.push(surveyData);
//     }

//     fs.writeFileSync(surveyDataPath, JSON.stringify(surveys, null, 2));
//     console.log('Survey data saved:', surveyData);

//     res.json({ success: true, message: 'Survey submitted successfully' });
//   } catch (err) {
//     console.error('Failed to save survey data:', err);
//     res.status(500).send('Internal server error');
//   }
// });
router.post('/submit', async (req, res) => {
  const surveyData = req.body;
  try {
    let data = fs.readFileSync(surveyDataPath, 'utf8');
    let surveys = JSON.parse(data);

    const existingSurveyIndex = surveys.findIndex(survey => survey.email === surveyData.email);
    if (existingSurveyIndex !== -1) {
      surveys[existingSurveyIndex] = surveyData;
    } else {
      surveys.push(surveyData);
    }

    fs.writeFileSync(surveyDataPath, JSON.stringify(surveys, null, 2));
    console.log('Survey data saved:', surveyData);

    await scrapeCoursesFromSurvey(); // 설문조사 제출 후 스크래핑 실행

    res.json({ success: true, message: 'Survey submitted successfully' });
  } catch (err) {
    console.error('Failed to save survey data:', err);
    res.status(500).send('Internal server error');
  }
});

module.exports = router;
