const express = require('express');
const cors = require('cors');
const reportRoutes = require('./routes');
const { createTable } = require('./db');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/', reportRoutes);

const PORT = process.env.PORT || 3004;

const startServer = async () => {
    await createTable();
    app.listen(PORT, () => {
        console.log(`Reports service is running on port ${PORT}`);
    });
};

startServer();
