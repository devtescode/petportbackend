const express = require('express');
const crypto = require('crypto');
const router = express.Router();
require('dotenv').config(); // Load .env variables

// Load Paystack secret key
const PAYSTACK_SECRET = process.env.API_SECRET;

router.post('/webhook', (req, res) => {
    try {
        // Validate event using raw body and signature
        const rawBody = req.rawBody; // Captured by middleware in index.js
        const signature = req.headers['x-paystack-signature']; // Paystack's signature header

        if (!signature || !rawBody) {
            console.error("Bad Request: Missing raw body or signature");
            return res.status(400).json({ error: 'Missing raw body or signature' });
        }

        // Compute the HMAC hash using Paystack secret
        const hash = crypto.createHmac('sha512', PAYSTACK_SECRET).update(rawBody).digest('hex');

        if (hash === signature) {
            // Signature is valid
            const event = JSON.parse(rawBody.toString('utf8')); // Parse raw body as JSON
            console.log('Valid webhook event received:', event);

            // Handle specific Paystack events
            switch (event.event) {
                case 'charge.success':
                    const email = event.data.customer.email;
                    const amount = event.data.amount / 100; // Convert kobo to naira
                    console.log(`Payment successful for ${email}, Amount: ₦${amount}`);
                    // Add your business logic here, e.g., update the database
                    break;

                // Add handlers for other Paystack events as needed
                default:
                    console.log(`Unhandled event type: ${event.event}`);
            }

            return res.status(200).json({ message: 'Webhook processed successfully' });
        } else {
            // Signature does not match
            console.error('Invalid signature detected');
            return res.status(403).json({ error: 'Invalid signature' });
        }
    } catch (error) {
        console.error('Error processing webhook:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
