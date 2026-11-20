const { Pool } = require('pg');
const path = require('path');

// Ensure .env is resolved correctly regardless of current working directory
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'hotel',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432
});

pool.connect()
    .then((client) => {
        console.log('Connected to the PostgreSQL database');
        client.release();
    })
    .catch((err) => {
        console.error('Error connecting to the PostgreSQL database:', err.message);
    });

module.exports = pool;
