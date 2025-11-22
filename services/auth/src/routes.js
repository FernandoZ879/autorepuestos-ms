const { Router } = require('express');
const { pool } = require('./db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const router = Router();

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const user = rows[0];

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role, name: user.name, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                address: user.address,
                phone: user.phone
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Register
router.post('/register', async (req, res) => {
    const { firstName, lastName, name, email, password, role, address, phone } = req.body;

    // Handle name: prefer 'name' if sent, otherwise combine firstName + lastName
    const fullName = name || `${firstName || ''} ${lastName || ''}`.trim();

    if (!fullName || !email || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const userRole = role || 'client'; // Default to client

        const { rows } = await pool.query(
            'INSERT INTO users (name, email, password, role, address, phone) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, role',
            [fullName, email, hashedPassword, userRole, address, phone]
        );

        res.status(201).json(rows[0]);
    } catch (error) {
        console.error('Register error:', error);
        if (error.code === '23505') { // Unique violation
            return res.status(400).json({ error: 'Email already exists' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user profile
router.get('/me', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { rows } = await pool.query('SELECT id, name, email, role FROM users WHERE id = $1', [decoded.id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(rows[0]);
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

// Get all users (For Admin)
router.get('/users', async (req, res) => {
    try {
        // In a real app, we should verify admin privileges here
        const { rows } = await pool.query('SELECT id, name, email, role, address, phone, created_at FROM users ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
