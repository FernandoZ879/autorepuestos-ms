const express = require('express');
const cors = require('cors');
const catalogRoutes = require('./routes');
const { createTable } = require('./db');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/', catalogRoutes);

const PORT = process.env.PORT || 3001;

const startServer = async () => {
    await createTable();
    app.listen(PORT, () => {
        console.log(`Catalog service is running on port ${PORT}`);
    });
};

startServer();
