const { Router } = require('express');
const { pool } = require('./db');

const router = Router();

// Get all products
router.get('/products', async (_req, res) => {
    const { rows } = await pool.query('SELECT id, name, slug, description, price, image_url AS "imageUrl", category_id AS "categoryId" FROM products');
    res.json(rows);
});

// Get product by id
router.get('/products/:id', async (req, res) => {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT id, name, slug, description, price, image_url AS "imageUrl", category_id AS "categoryId" FROM products WHERE id = $1', [id]);
    if (rows.length === 0) {
        return res.status(404).json({ error: 'Product not found' });
    }
    res.json(rows[0]);
});

// Create product
router.post('/products', async (req, res) => {
    const { name, slug, description, price, imageUrl, categoryId } = req.body;
    const { rows } = await pool.query(
        'INSERT INTO products (name, slug, description, price, image_url, category_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        [name, slug, description, price, imageUrl, categoryId]
    );
    res.status(201).json({ id: rows[0].id });
});

// Delete product
router.delete('/products/:id', async (req, res) => {
    const { id } = req.params;
    await pool.query('DELETE FROM products WHERE id = $1', [id]);
    res.status(204).send();
});

// Get all categories
router.get('/categories', async (_req, res) => {
    const { rows } = await pool.query('SELECT * FROM categories');
    res.json(rows);
});

// Import products
router.post('/import/products', async (req, res) => {
    const items = req.body.items || [];
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        for (const i of items) {
            // Find category id by name
            let categoryId;
            const categoryResult = await client.query('SELECT id FROM categories WHERE name = $1', [i.categoryName]);
            if (categoryResult.rows.length > 0) {
                categoryId = categoryResult.rows[0].id;
            } else {
                // Create category if it doesn't exist
                const newCategoryResult = await client.query('INSERT INTO categories (name) VALUES ($1) RETURNING id', [i.categoryName]);
                categoryId = newCategoryResult.rows[0].id;
            }

            await client.query(
                `INSERT INTO products (name, slug, description, price, image_url, category_id)
                 VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (slug) DO UPDATE SET
                 description=EXCLUDED.description, price=EXCLUDED.price, image_url=EXCLUDED.image_url, category_id=EXCLUDED.category_id`,
                [i.name, i.slug, i.description, i.price, i.imageUrl, categoryId]
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

module.exports = router;
