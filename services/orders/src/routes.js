const { Router } = require('express');
const { pool } = require('./db');
const fetch = require('node-fetch');

const router = Router();

// Add to cart
router.post('/cart', async (req, res) => {
    const { productId, quantity } = req.body;
    res.json({ productId, quantity });
});

// Get cart
router.get('/cart', async (req, res) => {
    res.json([]);
});

// Create Order (Checkout)
router.post('/', async (req, res) => {
    const { user_id, items } = req.body; // Client sends user_id and items

    if (!user_id || !items || items.length === 0) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        let total = 0;
        const processedItems = [];

        // 1. Validate Items & Check Stock
        for (const item of items) {
            const pid = item.product_id;
            const qty = item.quantity;

            // Fetch Product Details (Catalog)
            const catRes = await fetch(`http://catalog:3002/products/${pid}`);
            if (!catRes.ok) throw new Error(`Product ${pid} not found in catalog`);
            const product = await catRes.json();
            
            // Fetch Stock (Inventory)
            const invRes = await fetch(`http://inventory:3004/stock?productId=${pid}`);
            if (!invRes.ok) throw new Error(`Could not check stock for ${product.name}`);
            const stocks = await invRes.json();
            
            // Find a store with enough stock
            const validStock = stocks.find(s => s.quantity >= qty);
            if (!validStock) throw new Error(`Insufficient stock for ${product.name}`);
            
            total += parseFloat(product.price) * qty;
            processedItems.push({
                product_id: pid,
                quantity: qty,
                price: product.price,
                store_id: validStock.store_id // Assigning the store that fulfills the order
            });
        }

        // 2. Create Order
        // We just pick the store of the first item as the "primary" store for the order record, 
        // or null if mixed. For simplicity, let's say null or the first one.
        const mainStoreId = processedItems[0].store_id; 

        const { rows } = await client.query(
            'INSERT INTO orders (user_id, store_id, status, total) VALUES ($1, $2, $3, $4) RETURNING id',
            [user_id, mainStoreId, 'PENDING', total]
        );
        const orderId = rows[0].id;

        // 3. Insert Items & Reduce Stock
        for (const item of processedItems) {
            await client.query(
                'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
                [orderId, item.product_id, item.quantity, item.price]
            );

            // Reduce Stock in Inventory
            const reduceRes = await fetch(`http://inventory:3004/stock/reduce`, {
                method: 'PATCH',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    productId: item.product_id,
                    storeId: item.store_id,
                    quantity: item.quantity
                })
            });
            
            if(!reduceRes.ok) {
                throw new Error(`Failed to reduce stock for item ${item.product_id}`);
            }
        }

        await client.query('COMMIT');
        res.status(201).json({ id: orderId, status: 'PENDING', total });

    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Order creation error:', e);
        res.status(400).json({ error: e.message });
    } finally {
        client.release();
    }
});

// Get all orders
router.get('/', async (_req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
        res.json(rows);
    } catch(e) {
        res.status(500).json({error: e.message});
    }
});

// Get order by id
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        const order = rows[0];
        const itemsResult = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [id]);
        order.items = itemsResult.rows;
        res.json(order);
    } catch(e) {
        res.status(500).json({error: e.message});
    }
});

module.exports = router;