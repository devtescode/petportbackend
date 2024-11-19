const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const cors = require('cors');
const userRoutes = require('./Routes/user.routes');
const paystackroute = require('./Controllers/paystackWebhook');

const app = express();
const PORT = process.env.PORT || 5000;
const URI = process.env.URI;

// Middleware
app.use(cors());
app.use(express.urlencoded({ extended: true, limit: '200mb' }));
app.use(express.json({ limit: '200mb' }));

// Connect to MongoDB
mongoose
    .connect(URI)
    .then(() => {
        console.log('Database connected successfully');
    })
    .catch((err) => {
        console.error('Database connection error:', err);
    });

// Routes
app.use('/useranimalinvest', userRoutes);

// Middleware for Paystack webhook
app.use('/api/paystack', 
  express.raw({ type: '*/*' }),  // Capture raw body for webhook
  (req, res, next) => {
      req.rawBody = req.body;  // Assign raw body to req.rawBody
      console.log('Captured Raw Body:', req.rawBody.toString('utf8')); // Log raw body to debug
      next();  // Continue processing the request
  },
  paystackroute  // Add the Paystack webhook handler route
);

// Paystack route
// app.use('/api/paystack', paystackroute);


// app.use('/api/paystack/webhook', express.raw({ type: '*/*' })); // Capture raw body


// Paystack Webhook Route
// app.use('/api/paystack', paystackroute);

// Default Route
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Welcome to Animal Investment Platform' });
});

// Catch-all Error Handler
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(500).json({ message: 'Internal Server Error' });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
