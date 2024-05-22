const express = require('express');
const { userWelcome, signUp, signIn, dashBoard, product, productid, investnow} = require('../Controllers/user.controllers');
const router = express.Router()


router.get("/user", userWelcome);
router.post("/signup", signUp)
router.post("/signin", signIn)
router.get("/dashboard", dashBoard)
router.get("/product", product)
router.get("/productid/:id", productid)
router.post("/investnow", investnow)
module.exports = router