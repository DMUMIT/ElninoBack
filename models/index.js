const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
});

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.User = require('./User')(sequelize, DataTypes);

module.exports = db;
