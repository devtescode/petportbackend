const express = require('express');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const router = express.Router();
require('dotenv').config();

// Middleware to capture raw body as needed for Paystack signature verification
router.use(bodyParser.raw({ type: 'application/json' }));

router.post('/webhook', (req, res) => {
    console.log('In webhook route');

    // Verify the signature from Paystack
    const signature = req.headers['x-paystack-signature'];
    const rawBody = req.body.toString('utf8');

    if (!rawBody) {
        console.error("Raw body is undefined.");
        return res.status(400).send('Bad Request: Raw body missing');
    }

    const expectedSignature = crypto
        .createHmac('sha512', process.env.API_SECRET)
        .update(rawBody)
        .digest('hex');

    if (signature !== expectedSignature) {
        // console.log('Invalid signature');
        return res.status(403).send('Invalid signature');
    }

    // Parse the event data from Paystack
    const event = JSON.parse(rawBody);
    console.log("Event received:", event);

    if (event && event.event === "charge.success") {
        // Process payment success
        console.log('Payment successful event received');
        const userEmail = event.data.customer.email;
        const amountPaid = event.data.amount / 100; // Convert from kobo to naira
        console.log("User Email:", userEmail, "Amount Paid:", amountPaid);
        // Additional logic to process payment
    } else {
        console.log('Non-successful payment event received');
    }

    // Respond to Paystack to acknowledge the event
    res.status(200).send('Webhook received');
});

module.exports = router;
