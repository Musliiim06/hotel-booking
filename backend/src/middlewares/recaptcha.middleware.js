/**
 * Middleware to verify Google reCAPTCHA v3 token.
 */
async function verifyRecaptcha(req, res, next) {
    try {
        const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY || process.env.reCAPTCHA_SECRET_KEY;
        
        // If recaptcha secret is not set in development, bypass or warn
        if (!recaptchaSecret) {
            return next();
        }

        const { recaptchaToken } = req.body;
        if (!recaptchaToken) {
            return res.status(403).json({ error: 'reCAPTCHA token is required' });
        }

        const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                secret: recaptchaSecret,
                response: recaptchaToken
            })
        });

        const data = await response.json();
        if (!data.success || data.score < 0.5 || data.action !== 'create-checkout-session') {
            return res.status(403).json({ error: 'reCAPTCHA verification failed' });
        }

        next();
    } catch (error) {
        console.error('Error verifying reCAPTCHA:', error);
        next(error);
    }
}

module.exports = {
    verifyRecaptcha
};
