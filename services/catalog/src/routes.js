const express = require('express');
const router = express.Router();
const { pool } = require('./db');

// GET /products (Con filtros opcionales)
router.get('/products', async (req, res) => {
    try {
        const { category, search } = req.query;
        let query = 'SELECT * FROM products WHERE 1=1';
        const params = [];
        let paramCount = 1;

        if (category) {
            query += ` AND category = $${paramCount}`;
            params.push(category);
            paramCount++;
        }

        if (search) {
            query += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount} OR sku ILIKE $${paramCount})`;
            params.push(`%${search}%`);
            paramCount++;
        }

        // UUIDs aren't sequential, so sorting by ID is useless. Sort by name or created time (if we had it).
        // For now, consistent name sorting is best.
        query += ' ORDER BY name ASC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /products/:id (Obtener un producto específico)
router.get('/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // Postgres driver handles UUID string matching automatically
        const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /products (Crear nuevo producto)
router.post('/products', async (req, res) => {
    // Note: Stock is NOT handled here. It must be handled by the Inventory Service.
    const { name, description, price, sku, category, image_url } = req.body;

    if (!name || !price) {
        return res.status(400).json({ error: 'name y price son requeridos' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO products (name, description, price, sku, category, image_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [name, description, price, sku, category, image_url]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        if (err.code === '23505') { // Unique constraint violation
            res.status(409).json({ error: 'El SKU ya existe' });
        } else {
            res.status(500).json({ error: err.message });
        }
    }
});

// PUT /products/:id (Actualizar producto existente)
router.put('/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, sku, category, image_url } = req.body;

        // Verificar que el producto existe
        const checkResult = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        const result = await pool.query(
            `UPDATE products 
             SET name = $1, description = $2, price = $3, sku = $4, category = $5, image_url = $6
             WHERE id = $7
             RETURNING *`,
            [name, description, price, sku, category, image_url, id]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        if (err.code === '23505') {
            res.status(409).json({ error: 'El SKU ya existe' });
        } else {
            res.status(500).json({ error: err.message });
        }
    }
});

// DELETE /products/:id (Eliminar producto)
router.delete('/products/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.json({ message: 'Producto eliminado correctamente', product: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// --- CATEGORIES ROUTES ---

router.get('/categories', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM categories ORDER BY name ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/categories', async (req, res) => {
    const { name, description } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *',
            [name, description]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            res.status(409).json({ error: 'La categoría ya existe' });
        } else {
            res.status(500).json({ error: err.message });
        }
    }
});

router.delete('/categories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }
        res.json({ message: 'Categoría eliminada' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;