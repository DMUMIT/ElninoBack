const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const dataPath = path.join(__dirname, 'data', 'surveyData.json');

// Ensure the data directory exists
if (!fs.existsSync(path.dirname(dataPath))) {
  fs.mkdirSync(path.dirname(dataPath), { recursive: true });
}

// Ensure the data file exists
if (!fs.existsSync(dataPath)) {
  fs.writeFileSync(dataPath, '[]', 'utf8');
}

// Handle survey data submission
router.post('/submit', (req, res) => {
  const surveyData = req.body.responses;
  console.log('Received survey data:', surveyData); // 로그 추가

  fs.readFile(dataPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading data file:', err);
      return res.status(500).send('Internal server error');
    }

    let surveys;
    try {
      surveys = JSON.parse(data);
    } catch (e) {
      surveys = [];
    }

    surveys.push(surveyData);

    fs.writeFile(dataPath, JSON.stringify(surveys, null, 2), 'utf8', (err) => {
      if (err) {
        console.error('Error writing to data file:', err);
        return res.status(500).send('Internal server error');
      }
      res.status(201).send('Survey data saved successfully');
    });
  });
});

// Handle fetching all survey data
router.get('/data', (req, res) => {
  fs.readFile(dataPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading data file:', err);
      return res.status(500).send('Internal server error');
    }
    res.status(200).json(JSON.parse(data));
  });
});

module.exports = router;
