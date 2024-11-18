const express = require('express');
const crypto = require('crypto');
const router = express.Router();
require('dotenv').config();

// Middleware to capture raw body for Paystack signature verification
router.use(
    express.raw({
        type: 'application/json',
        verify: (req, res, buf) => {
            req.rawBody = buf; // Store the raw body for verification
        },
    })
);

router.post('/webhook', (req, res) => {
    console.log('Webhook endpoint hit.');

    // Verify the signature from Paystack
    const signature = req.headers['x-paystack-signature'];

    if (!signature) {
        console.error('Missing Paystack signature header.');
        return res.status(400).send('Bad Request: Missing signature header');
    }

    const rawBody = req.rawBody;
    if (!rawBody) {
        console.error('Raw body is undefined or empty.');
        return res.status(400).send('Bad Request: Raw body missing');
    }

    // Generate the expected signature
    const expectedSignature = crypto
        .createHmac('sha512', process.env.API_SECRET)
        .update(rawBody)
        .digest('hex');

    if (signature !== expectedSignature) {
        console.error('Invalid signature received.');
        return res.status(403).send('Forbidden: Invalid signature');
    }

    try {
        // Parse the event data from Paystack
        const event = JSON.parse(rawBody.toString('utf8'));
        console.log('Event received:', event);

        if (event.event === 'charge.success') {
            // Process payment success
            console.log('Payment successful event received.');
            const userEmail = event.data.customer.email;
            const amountPaid = event.data.amount / 100; // Convert from kobo to naira
            console.log(`User Email: ${userEmail}, Amount Paid: ${amountPaid}`);
            
            // Add your business logic for successful payment here
        } else {
            console.log('Non-successful payment event received:', event.event);
        }
    } catch (error) {
        console.error('Error parsing event data:', error.message);
        return res.status(400).send('Bad Request: Invalid JSON payload');
    }

    // Respond to Paystack to acknowledge the event
    res.status(200).send('Webhook received');
});

module.exports = router;
