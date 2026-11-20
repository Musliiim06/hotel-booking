const db = require('../config/db');

/**
 * Creates bookings for the selected rooms with pessimistic row locking.
 * @param {number|string} userId
 * @param {string} startDate
 * @param {string} endDate
 * @param {Array<{room_type: string, quantity: number}>} rooms
 * @returns {Promise<Array>} created bookings
 */
async function createBookingsWithLock(userId, startDate, endDate, rooms) {
    const client = await db.connect();

    try {
        await client.query('BEGIN');

        const createdBookings = [];

        for (const selected of rooms) {
            const quantity = Number(selected.quantity);

            if (!Number.isInteger(quantity) || quantity < 1) {
                const error = new Error(`Invalid room quantity for ${selected.room_type}`);
                error.statusCode = 400;
                throw error;
            }

            // Lock available rooms using FOR UPDATE SKIP LOCKED
            const result = await client.query(
                `SELECT *
                 FROM rooms r
                 WHERE r.is_active = TRUE
                   AND r.room_type = $1
                   AND NOT EXISTS (
                       SELECT 1
                       FROM bookings b
                       WHERE b.room_id = r.id
                         AND b.check_in < $3
                         AND b.check_out > $2
                         AND b.status <> 'cancelled'
                   )
                 ORDER BY r.id
                 LIMIT $4
                 FOR UPDATE SKIP LOCKED`,
                [selected.room_type, startDate, endDate, quantity]
            );

            if (result.rows.length < quantity) {
                const error = new Error(`Not enough available rooms for type: ${selected.room_type}`);
                error.statusCode = 409;
                throw error;
            }

            // Calculate duration in days
            const days = Math.round((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
            if (days < 1) {
                const error = new Error('Booking duration must be at least 1 day');
                error.statusCode = 400;
                throw error;
            }

            for (const room of result.rows) {
                const totalPrice = (Number(room.price_per_night) * days).toFixed(2);

                const bookingResult = await client.query(
                    `INSERT INTO bookings
                        (room_id, user_id, check_in, check_out, total_price, status)
                     VALUES ($1, $2, $3, $4, $5, 'pending')
                     RETURNING id, user_id, room_id, check_in, check_out, total_price, status`,
                    [room.id, userId, startDate, endDate, totalPrice]
                );

                createdBookings.push(bookingResult.rows[0]);
            }
        }

        await client.query('COMMIT');
        return createdBookings;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Updates status of bookings to 'completed' after successful payment.
 * @param {Array<number>} bookingIds
 * @returns {Promise<Array>}
 */
async function markBookingsCompleted(bookingIds) {
    if (!bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0) {
        return [];
    }

    const client = await db.connect();
    const updatedBookings = [];

    try {
        await client.query('BEGIN');

        for (const bookingId of bookingIds) {
            const result = await client.query(
                `UPDATE bookings
                 SET status = 'completed'
                 WHERE id = $1
                 RETURNING *`,
                [bookingId]
            );
            if (result.rows.length > 0) {
                updatedBookings.push(result.rows[0]);
            }
        }

        await client.query('COMMIT');
        return updatedBookings;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Cancels bookings if session expired or payment failed.
 * @param {Array<number>} bookingIds
 * @returns {Promise<Array>}
 */
async function markBookingsCancelled(bookingIds) {
    if (!bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0) {
        return [];
    }

    const client = await db.connect();
    try {
        await client.query('BEGIN');
        for (const bookingId of bookingIds) {
            await client.query(
                `UPDATE bookings
                 SET status = 'cancelled'
                 WHERE id = $1 AND status = 'pending'`,
                [bookingId]
            );
        }
        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

module.exports = {
    createBookingsWithLock,
    markBookingsCompleted,
    markBookingsCancelled
};
