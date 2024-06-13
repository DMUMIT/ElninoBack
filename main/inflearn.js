const axios = require("axios");
const cheerio = require("cheerio");
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

const pool = mysql.createPool(dbConfig);
const surveyDataPath = path.join(__dirname, '..', 'data', 'surveyData.json');

function ensureDataFileExists() {
  const directory = path.dirname(surveyDataPath);
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
    console.log(`Directory created at: ${directory}`);
  }
  if (!fs.existsSync(surveyDataPath)) {
    fs.writeFileSync(surveyDataPath, JSON.stringify([]));
    console.log(`File created at: ${surveyDataPath}`);
  }
}

ensureDataFileExists(); // 파일 생성 확인

const parseCourses = async (keyword) => {
  try {
    const url = `https://www.inflearn.com/courses?s=${encodeURI(keyword)}`;
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const courses = [];

    $("li.css-8atqhb.mantine-1avyp1d").each((_, element) => {
      const title = $(element).find("p.mantine-Text-root.css-10bh5qj.mantine-169r75g").text().trim();  
      const instructor = $(element).find("p.mantine-Text-root.css-1r49xhh.mantine-17j39m6").text().trim();  
      const price = $(element).find("div.mantine-Group-root.mantine-1n7ftt8 > p.mantine-Text-root.css-uzjboo.mantine-nu4660").text().trim();
      const imgSrc = $(element).find("div.mantine-AspectRatio-root.css-2oqlco img").attr('src');
      const courseUrl = $(element).find("a").attr('href');


      if (title && instructor && price && imgSrc && courseUrl) {
        console.log(`Parsed course: ${title}, ${instructor}, ${price}, ${imgSrc}, ${courseUrl}`);
        courses.push({ title, instructor, price, imgSrc, courseUrl });
      } else {
        console.error(`Incomplete course data: ${title}, ${instructor}, ${price}, ${imgSrc}, ${courseUrl}`);
      }
    });

    return courses;
  } catch (error) {
    console.error('Error scraping Inflearn:', error);
  }
};

const saveCoursesToDB = async (email, courses) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    for (const course of courses) {
      const { title, instructor, price, imgSrc, courseUrl } = course;

      if (!title || !instructor || !price || !imgSrc || !courseUrl) {
        console.error(`Invalid course data: ${JSON.stringify(course)}`);
        continue;
      }

      await connection.execute(
        'INSERT INTO courses (email, title, instructor, price, imgSrc, courseUrl) VALUES (?, ?, ?, ?, ?, ?)',
        [email, title, instructor, price, imgSrc, courseUrl]
      );
    }
    await connection.commit();
    console.log('Courses saved to DB successfully.');
  } catch (error) {
    await connection.rollback();
    console.error('Error saving courses to DB:', error);
  } finally {
    connection.release();
  }
};


const scrapeCoursesForUser = async (email) => {
  try {
    const data = fs.readFileSync(surveyDataPath, 'utf8');
    const surveys = JSON.parse(data);

    const userSurvey = surveys.find(survey => survey.email === email);
    if (!userSurvey) {
      console.log(`No survey data found for email: ${email}`);
      return;
    }

    const technologies = userSurvey.technologies;

    for (const tech of technologies) {
      const courses = await parseCourses(tech);
      if (courses.length > 0) {
        await saveCoursesToDB(email, courses);
        console.log(`Courses scraped and saved for ${tech}: ${courses.length} courses.`);
      } else {
        console.log(`No courses found for ${tech}.`);
      }
    }
  } catch (error) {
    console.error('Error scraping courses from survey data:', error);
  }
};

module.exports = {
  scrapeCoursesForUser
};
