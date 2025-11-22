const express = require('express');
const cors = require('cors');
const orderRoutes = require('./routes');
const { createTable } = require('./db');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/', orderRoutes);

const PORT = process.env.PORT || 3003;

const startServer = async () => {
    await createTable();
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Orders service is running on port ${PORT}`);
    });
};

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

startServer();
