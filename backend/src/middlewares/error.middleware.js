/**
 * Centralized error-handling middleware for Express.
 */
function errorHandler(err, req, res, next) {
    console.error(`[Error] ${req.method} ${req.url}:`, err.message || err);

    const statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
}

/**
 * 404 Not Found middleware.
 */
function notFoundHandler(req, res) {
    res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

module.exports = {
    errorHandler,
    notFoundHandler
};
