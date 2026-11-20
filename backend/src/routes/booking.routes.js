const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const { verifyRecaptcha } = require('../middlewares/recaptcha.middleware');

// POST /api/create-checkout-session
router.post('/create-checkout-session', verifyRecaptcha, bookingController.createCheckoutSession);

// POST /api/create-checkout-session/v2
router.post('/create-checkout-session/v2', bookingController.createBookingDirect);

module.exports = router;
