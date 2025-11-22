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
    app.listen(PORT, () => {
        console.log(`Orders service is running on port ${PORT}`);
    });
};

startServer();
