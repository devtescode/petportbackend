// webhookRoutes.js
const express = require('express');
const crypto = require('node:crypto');
const bodyParser = require('body-parser');
const Userschema = require('../Models/user.models');
const router = express.Router();
const env = require('dotenv')
env.config()
router.use(bodyParser.raw({ type: 'application/json' }));

router.post('/webhook', async (req, res) => {
    console.log('In webhook routing');
    const paystackSignature = req.headers['x-paystack-signature'];
    const rawBody = req.body;  // Keep as Buffer

    // Log API_SECRET to ensure it’s being loaded correctly
    console.log("API_SECRET:", process.env.API_SECRET);

    // Compute hash directly from the raw body (Buffer format)
    const hash = crypto.createHmac('sha512', process.env.API_SECRET).update(rawBody).digest('hex');

    // Logging details for debugging
    console.log("Paystack signature:", paystackSignature);
    console.log("Hash generated:", hash);

    // Compare the calculated hash with Paystack's signature
    if (hash !== paystackSignature) {
        console.log('Invalid hash');
        return res.status(400).send('Invalid signature');
    }

    // Parse the raw body to JSON if signature matches
    const event = JSON.parse(rawBody.toString('utf8'));  // Only parse if verified
    if (event && event.event === 'charge.success') {
        // Process payment success
        console.log('Payment successful event received');
    }

    res.status(200).send('Webhook received');
});

module.exports = router;
