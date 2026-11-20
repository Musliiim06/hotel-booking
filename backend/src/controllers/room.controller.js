const roomService = require('../services/room.service');

/**
 * GET /api/available-rooms
 */
async function getAvailableRooms(req, res, next) {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }

        if (new Date(startDate) >= new Date(endDate)) {
            return res.status(400).json({ error: 'Start date must be before end date' });
        }

        const freeRooms = await roomService.findFreeRooms(startDate, endDate);
        return res.status(200).json(freeRooms);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getAvailableRooms
};
