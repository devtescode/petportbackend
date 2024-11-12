// webhookRoutes.js
const express = require('express');
const crypto = require('node:crypto');
const bodyParser = require('body-parser');  // We use this to capture raw body
const Userschema = require('../Models/user.models');

const router = express.Router();

// Use body-parser to capture raw body before express.json middleware
router.use(bodyParser.raw({ type: 'application/json' })); // This captures the raw body

router.post('/webhook', async (req, res) => {
    console.log('In webhook route');

    // Capture raw body from req, this should be a Buffer
    const rawBody = req.body.toString('utf8');
    console.log('Raw body:', rawBody);

    if (!rawBody) {
        console.error("Raw body is undefined.");
        return res.status(400).send('Bad Request: Raw body missing');
    }

    const paystackSignature = req.headers['x-paystack-signature'];
    const hash = crypto.createHmac('sha512', process.env.API_SECRET).update(rawBody).digest('hex');

    console.log("API_SECRET:", process.env.API_SECRET); // Check if API_SECRET is loaded correctly
    console.log("Hash generated:", hash);
    console.log("Paystack signature:", paystackSignature);

    // Compare the calculated hash with Paystack's signature
    if (hash !== paystackSignature) {
        console.log('Invalid hash');
        console.log('Paystack signature:', paystackSignature, 'Hash:', hash);
        return res.status(400).send('Invalid signature');
    }

    const event = req.body;  // Paystack sends JSON body
    if (event && event.event === 'charge.success') {
        // Process payment success...
        console.log('Payment successful event received');
    }

    res.status(200).send('Webhook received');
});

module.exports = router;
