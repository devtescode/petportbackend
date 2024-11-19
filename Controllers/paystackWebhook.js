const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const paymentDB= require('../Models/webhookModel')
require('dotenv').config();

const PAYSTACK_SECRET = process.env.API_SECRET;
console.log('Paystack Secret:', PAYSTACK_SECRET);  // Log to check if it's loaded properly

router.post('/webhook', (req, res) => {
    try {
        const rawBody = req.rawBody; // Get the raw body
        const signature = req.headers['x-paystack-signature']; // Paystack's signature header

        if (!signature || !rawBody) {
            console.error("Bad Request: Missing raw body or signature");
            return res.status(400).json({ error: 'Missing raw body or signature' });
        }

        // Convert buffer to string only if it's a Buffer
        const rawBodyString = rawBody instanceof Buffer ? rawBody.toString('utf8') : JSON.stringify(rawBody);
        console.log('Raw Body:', rawBodyString);

        // Validate the signature with HMAC-SHA512
        const hash = crypto.createHmac('sha512', PAYSTACK_SECRET).update(rawBodyString).digest('hex');
        console.log('Calculated Hash:', hash);
        console.log('Paystack Signature:', signature);

        if (hash === signature) {
            // Signature is valid
            const event = JSON.parse(rawBodyString); // Parse raw body as JSON
            console.log('Valid webhook event received:', event);

            // Handle specific Paystack events
            if (event.event === 'charge.success') {
                const email = event.data.customer.email;
                const amount = event.data.amount / 100; // Convert kobo to naira
                console.log(`Payment successful for ${email}, Amount: ₦${amount}`);
                // Add your business logic here (e.g., update user data)

                const savePayment= new paymentDB ({event: event})
                savePayment.save()
            }

            return res.status(200).json({ message: 'Webhook processed successfully' });
        } else {
            console.error('Invalid signature');
            return res.status(403).json({ error: 'Invalid signature' });
        }
    } catch (error) {
        console.error('Error processing webhook:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
