const express = require('express');
const cors = require('cors');
const inventoryRoutes = require('./routes');
const { createTable } = require('./db');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/', inventoryRoutes);

const PORT = process.env.PORT || 3002;

const startServer = async () => {
    await createTable();
    app.listen(PORT, () => {
        console.log(`Inventory service is running on port ${PORT}`);
    });
};

startServer();
