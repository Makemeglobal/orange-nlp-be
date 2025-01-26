// routes/authRoutes.js
const express = require("express");
const { sendOTP, verifyOTPAndSignup, resendOTP, login, sendResetPasswordOTP, verifyOTPAndResetPassword } = require("../controller/auth.v2");
const router = express.Router();


router.post('/send-otp',sendOTP);
router.post('/signup',verifyOTPAndSignup)
router.post('/resend-otp',resendOTP)
router.post('/login',login)
router.post('/password-otp',sendResetPasswordOTP)
router.post('/reset-password',verifyOTPAndResetPassword)
module.exports=router;