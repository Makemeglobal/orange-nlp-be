// routes/authRoutes.js
const express = require("express");
const { sendOTP, verifyOTPAndSignup, resendOTP, login, sendResetPasswordOTP, verifyOTPAndResetPassword, getUserProfile, getBusinessProfile, changePassword, updateUser, updateBusiness, sendResetPasswordOTPWithPassword, verifyOtpAndUpdateEmail } = require("../controller/auth.v2");
const router = express.Router();
const { authMiddleware } = require("../middleware/auth");
const { User } = require("../model/User");
const ChatPrivate = require("../model/ChatPrivate");
const Inventory = require("../model/Inventory");
const jwt=require("jsonwebtoken")
const PromoteSchema = require("../model/PromoteSchema");



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


router.get('/message/:chatRoomId', async (req, res) => {
    try {
      const { chatRoomId } = req.params;
  
      // Find chat room and populate messages
      const chatRoom = await ChatPrivate.findOne({ chatRoomId }).populate("messages.senderId", "name email");
  
      if (!chatRoom) {
        return res.status(404).json({ message: "Chat room not found" });
      }
  
      res.status(200).json(chatRoom.messages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  })
  router.post("/promote", async (req, res) => {
    try {
      const { inventoryId, locations, amount } = req.body;
  
      // Check if inventory exists
      const inventory = await Inventory.findById(inventoryId);
      if (!inventory) {
        return res.status(404).json({ message: "Inventory item not found" });
      }
  
      // Create new promotion
      const newPromotion = new PromoteSchema({
        inventory: inventoryId,
        locations,
        amount,
      });
  
      // Save to DB
      const savedPromotion = await newPromotion.save();
      res.status(201).json(savedPromotion);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error });
    }
  });


  const API_KEY = "3db48a46-26d7-4496-949f-a7053bdea4f8";
const SECRET_KEY = "c664515d50122963e3822105d75c6857bbfce4a65acf86ca8bcdc34289803c9f";

// Route to generate token
router.get('/generate-token', (req, res) => {
  try {
    const payload = {
      apikey: API_KEY,
      permissions: ["allow_join", "allow_mod"], // Define permissions as needed
    };

    // Generate JWT token
    const token = jwt.sign(payload, SECRET_KEY, {
      algorithm: 'HS256',
      expiresIn: '24h', // Token validity
    });

    // Send token as response
    res.json({ token });
  } catch (error) {
    console.error("Error generating token:", error);
    res.status(500).json({ error: error.message });
  }
});
module.exports=router;