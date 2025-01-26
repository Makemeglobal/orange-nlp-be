const { User, Business } = require("../model/User");
const OTP = require("../model/Otp");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const jwt = require("jsonwebtoken")

exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const otp = crypto.randomInt(1000, 9999).toString();

    await OTP.create({ email, otp });

    await sendEmail(email, "Otp", `this is your fookin ${otp}`);

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message ,message:"Failed to send OTP"});
  }
};

exports.verifyOTPAndSignup = async (req, res) => {
  try {
    const { email, otp, fullName, phone, password, role, businessDetails } =
      req.body;

      console.log("details",email, otp, fullName, phone, password, role, businessDetails)
    const otpRecord = await OTP.findOne({ email, otp });
    if (!otpRecord) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const newUser = await User.create({
      fullName,
      email,
      phone,
      password,
      email_verified: true,
      role,
    });

    if (role === "business" && businessDetails) {
      const {
        businessName,
        address,
        phone,
        imageUrl,
        location,
      } = businessDetails;
      await Business.create({
        userId: newUser._id,
        businessName,
        address,
        phone,
        imageUrl,
        location,
      });
    }

    await OTP.deleteOne({ email, otp });

    res
      .status(201)
      .json({ message: "User created successfully", user: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to verify OTP and create user" });
  }
};


exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    await OTP.deleteOne({ email });

    const newOtp = crypto.randomInt(1000, 9999).toString();

 
    await OTP.create({ email, otp: newOtp });

    
    await sendEmail(email, "OTP Resend", `Your new OTP is: ${newOtp}`);

    res.status(200).json({ message: "New OTP sent successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message, message: "Failed to resend OTP" });
  }
};


exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (password !== user.password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "your_secret_key",
      { expiresIn: "1h" } 
    );

    // Respond with token
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message, message: "Login failed" });
  }
};


exports.sendResetPasswordOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const otp = crypto.randomInt(1000, 9999).toString();

    
    await OTP.deleteOne({ email });

  
    await OTP.create({ email, otp });

   
    await sendEmail(email, "Reset Password OTP", `Your OTP is: ${otp}`);

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message, message: "Failed to send OTP" });
  }
};


exports.verifyOTPAndResetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const otpRecord = await OTP.findOne({ email, otp });
    if (!otpRecord) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.password = newPassword; 
    await user.save();

    await OTP.deleteOne({ email, otp });

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to reset password" });
  }
};