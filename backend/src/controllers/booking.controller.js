const userService = require('../services/user.service');
const bookingService = require('../services/booking.service');
const stripeService = require('../services/stripe.service');

/**
 * POST /api/create-checkout-session
 */
async function createCheckoutSession(req, res, next) {
    try {
        const { user, startDate, endDate, rooms } = req.body;

        if (!user || !startDate || !endDate || !rooms || !Array.isArray(rooms) || rooms.length === 0) {
            return res.status(400).json({ error: 'Missing or invalid required fields (user, startDate, endDate, rooms)' });
        }

        if (new Date(startDate) >= new Date(endDate)) {
            return res.status(400).json({ error: 'Start date must be before end date' });
        }

        // 1. Create or retrieve user
        const dbUser = await userService.findOrCreateUser(user);
        const userId = dbUser.id;

        // 2. Atomically lock & create reservations
        const createdBookings = await bookingService.createBookingsWithLock(userId, startDate, endDate, rooms);

        // 3. Compute total amount
        const totalPrice = createdBookings.reduce((sum, b) => sum + Number(b.total_price), 0);

        // 4. Initialize Stripe Checkout Session
        const session = await stripeService.createCheckoutSession({
            user,
            startDate,
            endDate,
            rooms,
            createdBookings,
            totalPrice
        });

        return res.status(200).json({
            url: session.url,
            createbooking: createdBookings,
            createuser: dbUser
        });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/create-checkout-session/v2 (Direct reservation preview/creation)
 */
async function createBookingDirect(req, res, next) {
    try {
        const { user, startDate, endDate, rooms } = req.body;

        if (!user || !startDate || !endDate || !rooms || !Array.isArray(rooms) || rooms.length === 0) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const dbUser = await userService.findOrCreateUser(user);
        const createdBookings = await bookingService.createBookingsWithLock(dbUser.id, startDate, endDate, rooms);

        return res.status(200).json({ createbooking: createdBookings });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createCheckoutSession,
    createBookingDirect
};
