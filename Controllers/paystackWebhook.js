// webhookRoutes.js
const express = require('express');
const app = express();
const router = express.Router();
const crypto = require('crypto');
const Userschema = require('../Models/user.models');

require('dotenv').config();

app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf.toString();
    }
}));

router.post('/webhook', async (req, res) => {
    console.log('in webhook');
    // console.log('Request body:', req.body);
    console.log('Paystack signature:', req.headers['x-paystack-signature']);
    
    const hash = crypto
        .createHmac('sha512', process.env.API_SECRET)
        .update(req.rawBody)
        .digest('hex');

    // Verify signature
    if (hash !== req.headers['x-paystack-signature']) {
        console.log('Invalid hash');
        console.log(`Received signature: ${req.headers['x-paystack-signature']}`);
        console.log(`Generated hash: ${hash}`);
        return res.status(400).send('Invalid signature');
    }

    const event = req.body;
    console.log('Event received:', event ? event : 'No event found');

    try {
        if (event && event.event === 'charge.success') {
            const transactionId = event.data.reference;
            const userEmail = event.data.customer.email;
            const amountPaid = event.data.amount / 100;

            await Userschema.findOneAndUpdate(
                { Email: userEmail },
                { $inc: { Balance: amountPaid } }
            );

            console.log(`Payment successful for ${userEmail} with transaction ID: ${transactionId}`);
            return res.status(200).send('Transaction processed successfully');
        } else if (event && event.event === 'charge.failed') {
            console.log('Payment failed for transaction ID:', event.data.reference);
            return res.status(200).send('Transaction failed');
        }
    } catch (error) {
        console.error('Error handling webhook:', error.message);
        return res.status(500).send('Internal server error');
    }
});

module.exports = router;
