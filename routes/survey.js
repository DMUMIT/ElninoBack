const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { scrapeCoursesForUser } = require('../main/inflearn');
require('dotenv').config();

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

    await scrapeCoursesForUser(surveyData.email);

    res.json({ success: true, message: 'Survey submitted successfully' });
  } catch (err) {
    console.error('Failed to save survey data:', err);
    res.status(500).send('Internal server error');
  }
});

// 현재 로그인한 사용자의 이메일에 해당하는 코스를 가져오는 엔드포인트
router.get('/courses', async (req, res) => {
  try {
    const email = req.query.email;
    const courses = await Course.findAll({ where: { email } });
    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).send('Server Error');
  }
});


module.exports = router;
