const express = require('express');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const router = express.Router();
require('dotenv').config();

// Middleware to capture raw body for Paystack signature verification
router.use(bodyParser.raw({ type: 'application/json' }));

router.post('/webhook', (req, res) => {
    console.log('In webhook route');

    // Verify the signature from Paystack
    const signature = req.headers['x-paystack-signature'];

    if (!signature) {
        console.error("Missing Paystack signature header");
        return res.status(400).send('Bad Request: Missing signature header');
    }

    const rawBody = req.body.toString('utf8');
    if (!rawBody) {
        console.error("Raw body is undefined or empty");
        return res.status(400).send('Bad Request: Raw body missing');
    }

    const expectedSignature = crypto
        .createHmac('sha512', process.env.API_SECRET)
        .update(rawBody)
        .digest('hex');

    if (signature !== expectedSignature) {
        console.error('Invalid signature');
        return res.status(403).send('Invalid signature');
    }

    try {
        // Parse the event data from Paystack
        const event = JSON.parse(rawBody);
        console.log("Event received:", event);

        if (event && event.event === "charge.success") {
            // Process payment success
            console.log('Payment successful event received');
            const userEmail = event.data.customer.email;
            const amountPaid = event.data.amount / 100; // Convert from kobo to naira
            console.log("User Email:", userEmail, "Amount Paid:", amountPaid);
            // Add your business logic for successful payment here
        } else {
            console.log('Non-successful payment event received');
        }
    } catch (error) {
        console.error("Error parsing event data:", error);
        return res.status(400).send('Bad Request: Invalid JSON payload');
    }

    // Respond to Paystack to acknowledge the event
    res.status(200).send('Webhook received');
});

module.exports = router;
