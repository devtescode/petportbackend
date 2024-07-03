const express = require('express');
const { userWelcome, signUp, signIn, dashBoard, product, productid, investnow, changepassword, profile, emailpage, forgetpassword, fundaccount, getHistory, investperform, Adminlogin, } = require('../Controllers/user.controllers');
const router = express.Router()


router.get("/user", userWelcome);
router.post("/signup", signUp)
router.post("/signin", signIn)
router.get("/dashboard", dashBoard)
router.get("/product", product)
router.get("/productid/:id", productid)
router.post("/investnow", investnow)
router.post("/changepassword", changepassword)
router.post("/profile", profile)
router.post("/emailpage", emailpage)
router.post("/forgetpass", forgetpassword)
router.post("/fundaccount", fundaccount)
router.post("/getHistory", getHistory)
router.get("/investperform", investperform)
router.post("/adminlogin", Adminlogin)

module.exports = router