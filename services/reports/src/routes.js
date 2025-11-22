const { Router } = require('express');
const { pool } = require('./db');

const router = Router();

// Sales by store
router.get('/sales-by-store', async (_req, res) => {
    const { rows } = await pool.query(`
        SELECT s.name, SUM(o.total) as total_sales
        FROM orders o
        JOIN stores s ON o.store_id = s.id
        GROUP BY s.name
    `);
    res.json(rows);
});

// Top products
router.get('/top-products', async (_req, res) => {
    const { rows } = await pool.query(`
        SELECT p.name, SUM(oi.quantity) as total_quantity
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        GROUP BY p.name
        ORDER BY total_quantity DESC
        LIMIT 10
    `);
    res.json(rows);
});

// Inventory snapshot
router.get('/inventory-snapshot', async (_req, res) => {
    const { rows } = await pool.query(`
        SELECT p.name as product_name, s.name as store_name, st.quantity
        FROM stock st
        JOIN products p ON st.product_id = p.id
        JOIN stores s ON st.store_id = s.id
    `);
    res.json(rows);
});

module.exports = router;
