const db = require('../config/db');

/**
 * Find an existing user by email or create a new one.
 * @param {Object} userData - { email, full_name, phone }
 * @returns {Promise<Object>} user record
 */
async function findOrCreateUser(userData) {
    const { email, full_name, phone } = userData;

    if (!full_name || !email || !phone) {
        const error = new Error('Missing required user fields: full_name, email, and phone are required');
        error.statusCode = 400;
        throw error;
    }

    if (!email.includes('@')) {
        const error = new Error('Invalid email format');
        error.statusCode = 400;
        throw error;
    }

    // // Check if user already exists
    // const existing = await db.query(
    //     'SELECT * FROM users WHERE email = $1 LIMIT 1',
    //     [email]
    // );

    // if (existing.rows.length > 0) {
    //     return existing.rows[0];
    // }

    // Insert new user
    const result = await db.query(
        `INSERT INTO users (full_name, email, phone)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [full_name, email, phone]
    );

    return result.rows[0];
}

module.exports = {
    findOrCreateUser
};
