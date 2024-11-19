const express = require('express');
const crypto = require('crypto');
const router = express.Router();

const PAYSTACK_SECRET = process.env.API_SECRET;

router.post('/webhook', (req, res) => {
    // Validate event using raw body and signature
    const rawBody = req.rawBody; // Captured by the middleware
    const signature = req.headers['x-paystack-signature']; // Paystack's signature header

    if (!signature || !rawBody) {
        console.log("Bad Request: Missing raw body or signature")
        return res.status(400).send('Bad Request: Missing raw body or signature');
    }

    const hash = crypto.createHmac('sha512', PAYSTACK_SECRET).update(rawBody).digest('hex');
    
    if (hash === signature) {
        // Signature is valid
        const event = JSON.parse(rawBody); // Parse raw body as JSON
        console.log('Valid webhook event received:', event);

        // Example: Handle specific events
        if (event.event === 'charge.success') {
            const email = event.data.customer.email;
            const amount = event.data.amount / 100; // Convert from kobo to naira
            console.log(`Payment successful for ${email}, Amount: ₦${amount}`);
            // Add your business logic here
        }

        return res.status(200).send('Webhook processed');
    } else {
        console.error('Invalid signature');
        return res.status(403).send('Forbidden: Invalid signature');
    }
});

module.exports = router;
