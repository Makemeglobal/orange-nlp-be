// routes/authRoutes.js
const express = require("express");
const { sendOTP, verifyOTPAndSignup, resendOTP, login, sendResetPasswordOTP, verifyOTPAndResetPassword, getUserProfile, getBusinessProfile, changePassword, updateUser, updateBusiness, sendResetPasswordOTPWithPassword, verifyOtpAndUpdateEmail } = require("../controller/auth.v2");
const router = express.Router();
const { authMiddleware } = require("../middleware/auth");
const { User } = require("../model/User");



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
router.get('/user/by-email/:email',async(req,res)=>{
try{
    const user = await User.findOne({email:req.params.email});
    if(!user){
        return res.status(404).json({message:'User not found'})
    }
    return res.status(200).json({message:'User found',userId:user._id});
}catch(err){
    console.log(err);
    return res.status(500).json({err:err.message,message:"Something went wrong"})
}
})
module.exports=router;