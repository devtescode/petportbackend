const express = require('express')
const app = express()
const mongoose = require('mongoose')
const env = require ('dotenv').config()
const PORT = process.env.PORT || 5000
const URI = process.env.URI
const userRoutes = require("./Routes/user.routes")

const cors = require('cors')
app.use(cors())
app.use(express.urlencoded({ extended:true, limit:"200mb"}))
app.use(express.json({limit:"200mb"}))


mongoose.connect(URI)
.then(()=>{
    console.log("Datebase connect succcessfully");
}).catch((err)=>{
    console.log(err);
})
app.use("/useranimalinvest", userRoutes)
app.use(userRoutes)
// app.use('/admin', adminRoutes);
app.get("/", (req,res)=>{
    res.status(200).json({message:"Welcome to Animal company"})
})
app.listen(PORT, ()=>{
    console.log("Server is running on port 5000");
})





