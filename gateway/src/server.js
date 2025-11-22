const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');

const app = express();

// Enable CORS
app.use(cors());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Proxy middleware options
const options = {
    target: 'http://localhost:3000', // target host
    changeOrigin: true, // needed for virtual hosted sites
    ws: true, // proxy websockets
};

// Create proxy middleware
const authProxy = createProxyMiddleware({
    target: process.env.AUTH_URL || 'http://auth:3000',
    changeOrigin: true,
    pathRewrite: {
        '^/api/auth': '',
    },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`[Auth] Proxied ${req.method} ${req.path} -> ${proxyReq.path}`);
    }
});

const catalogProxy = createProxyMiddleware({
    target: process.env.CATALOG_URL || 'http://catalog:3001',
    changeOrigin: true,
    pathRewrite: {
        '^/api/catalog': '',
    },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`[Catalog] Proxied ${req.method} ${req.path} -> ${proxyReq.path}`);
    }
});

const inventoryProxy = createProxyMiddleware({
    target: process.env.INVENTORY_URL || 'http://inventory:3002',
    changeOrigin: true,
    pathRewrite: {
        '^/api/inventory': '',
    },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`[Inventory] Proxied ${req.method} ${req.path} -> ${proxyReq.path}`);
    }
});

const ordersProxy = createProxyMiddleware({
    target: process.env.ORDERS_URL || 'http://orders:3003',
    changeOrigin: true,
    pathRewrite: {
        '^/api/orders': '',
    },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`[Orders] Proxied ${req.method} ${req.path} -> ${proxyReq.path}`);
    }
});

const reportsProxy = createProxyMiddleware({
    target: process.env.REPORTS_URL || 'http://reports:3004',
    changeOrigin: true,
    pathRewrite: {
        '^/api/reports': '',
    },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`[Reports] Proxied ${req.method} ${req.path} -> ${proxyReq.path}`);
    }
});


// Routes
app.use('/api/auth', authProxy);
app.use('/api/catalog', catalogProxy);
app.use('/api/inventory', inventoryProxy);
app.use('/api/orders', ordersProxy);
app.use('/api/reports', reportsProxy);


const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Gateway is running on port ${PORT}`);
});
