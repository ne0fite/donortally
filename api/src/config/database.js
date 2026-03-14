require("dotenv").config();

module.exports = {
    development: {
        username: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT ?? "5432", 10),
        dialect: "postgres"
    },
    production: {
        username: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT ?? "5432", 10),
        dialect: "postgres",
        dialectOptions: {
            ssl: { require: true, rejectUnauthorized: false }
        }
    }
};
