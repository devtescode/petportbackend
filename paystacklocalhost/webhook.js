// const express = require('express');
// const router = express.Router();
// const bodyParser = require('body-parser');

// // Use body-parser middleware to parse JSON bodies
// router.use(bodyParser.json());

// // Your Paystack secret key
// const PAYSTACK_SECRET = 'sk_test_e3f5eb51dc982c30dd742f6bf335cb4b99ec4945'; 

// // Webhook endpoint
// router.post('/hook', (req, res) => {
//     console.log('in webhook ')
//     const event = req.body; // Get the event data from Paystack

//     // Verify the signature (optional but recommended for security)
//     const crypto = require('crypto');
//     const signature = req.headers['x-paystack-signature'];

//     const expectedSignature = crypto
//         .createHmac('sha512', PAYSTACK_SECRET)
//         .update(JSON.stringify(event))
//         .digest('hex');

//     // Check if the signature is valid
//     if (signature !== expectedSignature) {
//         return res.status(403).send('Invalid signature');
//     }

//     // Handle different event types (e.g., charge.succeeded, charge.failed, etc.)
//     switch (event.event) {
//         case 'charge.success':
//             // Handle successful charge
//             console.log('Charge successful:', event.data);
//             break;
//         case 'charge.failed':
//             // Handle failed charge
//             console.log('Charge failed:', event.data);
//             break;
//         // Add more cases for other event types if needed
//         default:
//             console.log('Unhandled event type:', event.event);
//     }

//     // Respond to Paystack
//     res.status(200).send('Event received');
// });

// module.exports = router;

















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

