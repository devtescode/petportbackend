// controllers/paystackWebhook.js


// webhookRoutes.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Userschema = require('../Models/user.models'); 
// const Userschema = require('../models/Userschema'); // Adjust the path as needed

// Paystack Webhook Route


router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    console.log('in webhook');
    console.log('Request body:', req.body);  // Add this line to inspect the body
    // const paystackSignature = req.headers['x-paystack-signature'];
    const hash = crypto.createHmac('sha512', process.env.API_SECRET).update(req.body).digest('hex');
    
        

    if (hash !== req.headers['x-paystack-signature']) {
        console.log('invalid hash')
        return res.status(400).send('Invalid signature');
    }

    const event = req.body;
    console.log(event ? event : 'no event send');  // Logs if the event object is undefined or missing
    try {
        if (event && event.event === 'charge.success') {
            const transactionId = event.data.reference;
            const userEmail = event.data.customer.email;
            const amountPaid = event.data.amount / 100; // Convert to Naira if stored in Kobo

            await Userschema.findOneAndUpdate(
                { Email: userEmail },
                { $inc: { Balance: amountPaid } } // Example balance update
            );

            console.log(`Payment successful for ${userEmail} with transaction ID: ${transactionId}`);
            return res.status(200).send('Transaction processed successfully');
        } else if (event && event.event === 'charge.failed') {
            console.log('Payment failed for transaction ID:', event.data.reference);
            return res.status(200).send('Transaction failed');
        }
    } catch (error) {
        console.error('Error handling webhook', error.message);
        res.status(500).send('Internal server error');
    }
});

module.exports = router;
