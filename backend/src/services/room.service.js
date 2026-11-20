const db = require('../config/db');

/**
 * Find available rooms for a given date range.
 * @param {string} startDate
 * @param {string} endDate
 * @returns {Promise<Array>}
 */
async function findFreeRooms(startDate, endDate) {
    const query = `
        SELECT 
            r.title, 
            r.room_type, 
            r.price_per_night, 
            r.capacity, 
            COUNT(*) AS available_count
        FROM rooms r
        WHERE r.is_active = TRUE
          AND NOT EXISTS (
              SELECT 1
              FROM bookings b
              WHERE b.room_id = r.id
                AND b.check_in < $2
                AND b.check_out > $1
                AND b.status <> 'cancelled'
          )
        GROUP BY r.title, r.room_type, r.price_per_night, r.capacity
        ORDER BY r.price_per_night ASC
    `;

    const result = await db.query(query, [startDate, endDate]);
    return result.rows;
}

module.exports = {
    findFreeRooms
};
