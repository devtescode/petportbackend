const express = require('express')
const app = express()
const mongoose = require('mongoose')
require ('dotenv').config()
const PORT = process.env.PORT || 5000
const URI = process.env.URI
const userRoutes = require("./Routes/user.routes")
const paystackroute = require("./Controllers/paystackWebhook")
// const webhookRouter = require('./paystacklocalhost/webhook');

const cors = require('cors')
app.use(cors())
app.use(express.urlencoded({ extended:true, limit:"200mb"}))
app.use(express.json({limit:"200mb"}))

app.use(express.json());
mongoose.connect(URI)
.then(()=>{
    console.log("Datebase connect succcessfully");
}).catch((err)=>{
    console.log(err);
})
app.use("/useranimalinvest", userRoutes)
app.use(userRoutes)


// app.use("/api", paystackroute)
// app.use(paystackroute)


app.use('/api/paystack/webhook', express.raw({ type: '*/*' }));

// Debugging Middleware to log raw body
app.use('/api/paystack/webhook', (req, res, next) => {
    req.rawBody = req.body; // Assign raw body to req.rawBody for use in route
    console.log('Raw body captured:', req.rawBody ? req.rawBody.toString() : 'No raw body');
    next();
});

// Use the Paystack route
app.use('/api/paystack', paystackroute);
// Use Paystack webhook route
// app.use('/api/paystack', paystackroute);



app.get("", (req,res)=>{
    res.status(200).json({message:"Welcome to Animal"})
})

app.listen(PORT, ()=>{
    console.log("Server is running on port 5000");
})