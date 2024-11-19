const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    event: { type: Object, required: true },
    customerEmail: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: 'NGN' },  // Default value for currency
    reference: { type: String, required: true, unique: true }, // Ensures reference is unique
    status: { type: String, required: true },
    paidAt: { type: Date, required: true },
    authorizationCode: { type: String, required: true },
    paymentMethod: { type: String, required: true },
    channel: { type: String, required: true },
}, { timestamps: true });

// Optional: Index for performance on frequently queried fields
paymentSchema.index({ reference: 1 });

const PaymentDB = mongoose.model('paystackpayment', paymentSchema);
module.exports = { PaymentDB };
