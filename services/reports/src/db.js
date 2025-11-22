const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: 5432,
});

const createTable = async () => {
    // No tables to create for the reports service
};

module.exports = {
    pool,
    createTable,
};
