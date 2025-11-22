const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const createTable = async () => {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS stores (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name TEXT NOT NULL,
                nit TEXT UNIQUE NOT NULL,
                address TEXT,
                phone TEXT
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS stock (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                product_id UUID NOT NULL,
                store_id UUID REFERENCES stores(id),
                quantity INTEGER NOT NULL,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(product_id, store_id)
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS transfers (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                product_id UUID NOT NULL,
                from_store_id UUID REFERENCES stores(id),
                to_store_id UUID REFERENCES stores(id),
                quantity INTEGER NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
    } finally {
        client.release();
    }
};

module.exports = {
    pool,
    createTable,
};
