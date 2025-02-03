// routes/authRoutes.js
const express = require("express");
const { sendOTP, verifyOTPAndSignup, resendOTP, login, sendResetPasswordOTP, verifyOTPAndResetPassword, getUserProfile, getBusinessProfile, changePassword, updateUser, updateBusiness, sendResetPasswordOTPWithPassword, verifyOtpAndUpdateEmail } = require("../controller/auth.v2");
const router = express.Router();
const { authMiddleware } = require("../middleware/auth");



router.post('/send-otp',sendOTP);
router.post('/signup',verifyOTPAndSignup)
router.post('/resend-otp',resendOTP)
router.post('/login',login)
router.post('/password-otp',sendResetPasswordOTP)
router.post('/reset-password',verifyOTPAndResetPassword)
router.get('/user/pf', authMiddleware,  getUserProfile)
router.get('/biz/pf',authMiddleware,getBusinessProfile)
router.put('/password-reset-login',authMiddleware,changePassword)
router.patch('/user/pf',authMiddleware,updateUser)
router.patch('/biz/pf',authMiddleware,updateBusiness)
router.post('/send-email-otp',authMiddleware,sendResetPasswordOTPWithPassword)
router.put('/user/email',authMiddleware, verifyOtpAndUpdateEmail)
module.exports=router;