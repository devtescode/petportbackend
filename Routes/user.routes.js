const express = require('express');
const { userWelcome, signUp, signIn, dashBoard} = require('../Controllers/user.controllers');
const router = express.Router()


router.get("/user", userWelcome);
router.post("/signup", signUp)
router.post("/signin", signIn)
router.get("/dashboard", dashBoard)

module.exports = router