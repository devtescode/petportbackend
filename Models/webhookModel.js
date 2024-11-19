const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    event: { type: Object, required: true },
    customerEmail: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    reference: { type: String, required: true },
    status: { type: String, required: true },
    paidAt: { type: Date, required: true },
    authorizationCode: { type: String, required: true },
    paymentMethod: { type: String, required: true },
    channel: { type: String, required: true },
}, { timestamps: true });

const PaymentDB = mongoose.model('Payment', paymentSchema);
module.exports = { PaymentDB } 


// const Comment = mongoose.model('Comment', commentSchema);
// module.exports = { Userschema, Plan, Notification, Comment }