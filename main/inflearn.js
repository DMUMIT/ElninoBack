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

    $("article.card").each((_, element) => {
      const title = $(element).find("p.mantine-Text-root.css-10bh5qj.mantine-169r75g").text().trim();
      const instructor = $(element).find("p.mantine-Text-root.css-1r49xhh.mantine-17j39m6").text().trim();
      const price = $(element).find("p.mantine-Text-root.css-uzjboo.mantine-nu4660").text().trim();
      const imgSrc = $(element).find("div.mantine-AspectRatio-root.css-2oqlco img").attr('src');

      console.log(`Parsed course: ${title}, ${instructor}, ${price}, ${imgSrc}`); 

    //   courses.push({ title, instructor, price, imgSrc });
    // });
    if (title && instructor && price && imgSrc) {
      console.log(`Parsed course: ${title}, ${instructor}, ${price}, ${imgSrc}`);
      courses.push({ title, instructor, price, imgSrc });
    } else {
      console.error(`Incomplete course data: ${title}, ${instructor}, ${price}, ${imgSrc}`);
    }
  });

    return courses;
  } catch (error) {
    console.error('Error scraping Inflearn:', error);
  }
};

// const saveCoursesToDB = async (courses) => {
//   const connection = await pool.getConnection();
//   try {
//     await connection.beginTransaction();
//     for (const course of courses) {
//       const { title, instructor, price, imgSrc } = course;
//       await connection.execute(
//         'INSERT INTO courses (title, instructor, price, imgSrc) VALUES (?, ?, ?, ?)',
//         [title, instructor, price, imgSrc]
//       );
//     }
//     await connection.commit();
//   } catch (error) {
//     await connection.rollback();
//     console.error('Error saving courses to DB:', error);
//   } finally {
//     connection.release();
//   }
// };
const saveCoursesToDB = async (email, courses) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    for (const course of courses) {
      const { title, instructor, price, imgSrc } = course;

      if (!title || !instructor || !price || !imgSrc) {
        console.error(`Invalid course data: ${JSON.stringify(course)}`);
        continue;
      }

      await connection.execute(
        'INSERT INTO courses (email, title, instructor, price, imgSrc) VALUES (?, ?, ?, ?, ?)',
        [email, title, instructor, price, imgSrc]
      );
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    console.error('Error saving courses to DB:', error);
  } finally {
    connection.release();
  }
};

// const scrapeCoursesFromSurvey = async () => {
//   try {
//     const data = fs.readFileSync(surveyDataPath, 'utf8');
//     const surveys = JSON.parse(data);
//     const allTechnologies = surveys.flatMap(survey => 
//       survey.responses && survey.responses.technologies ? survey.responses.technologies : []
//     );

//     const uniqueTechnologies = [...new Set(allTechnologies)]; // 중복 제거

//     for (const tech of uniqueTechnologies) {
//       const courses = await parseCourses(tech);
//       if (courses.length > 0) {
//         await saveCoursesToDB(courses);
//         console.log(`Courses scraped and saved for ${tech}: ${courses.length} courses.`);
//       } else {
//         console.log(`No courses found for ${tech}.`);
//       }
//     }
//   } catch (error) {
//     console.error('Error scraping courses from survey data:', error);
//   }
// };
const scrapeCoursesFromSurvey = async () => {
  try {
    const data = fs.readFileSync(surveyDataPath, 'utf8');
    const surveys = JSON.parse(data);

    for (const survey of surveys) {
      const email = survey.email;
      const technologies = survey.technologies;

      for (const tech of technologies) {
        const courses = await parseCourses(tech);
        if (courses.length > 0) {
          await saveCoursesToDB(email, courses);
          console.log(`Courses scraped and saved for ${tech}: ${courses.length} courses.`);
        } else {
          console.log(`No courses found for ${tech}.`);
        }
      }
    }
  } catch (error) {
    console.error('Error scraping courses from survey data:', error);
  }
};

// 설문조사 기술 기반 스크래핑 실행
scrapeCoursesFromSurvey();

module.exports = {
  scrapeCoursesFromSurvey
};
