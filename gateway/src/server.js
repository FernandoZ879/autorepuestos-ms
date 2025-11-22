const http = require('http');
const httpProxy = require('http-proxy');

const proxy = httpProxy.createProxyServer({});

// Error handling
proxy.on('error', (err, req, res) => {
    console.error('Proxy error:', err);
    if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Bad Gateway', details: err.message }));
    }
});

const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
        return;
    }

    // Routing
    if (req.url.startsWith('/catalog')) {
        req.url = req.url.replace(/^\/catalog/, '');
        proxy.web(req, res, { target: 'http://catalog:3002' });
    } else if (req.url.startsWith('/auth')) {
        req.url = req.url.replace(/^\/auth/, '');
        proxy.web(req, res, { target: 'http://auth:3001' });
    } else if (req.url.startsWith('/inventory')) {
        req.url = req.url.replace(/^\/inventory/, '');
        proxy.web(req, res, { target: 'http://inventory:3004' });
    } else if (req.url.startsWith('/orders')) {
        req.url = req.url.replace(/^\/orders/, '');
        proxy.web(req, res, { target: 'http://orders:3003' });
    } else if (req.url.startsWith('/reports')) {
        req.url = req.url.replace(/^\/reports/, '');
        proxy.web(req, res, { target: 'http://reports:3005' });
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not Found' }));
    }
});

const PORT = process.env.PORT || 3010;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Gateway running on port ${PORT}`);
});

