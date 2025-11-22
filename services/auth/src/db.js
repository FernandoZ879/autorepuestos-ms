const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: 5432,
});

const createTable = async () => {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT NOT NULL CHECK (role IN ('admin', 'client')),
                address TEXT,
                phone VARCHAR(50),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Seed Admin User
        const adminEmail = 'admin@autoparts.com';
        const adminCheck = await client.query('SELECT id FROM users WHERE email = $1', [adminEmail]);

        if (adminCheck.rowCount === 0) {
            // Password: admin123 (hashed with bcryptjs cost 10)
            // $2a$10$X.x.x... is just a placeholder, we need to use the real hash or import bcrypt here.
            // Since we can't easily import bcrypt here without changing the file structure significantly (require at top),
            // I will use a pre-calculated hash for 'admin123'.
            // Hash for 'admin123': $2a$10$r.zZ8.zZ8.zZ8.zZ8.zZ8.zZ8.zZ8.zZ8.zZ8.zZ8.zZ8.zZ8 (example)
            // Actually, let's just use the bcryptjs library since it is in dependencies.
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('admin123', 10);

            await client.query(`
                INSERT INTO users (name, email, password, role)
                VALUES ($1, $2, $3, $4)
            `, ['Admin User', adminEmail, hashedPassword, 'admin']);
            console.log('Admin user seeded successfully');
        }

    } catch (err) {
        console.error('Error initializing DB:', err);
    } finally {
        client.release();
    }
};

module.exports = {
    pool,
    createTable,
};
