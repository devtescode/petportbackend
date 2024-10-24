// controllers/paystackWebhook.js

const axios = require('axios');
const Userschema = require('../Models/user.models'); // Adjust the path to your user model

module.exports.paystackWebhook = async (req, res) => {
    const { event, data } = req.body;

    // Log the received event and data for debugging
    console.log('Received webhook event:', event, 'with data:', data);

    if (event === 'charge.success') {
        const transactionRef = data.reference;

        try {
            const verifyResponse = await axios.get(`https://api.paystack.co/transaction/verify/${transactionRef}`, {
                headers: {
                    'Authorization': `Bearer ${process.env.API_SECRET}`
                }
            });
            console.log(verifyResponse);
            

            if (verifyResponse.data.status && verifyResponse.data.data.status === 'success') {
                const user = await Userschema.findOne({ Email: verifyResponse.data.data.customer.email });

                if (user) {
                    const amountInNaira = verifyResponse.data.data.amount / 100; // Convert from kobo to Naira
                    console.log(amountInNaira);
                    
                    user.Balance += amountInNaira;

                    // Log the transaction
                    user.transactions.push({
                        amount: amountInNaira,
                        reference: transactionRef,
                        type: 'credit', // Assuming this is a credit transaction
                        date: new Date() // Optional: add timestamp
                    });

                    await user.save();

                    console.log('User balance and transaction updated successfully');
                    res.status(200).send('Webhook processed successfully');
                } else {
                    console.error('User not found for email:', verifyResponse.data.data.customer.email);
                    res.status(404).send('User not found');
                }
            } else {
                console.error('Transaction verification failed:', verifyResponse.data);
                res.status(400).send('Transaction verification failed');
            }
        } catch (error) {
            console.error('Error verifying transaction:', error);
            res.status(500).send('Server error');
        }
    } else {
        console.warn('Unhandled event type:', event);
        res.status(400).send('Event not handled');
    }
};
