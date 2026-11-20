const stripe = require('../config/stripe');

/**
 * Creates a Stripe Checkout Session for the bookings.
 * @param {Object} params
 * @param {Object} params.user
 * @param {string} params.startDate
 * @param {string} params.endDate
 * @param {Array} params.rooms
 * @param {Array} params.createdBookings
 * @param {number} params.totalPrice
 * @returns {Promise<Stripe.Checkout.Session>}
 */
async function createCheckoutSession({ user, startDate, endDate, rooms, createdBookings, totalPrice }) {
    const bookingIds = createdBookings.map((b) => b.id);
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    const session = await stripe.checkout.sessions.create({
        line_items: [
            {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: `Hotel Booking (${startDate} to ${endDate})`,
                        description: `Reservation for ${rooms.map((r) => `${r.quantity}x ${r.room_type}`).join(', ')}`
                    },
                    unit_amount: Math.round(totalPrice * 100) // Stripe expects amounts in cents
                },
                quantity: 1
            }
        ],
        expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiration
        mode: 'payment',
        success_url: `${clientUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${clientUrl}/cancel`,
        metadata: {
            user: JSON.stringify(user),
            startDate,
            endDate,
            rooms: JSON.stringify(rooms),
            booking_ids: JSON.stringify(bookingIds)
        }
    });

    return session;
}

/**
 * Validates and constructs Stripe webhook event from raw request.
 * @param {Buffer} rawBody
 * @param {string} signature
 * @returns {Stripe.Event}
 */
function constructWebhookEvent(rawBody, signature) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
        throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }
    return stripe.webhooks.constructEvent(rawBody, signature, secret);
}

module.exports = {
    createCheckoutSession,
    constructWebhookEvent
};
