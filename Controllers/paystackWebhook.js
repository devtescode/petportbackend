const express = require('express');
const crypto = require('crypto');
const router = express.Router();
require('dotenv').config();

// Middleware to capture raw body for signature verification


router.post('/webhook', (req, res) => {
    console.log('Webhook endpoint hit working.');

    // Retrieve the Paystack signature from headers
    const signature = req.headers['x-paystack-signature'];

    if (!signature) {
        console.error('Missing Paystack signature header.');
        return res.status(400).send('Bad Request: Missing signature header');
    }

    // Access the raw body stored by the middleware
    const rawBody = req.rawBody;
    if (!rawBody) {
        console.error('Raw body is undefined or empty.');
        return res.status(400).send('Bad Request: Raw body missing');
    }

    try {
        // Generate the expected signature
        const expectedSignature = crypto
            .createHmac('sha512', process.env.API_SECRET)
            .update(rawBody)
            .digest('hex');

        // Validate the signature
        if (signature !== expectedSignature) {
            console.error('Invalid signature received.');
            return res.status(403).send('Forbidden: Invalid signature');
        }

        // Parse the raw body to extract event data
        const event = JSON.parse(rawBody.toString('utf8'));
        console.log('Event received:', event);

        // Handle specific Paystack events
        if (event.event === 'charge.success') {
            console.log('Payment successful event received.');
            const userEmail = event.data.customer.email;
            const amountPaid = event.data.amount / 100; // Convert kobo to naira
            console.log(`User Email: ${userEmail}, Amount Paid: ₦${amountPaid}`);

            // Add business logic for successful payment here
        } else {
            console.log(`Non-successful payment event received: ${event.event}`);
        }

        // Respond to Paystack to acknowledge the event
        res.status(200).send('Webhook received');
    } catch (error) {
        console.error('Error parsing event data:', error.message);
        return res.status(400).send('Bad Request: Invalid JSON payload');
    }
});

module.exports = router;
