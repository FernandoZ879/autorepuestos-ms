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

        query += ' ORDER BY id DESC';

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
    const { name, description, price, stock, sku, category, image_url } = req.body;

    if (!name || !price) {
        return res.status(400).json({ error: 'name y price son requeridos' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO products (name, description, price, stock, sku, category, image_url) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [name, description, price, stock || 0, sku, category, image_url]
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
        const { name, description, price, stock, sku, category, image_url } = req.body;

        // Verificar que el producto existe
        const checkResult = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        const result = await pool.query(
            `UPDATE products 
             SET name = $1, description = $2, price = $3, stock = $4, sku = $5, category = $6, image_url = $7
             WHERE id = $8
             RETURNING *`,
            [name, description, price, stock || 0, sku, category, image_url, id]
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

// PATCH /products/:id/stock (Actualizar solo el stock)
router.patch('/products/:id/stock', async (req, res) => {
    try {
        const { id } = req.params;
        const { stock } = req.body;

        if (stock === undefined || stock === null) {
            return res.status(400).json({ error: 'stock es requerido' });
        }

        const result = await pool.query(
            'UPDATE products SET stock = $1 WHERE id = $2 RETURNING *',
            [stock, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

