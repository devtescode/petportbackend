// webhookRoutes.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Userschema = require('../Models/user.models'); // Adjust the path if needed

// Paystack Webhook Route
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    console.log('Webhook endpoint hit');

    // Log the raw request body for debugging
    console.log('Raw request body:', req.body);

    try {
        // Retrieve the Paystack signature from headers
        const paystackSignature = req.headers['x-paystack-signature'];
        
        // Generate a hash using the secret key and raw request body
        const hash = crypto
            .createHmac('sha512', process.env.API_SECRET)
            .update(req.body)
            .digest('hex');

        // Verify the hash against the Paystack signature
        if (hash !== paystackSignature) {
            console.log('Invalid signature');
            return res.status(400).send('Invalid signature');
        }

        // Parse the raw request body as JSON
        const event = JSON.parse(req.body.toString());
        console.log('Event received:', event);

        // Handle different event types
        if (event && event.event === 'charge.success') {
            const transactionId = event.data.reference;
            const userEmail = event.data.customer.email;
            const amountPaid = event.data.amount / 100; // Convert amount to Naira if stored in Kobo

            // Update user's balance based on the email address
            await Userschema.findOneAndUpdate(
                { Email: userEmail },
                { $inc: { Balance: amountPaid } } // Increment balance by the amount paid
            );

            console.log(`Payment successful for ${userEmail} with transaction ID: ${transactionId}`);
            return res.status(200).send('Transaction processed successfully');
        } else if (event && event.event === 'charge.failed') {
            console.log('Payment failed for transaction ID:', event.data.reference);
            return res.status(200).send('Transaction failed');
        }

        // If event type is unhandled, respond with success
        res.status(200).send('Event received');

    } catch (error) {
        console.error('Error handling webhook:', error.message);
        res.status(500).send('Internal server error');
    }
});

module.exports = router;
