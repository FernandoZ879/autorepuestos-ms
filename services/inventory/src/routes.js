const { Router } = require('express');
const { pool } = require('./db');

const router = Router();

// Get all stores
router.get('/stores', async (_req, res) => {
    const { rows } = await pool.query('SELECT * FROM stores');
    res.json(rows);
});

// Create store
router.post('/stores', async (req, res) => {
    const { name, nit, address, phone } = req.body;
    const { rows } = await pool.query(
        'INSERT INTO stores (name, nit, address, phone) VALUES ($1, $2, $3, $4) RETURNING id',
        [name, nit, address, phone]
    );
    res.status(201).json({ id: rows[0].id });
});

// Get stock
router.get('/stock', async (req, res) => {
    const { productId, storeId } = req.query;
    let query = `
        SELECT s.*, st.name as store_name 
        FROM stock s
        JOIN stores st ON s.store_id = st.id
    `;
    const params = [];

    if (productId || storeId) {
        query += ' WHERE';
        if (productId) {
            query += ' s.product_id = $1';
            params.push(productId);
        }
        if (storeId) {
            query += params.length > 0 ? ' AND' : '';
            query += ` s.store_id = $${params.length + 1}`;
            params.push(storeId);
        }
    }

    const { rows } = await pool.query(query, params);
    res.json(rows);
});

// Create/update stock
router.post('/stock', async (req, res) => {
    const { productId, storeId, quantity } = req.body;
    const { rows } = await pool.query(
        `INSERT INTO stock (product_id, store_id, quantity) VALUES ($1, $2, $3)
         ON CONFLICT (product_id, store_id) DO UPDATE SET quantity = $3
         RETURNING id`,
        [productId, storeId, quantity]
    );
    res.status(201).json({ id: rows[0].id });
});

// Transfer stock
router.post('/transfers', async (req, res) => {
    const { productId, fromStoreId, toStoreId, quantity } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        // Decrease stock from source store
        await client.query(
            'UPDATE stock SET quantity = quantity - $1 WHERE product_id = $2 AND store_id = $3',
            [quantity, productId, fromStoreId]
        );
        // Increase stock in destination store
        await client.query(
            'UPDATE stock SET quantity = quantity + $1 WHERE product_id = $2 AND store_id = $3',
            [quantity, productId, toStoreId]
        );
        // Record transfer
        await client.query(
            'INSERT INTO transfers (product_id, from_store_id, to_store_id, quantity) VALUES ($1, $2, $3, $4)',
            [productId, fromStoreId, toStoreId, quantity]
        );
        await client.query('COMMIT');
        res.status(201).json({ ok: true });
    } catch (e) {
        await client.query('ROLLBACK');
        res.status(400).json({ ok: false, error: String(e) });
    } finally {
        client.release();
    }
});

// Import stores
router.post('/import/stores', async (req, res) => {
    const items = req.body.items || [];
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        for (const i of items) {
            await client.query(
                `INSERT INTO stores (name, nit, address, phone)
                 VALUES ($1, $2, $3, $4) ON CONFLICT (nit) DO UPDATE SET
                 name=EXCLUDED.name, address=EXCLUDED.address, phone=EXCLUDED.phone`,
                [i.name, i.nit, i.address, i.phone]
            );
        }
        await client.query('COMMIT');
        res.json({ ok: true, count: items.length });
    } catch (e) {
        await client.query('ROLLBACK');
        res.status(400).json({ ok: false, error: String(e) });
    } finally {
        client.release();
    }
});

// Import stock
router.post('/import/stock', async (req, res) => {
    const items = req.body.items || [];
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        for (const i of items) {
            // Find product and store ids
            const productResult = await client.query('SELECT id FROM products WHERE slug = $1', [i.productSlug]);
            const storeResult = await client.query('SELECT id FROM stores WHERE nit = $1', [i.storeNit]);

            if (productResult.rows.length > 0 && storeResult.rows.length > 0) {
                const productId = productResult.rows[0].id;
                const storeId = storeResult.rows[0].id;

                await client.query(
                    `INSERT INTO stock (product_id, store_id, quantity)
                     VALUES ($1, $2, $3) ON CONFLICT (product_id, store_id) DO UPDATE SET
                     quantity=EXCLUDED.quantity`,
                    [productId, storeId, i.quantity]
                );
            }
        }
        await client.query('COMMIT');
        res.json({ ok: true, count: items.length });
    } catch (e) {
        await client.query('ROLLBACK');
        res.status(400).json({ ok: false, error: String(e) });
    } finally {
        client.release();
    }
});


module.exports = router;
