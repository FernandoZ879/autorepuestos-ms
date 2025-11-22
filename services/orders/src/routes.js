const { Router } = require('express');
const { pool } = require('./db');

const router = Router();

// Add to cart
router.post('/cart', async (req, res) => {
    // This is a simplified implementation. A real cart would be associated with a user session.
    const { productId, quantity } = req.body;
    res.json({ productId, quantity });
});

// Get cart
router.get('/cart', async (req, res) => {
    // This is a simplified implementation. A real cart would be associated with a user session.
    res.json([]);
});

// Checkout
router.post('/checkout', async (req, res) => {
    const { userId, storeId, items } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        let total = 0;
        for (const item of items) {
            const productResult = await client.query('SELECT price FROM products WHERE id = $1', [item.productId]);
            if (productResult.rows.length > 0) {
                total += productResult.rows[0].price * item.quantity;
            }
        }

        const { rows } = await client.query(
            'INSERT INTO orders (user_id, store_id, status, total) VALUES ($1, $2, $3, $4) RETURNING id',
            [userId, storeId, 'PENDING', total]
        );
        const orderId = rows[0].id;

        for (const item of items) {
            const productResult = await client.query('SELECT price FROM products WHERE id = $1', [item.productId]);
            if (productResult.rows.length > 0) {
                await client.query(
                    'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
                    [orderId, item.productId, item.quantity, productResult.rows[0].price]
                );
            }
        }

        await client.query('COMMIT');
        res.status(201).json({ id: orderId });
    } catch (e) {
        await client.query('ROLLBACK');
        res.status(400).json({ ok: false, error: String(e) });
    } finally {
        client.release();
    }
});

// Get all orders
router.get('/orders', async (_req, res) => {
    const { rows } = await pool.query('SELECT * FROM orders');
    res.json(rows);
});

// Get order by id
router.get('/orders/:id', async (req, res) => {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (rows.length === 0) {
        return res.status(404).json({ error: 'Order not found' });
    }
    const order = rows[0];
    const itemsResult = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [id]);
    order.items = itemsResult.rows;
    res.json(order);
});

module.exports = router;
