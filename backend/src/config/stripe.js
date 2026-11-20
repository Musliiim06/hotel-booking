const Stripe = require('stripe');
const path = require('path');

// Ensure .env is resolved correctly regardless of current working directory
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const apiKey = process.env.STRIPE_SECRET_KEY;

if (!apiKey) {
    console.warn('⚠️ [Stripe Config Warning]: STRIPE_SECRET_KEY is missing or empty in .env.');
}

// Fallback to a placeholder string if key is missing to avoid crashing Node process on startup
const stripe = new Stripe(apiKey || 'sk_test_missing_stripe_secret_key');

module.exports = stripe;

