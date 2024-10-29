const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');

// Use body-parser middleware to parse JSON bodies
router.use(bodyParser.json());

// Your Paystack secret key
const PAYSTACK_SECRET = 'sk_test_e3f5eb51dc982c30dd742f6bf335cb4b99ec4945'; 

// Webhook endpoint
router.post('/api/paystack/webhook', (req, res) => {
    const event = req.body; // Get the event data from Paystack

    // Verify the signature (optional but recommended for security)
    const crypto = require('crypto');
    const signature = req.headers['x-paystack-signature'];

    const expectedSignature = crypto
        .createHmac('sha512', PAYSTACK_SECRET)
        .update(JSON.stringify(event))
        .digest('hex');

    // Check if the signature is valid
    if (signature !== expectedSignature) {
        return res.status(403).send('Invalid signature');
    }

    // Handle different event types (e.g., charge.succeeded, charge.failed, etc.)
    switch (event.event) {
        case 'charge.success':
            // Handle successful charge
            console.log('Charge successful:', event.data);
            break;
        case 'charge.failed':
            // Handle failed charge
            console.log('Charge failed:', event.data);
            break;
        // Add more cases for other event types if needed
        default:
            console.log('Unhandled event type:', event.event);
    }

    // Respond to Paystack
    res.status(200).send('Event received');
});

module.exports = router;
