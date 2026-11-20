const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const webhookRoutes = require('./routes/webhook.routes');
const apiRoutes = require('./routes/index');
const { errorHandler, notFoundHandler } = require('./middlewares/error.middleware');

const app = express();

// 1. CORS Configuration
const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(cors({
    origin: allowedOrigin,
    credentials: true
}));
 
// 2. Stripe Webhook (MUST be declared BEFORE express.json() to preserve raw Buffer)
app.use('/webhook', webhookRoutes);

// 3. Body Parsing Middleware for standard API requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Health Check Endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 5. Main API Routes
app.use('/api', apiRoutes);

// 6. 404 & Error Handling Middlewares
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
