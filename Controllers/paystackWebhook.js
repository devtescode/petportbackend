// webhookRoutes.js
const express = require('express');
const crypto = require('node:crypto');
const Userschema = require('../Models/user.models'); 

const app = express();
const router = express.Router();

// Middleware to capture raw body
app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf.toString('utf8');
    }
}));

router.post('/webhook', async (req, res) => {
    console.log('In webhook route');
    console.log('Raw body:', req.rawBody);

    const paystackSignature = req.headers['x-paystack-signature'];
    const rawBody = req.rawBody;
    const hash = crypto.createHmac('sha512', process.env.API_SECRET).update(rawBody).digest('hex');

    if (!rawBody) {
      console.error("Raw body is undefined.");
      return res.status(400).send('Bad Request: Raw body missing');
    }
    console.log("API_SECRET:", process.env.API_SECRET); // Check if API_SECRET is loaded correctly
    console.log("Hash generated:", hash);
    console.log("Paystack signature:", paystackSignature);

    if (hash !== paystackSignature) {
        console.log('Invalid hash');
        console.log('Paystack signature:', paystackSignature, 'Hash:', hash);
        return res.status(400).send('Invalid signature');
    }

    const event = req.body;
    if (event && event.event === 'charge.success') {
        // Process payment success...
    }
    res.status(200).send('Webhook received');
});

module.exports = router;
