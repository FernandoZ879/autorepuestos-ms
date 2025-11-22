const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: 5432,
});

// Función para esperar a la DB
const waitForDB = async () => {
    let retries = 5;
    while (retries) {
        try {
            await pool.query('SELECT NOW()');
            console.log("✅ Database connected!");
            return;
        } catch (err) {
            console.log(`⏳ Waiting for DB... (${retries} left)`);
            retries -= 1;
            await new Promise(res => setTimeout(res, 3000));
        }
    }
    throw new Error("Could not connect to DB");
};

const createTable = async () => {
    await waitForDB();
    // Tabla actualizada para el Excel y el diseño nuevo
    const query = `
        CREATE TABLE IF NOT EXISTS products (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            price DECIMAL(10, 2) NOT NULL,
            stock INTEGER DEFAULT 0,
            sku VARCHAR(50) UNIQUE,
            category VARCHAR(50),
            image_url TEXT
        );
    `;
    await pool.query(query);
    console.log("✅ Products table ready");
};

module.exports = { pool, createTable };
