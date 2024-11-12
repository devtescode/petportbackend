// webhookRoutes.js
const express = require('express');
// const crypto = require('node:crypto');
const bodyParser = require('body-parser');
const Userschema = require('../Models/user.models');
const router = express.Router();
const env = require('dotenv')
env.config()
router.use(bodyParser.raw({ type: 'application/json' }));

// router.post('/webhook', async (req, res) => {
//     console.log('In webhook routing');
//     const paystackSignature = req.headers['x-paystack-signature'];
//     const rawBody = req.body;  // Keep as Buffer

//     // Log API_SECRET to ensure it’s being loaded correctly
//     console.log("API_SECRET:", process.env.API_SECRET);

//     // Compute hash directly from the raw body (Buffer format)
//     const hash = crypto.createHmac('sha512', process.env.API_SECRET).update(rawBody).digest('hex');

//     // Logging details for debugging
//     console.log("Paystack signature:", paystackSignature);
//     console.log("Hash generated:", hash);

//     // Compare the calculated hash with Paystack's signature
//     if (hash !== paystackSignature) {
//         console.log('Invalid hash');
//         return res.status(400).send('Invalid signature');
//     }

//     // Parse the raw body to JSON if signature matches
//     const event = JSON.parse(rawBody.toString('utf8'));  // Only parse if verified
//     if (event && event.event === 'charge.success') {
//         // Process payment success
//         console.log('Payment successful event received');
//     }

//     res.status(200).send('Webhook received');
// });


router.post('/webhook', (req, res) => {
    console.log('in webhook working at the Top.')
    
    // Verify the signature (optional but recommended for security)
    const crypto = require('crypto');
    const signature = req.headers['x-paystack-signature'];
    
    const expectedSignature = crypto
    .createHmac('sha512', process.env.API_SECRET)
    .update(JSON.stringify(event))
    .digest('hex');
    
    // Check if the signature is valid
    if (signature !== expectedSignature) {
        console.log('invalid signature');
        return res.status(403).send('Invalid signature');
        
    }
    const event = req.body; // Get the event data from Paystack

    console.log(event)
    if(event && event.event=="charge.success"){
        // Process payment success
        console.log('Payment successful event received');
        const userEmail = event.data.customer.email;
        const amountPaid = event.data.amount / 100; // Convert from cents to dollars
        res.status(200).send('Event received');
        console.log(userEmail, amountPaid);
        

    }else{
        console.log('Payment failed event received');
        
    }

    // Respond to Paystack
});

module.exports = router;




