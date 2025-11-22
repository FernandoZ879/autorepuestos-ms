
const { Router } = require('express');
const { pool } = require('./db');
const fetch = require('node-fetch');

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

// Create Order (Checkout)
router.post('/', async (req, res) => {
    const { userId, storeId, items } = req.body;

    if (!userId || !items || items.length === 0) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('Received order request', { userId, storeId, itemsLength: items.length });
    const client = await pool.connect();
    console.log('Connected to DB');
    try {
        await client.query('BEGIN');
        console.log('Transaction started');
        let total = 0;

        // Verify stock and calculate total
        for (const item of items) {
            // Fetch product details from catalog service
            // Note: Using 'catalog' hostname since this runs inside docker network
            // But wait, if the user runs this locally, 'catalog' won't resolve.
            // The previous error "port already allocated" suggests the user might be running things locally too.
            // However, the architecture is Docker. The gateway is at 'gateway:3000' or 'localhost:3000' from outside.
            // Inside the network, 'catalog:3002' is the direct service.
            // The gateway is also reachable at 'gateway:3000'.
            // Let's try using the direct service URL 'http://catalog:3002/products/...' to avoid gateway overhead/issues inside the network.
            // OR keep using localhost if we assume host networking or mapped ports? 
            // Docker compose uses service names. 'http://catalog:3002' is safest for inter-service communication.

            const productRes = await fetch(`http://catalog:3002/products/${item.productId}`);
            if (!productRes.ok) {
                throw new Error(`Failed to fetch product ${item.productId}`);
            }
            const product = await productRes.json();
            const availableStock = product.stock || 0;
            if (availableStock < item.quantity) {
                throw new Error(`Insufficient stock for product ${product.name || item.productId}`);
            }
            // Use price from product if not provided, or trust client? 
            // Better to trust product price from DB.
            const price = product.price ?? item.price ?? 0;
            total += price * item.quantity;

            // Store product data for later stock update
            item._product = product;
            item._finalPrice = price;
        }

        console.log('Calculated total:', total);
        const { rows } = await client.query(
            'INSERT INTO orders (user_id, store_id, status, total) VALUES ($1, $2, $3, $4) RETURNING id',
            [userId, storeId || null, 'PENDING', total]
        );
        const orderId = rows[0].id;
        console.log('Order created:', orderId);

        // Insert order items and decrement stock
        for (const item of items) {
            await client.query(
                'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
                [orderId, item.productId || item.id, item.quantity, item._finalPrice]
            );

            // Decrement stock via catalog PATCH endpoint
            // We can use the PATCH /products/:id/stock endpoint we created earlier
            const newStock = (item._product.stock || 0) - item.quantity;

            const updateRes = await fetch(`http://catalog:3002/products/${item.productId}/stock`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stock: newStock })
            });

            if (!updateRes.ok) {
                console.error(`Failed to update stock for product ${item.productId}`);
                // We should probably throw here to rollback the transaction
                throw new Error(`Failed to update stock for product ${item.productId}`);
            }
        }
        console.log('Items inserted and stock updated');

        await client.query('COMMIT');
        console.log('Transaction committed');
        res.status(201).json({ id: orderId, status: 'PENDING', total });
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Order creation error:', e);
        res.status(400).json({ ok: false, error: String(e) });
    } finally {
        client.release();
    }
});

// Get all orders
router.get('/', async (_req, res) => {
    const { rows } = await pool.query('SELECT * FROM orders');
    res.json(rows);
});

// Get order by id
router.get('/:id', async (req, res) => {
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
