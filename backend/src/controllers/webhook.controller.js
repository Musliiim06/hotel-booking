const stripeService = require('../services/stripe.service');
const bookingService = require('../services/booking.service');

/**
 * Handles Stripe webhook events.
 * Note: req.body MUST be raw Buffer here.
 */
async function handleStripeWebhook(req, res, next) {
    const signature = req.headers['stripe-signature'];

    let event;
    try {
        event = stripeService.constructWebhookEvent(req.body, signature);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const completedSession = event.data.object;
                const bookingIds = JSON.parse(completedSession.metadata.booking_ids || '[]');

                const updated = await bookingService.markBookingsCompleted(bookingIds);
                console.log(`[Stripe Webhook] Payment completed. Bookings marked as completed:`, updated.map((b) => b.id));
                break;
            }

            case 'checkout.session.async_payment_succeeded': {
                const asyncSession = event.data.object;
                const bookingIds = JSON.parse(asyncSession.metadata.booking_ids || '[]');
                await bookingService.markBookingsCompleted(bookingIds);
                console.log('[Stripe Webhook] Async payment succeeded for session:', asyncSession.id);
                break;
            }

            case 'checkout.session.async_payment_failed':
            case 'checkout.session.expired': {
                const failedSession = event.data.object;
                const bookingIds = JSON.parse(failedSession.metadata?.booking_ids || '[]');
                if (bookingIds.length > 0) {
                    await bookingService.markBookingsCancelled(bookingIds);
                    console.log(`[Stripe Webhook] Session ${event.type}. Bookings released:`, bookingIds);
                }
                break;
            }

            default:
                console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
        }

        return res.json({ received: true });
    } catch (error) {
        console.error('Error handling webhook event:', error);
        return res.status(500).json({ error: 'Webhook processing failed' });
    }
}

module.exports = {
    handleStripeWebhook
};
