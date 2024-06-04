const axios = require("axios");
const cheerio = require("cheerio");

// 키워드를 입력받아 해당 키워드로 검색된 페이지의 HTML을 반환하는 함수
const getHTML = async (keyword) => {
    try {
        const url = "https://www.inflearn.com/courses?s=" + encodeURI(keyword);
        return await axios.get(url);
    } catch (error) {
        console.error(error);
    }
};

// HTML에서 코스 정보를 파싱하는 함수
const parseCourses = async (keyword) => {
    const { data } = await getHTML(keyword);
    const $ = cheerio.load(data);
    const courseList = $("article.mantine-n8y7xk"); // 코스 목록을 포함하는 article 태그 선택

    const courses = [];
    courseList.each((idx, element) => {
        const title = $(element).find("p.mantine-Text-root.css-10bh5qj.mantine-169r75g").text().trim();
        const instructor = $(element).find("p.mantine-Text-root.css-1r49xhh.mantine-17j39m6").text().trim();
        const price = $(element).find("p.mantine-Text-root.css-uzjboo.mantine-nu4660").text().trim();
        const rating = $(element).find("div.mantine-Group-root.mantine-ytj1kk svg + p").text().trim();
        const imgSrc = $(element).find("div.mantine-AspectRatio-root.css-2oqlco img").attr('src');

        courses.push({ title, instructor, price, rating, imgSrc });
    });

    console.log(courses);
};

parseCourses("스프링부트");
