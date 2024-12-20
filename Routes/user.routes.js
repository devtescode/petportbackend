const express = require('express');
const { userWelcome, signUp, signIn, dashBoard, product, productid, investnow, changepassword, profile, emailpage, forgetpassword, fundaccount, getHistory, investperform, Adminlogin, Admindb, getall, putall, postall, delecteach, getuseranimalinvest, totalbalance, totalAmountInvested, Totalinvest, changePasswordAdmin, createplan, getuserplans, adminplansdelect, updateplan, getplan, planinvestnow, adnotification, getusernotification, fetchUsersNotifications, likeplan, addcomment, getcomments, getAllNotifications, deleteNotification, getusernotificationcount, testdashboard, deletecomment, getuserallcomments, getallinvest, addupaccount,  getBalance, userBalanceWallet, getPayoutDetails, getTransactionHistory} = require('../Controllers/user.controllers');
// const paymentController = require('../controllers/paymentController'); 
// const {paystackWebhook} = require('../Controllers/paystackWebhook')
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
router.get("/Admindb", Admindb)
router.get("/getallusers", getall)
router.put("/putall/:id", putall)
router.post("/postall", postall)
router.delete("/delecteachuser/:id", delecteach)
router.get("/getuseranimalinvest", getuseranimalinvest)
router.get("/totalbalance", totalbalance)
router.get("/totalAmountInvested", totalAmountInvested)
router.get("/Totalinvest", Totalinvest)
router.post("/changePasswordAdmin", changePasswordAdmin)
router.post("/createplan", createplan)
router.get("/getuserplans", getuserplans)
router.delete("/adminplansdelect/:id", adminplansdelect)
router.put("/updateplan/:id", updateplan)
router.get("/getplan/:id", getplan)
router.post("/planinvestnow", planinvestnow)
router.post("/adnotification", adnotification)
router.get("/getusernotification", getusernotification)
router.get("/fetchUsersNotifications", fetchUsersNotifications)
router.post("/likeplan", likeplan)
router.post("/addcomment", addcomment)
router.get("/getcomments/:id", getcomments)
router.get("/getAllNotifications", getAllNotifications)
router.delete("/deleteNotification/:id", deleteNotification)
router.get("/getusernotificationcount", getusernotificationcount)
router.get("/testdb", testdashboard)
router.delete("/deletecomment/:id", deletecomment)
router.get("/getuserallcomments", getuserallcomments)
router.get("/getallinvest", getallinvest)
router.post("/addupaccount", addupaccount)
// router.post('/paystack-webhook', paystackWebhook)
// router.get("/balance/:email", getBalance);
router.post("/userBalance/:email", userBalanceWallet);
router.get("/payout-details", getPayoutDetails)
router.post("/transactionhistory", getTransactionHistory )
// router.post('/transaction-history', transactionRouter.getTransactionHistory);

module.exports = router