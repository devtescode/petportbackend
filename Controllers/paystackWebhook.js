// const express = require('express');
// const crypto = require('crypto');
// const router = express.Router();
// const {PaymentDB}= require('../Models/webhookModel')
// require('dotenv').config();

// const PAYSTACK_SECRET = process.env.API_SECRET;
// // console.log('Paystack Secret:', PAYSTACK_SECRET);  

// router.post('/webhook', async (req, res) => {
//     try {
//         const rawBody = req.rawBody; // Get the raw body
//         const signature = req.headers['x-paystack-signature']; // Paystack's signature header

//         if (!signature || !rawBody) {
//             console.error("Bad Request: Missing raw body or signature");
//             return res.status(400).json({ error: 'Missing raw body or signature' });
//         }

//         // Convert buffer to string only if it's a Buffer
//         const rawBodyString = rawBody instanceof Buffer ? rawBody.toString('utf8') : JSON.stringify(rawBody);
//         console.log('Raw Body:', rawBodyString);

//         // Validate the signature with HMAC-SHA512
//         const hash = crypto.createHmac('sha512', PAYSTACK_SECRET).update(rawBodyString).digest('hex');
//         console.log('Calculated Hash:', hash);
//         console.log('Paystack Signature:', signature);

//         if (hash === signature) {
//             // Signature is valid
//             const event = JSON.parse(rawBodyString); // Parse raw body as JSON
//             console.log('Valid webhook event received:', event);

//             // Handle specific Paystack events
//             if (event.event === 'charge.success') {
//                 const { email, amount, status, paidAt, authorization_code, channel } = event.data.customer;
//                 const reference = event.data.reference;
//                 const currency = event.data.currency || 'NGN';  // Default currency to NGN

                
//                 const paymentsaved = new PaymentDB({
//                     event: event.event,
//                     customerEmail: email,
//                     amount: amount / 100,  // Convert to full currency (e.g., Naira)
//                     currency,
//                     reference,
//                     status,
//                     paidAt: new Date(paidAt),
//                     authorizationCode: authorization_code,
//                     paymentMethod: 'Paystack',
//                     channel
//                 });

//                 await paymentsaved.save();  // Save the data into the database
//                 console.log('Payment data saved to database:', paymentsaved);
//             }

//             return res.status(200).json({ message: 'Webhook processed successfully' });
//         } else {
//             console.error('Invalid signature');
//             return res.status(403).json({ error: 'Invalid signature' });
//         }
//     } catch (error) {
//         console.error('Error processing webhook:', error.message);
//         return res.status(500).json({ error: 'Internal server error' });
//     }
// });

// module.exports = router;


const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { PaymentDB } = require('../Models/webhookModel');
require('dotenv').config();

const PAYSTACK_SECRET = process.env.API_SECRET;

// Ensure raw body is captured before any other parsing middleware
router.use(express.raw({ type: 'application/json', limit: '10kb' }));

router.post('/webhook', async (req, res) => {
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
                const { email } = event.data.customer || {}; // Safely access customer email
                const { amount, status, paidAt, authorization_code, channel, reference, currency } = event.data || {}; // Safely access properties
            
                if (!amount) {
                    console.error('Amount is undefined!');
                    return res.status(400).json({ error: 'Amount is missing in webhook data' });
                }
            
                // Log if authorization_code is missing
                if (!authorization_code) {
                    console.warn('Authorization code is missing for this transaction.');
                }
            
                // Convert amount to full currency (e.g., Naira)
                const amountInFullCurrency = amount / 100; // Assuming amount is in kobo for NGN
            
                const paymentsaved = new PaymentDB({
                    event: event.event,
                    customerEmail: email || 'Unknown Email',
                    amount: amountInFullCurrency,
                    currency: currency || 'NGN', // Default to 'NGN' if not provided
                    reference: reference || 'No Reference',
                    status: status || 'unknown',
                    paidAt: paidAt ? new Date(paidAt) : new Date(), // Default to now if missing
                    authorizationCode: authorization_code || 'N/A',
                    paymentMethod: 'Paystack',
                    channel: channel || 'unknown'
                });
            
                await paymentsaved.save(); // Save the data into the database
                console.log('Payment data saved to database:', paymentsaved);
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
