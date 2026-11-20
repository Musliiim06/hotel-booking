const app = require('./app');
const db = require('./config/db');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Graceful shutdown
async function gracefulShutdown(signal) {
    console.log(`Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
        console.log('HTTP server closed.');
        try {
            await db.end();
            console.log('Database connection pool closed.');
            process.exit(0);
        } catch (err) {
            console.error('Error during database teardown:', err);
            process.exit(1);
        }
    });

    // Force shutdown after timeout
    setTimeout(() => {
        console.error('Forceful shutdown after timeout.');
        process.exit(1);
    }, 10000);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
