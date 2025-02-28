const { User, Business, Vendor } = require("../model/User");
const OTP = require("../model/Otp");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const jwt = require("jsonwebtoken")

exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const otp = crypto.randomInt(1000, 9999).toString();

    await OTP.create({ email, otp });

    await sendEmail(email, "Otp", `this is your otp ${otp}`);

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    // console.error(error);
    res.status(500).json({ error: error.message, message: "Failed to send OTP" });
  }
};

exports.verifyOTPAndSignup = async (req, res) => {
  try {
    const { email, otp, fullName, phone, password, role, imageUrl, businessDetails, vendorDetails } =
      req.body;

    // console.log("details", email, otp, fullName, phone, password, role, imageUrl, businessDetails, vendorDetails);
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
      imageUrl,
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

    if (role === "vendor" && vendorDetails) {
      const {
        vendorBusinessName,
        address,
        phone,
        imageUrl,
        location,
      } = vendorDetails;
      await Vendor.create({
        userId: newUser._id,
        vendorBusinessName,
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
      process.env.JWT_SECRET || "your_secret_key");

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



exports.getUserProfile = async (req, res) => {
  try {
    const userProfile = await User.findById(req.user).select('email fullName imageUrl');

    if (!userProfile) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(userProfile);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};


exports.getBusinessProfile = async (req, res) => {
  try {
    const userProfile = await Business.findOne({ userId: req.user });

    if (!userProfile) {
      return res.status(404).json({ message: 'Business not found' });
    }

    res.status(200).json(userProfile);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};



exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Both passwords are required." });
    }

    if (currentPassword == newPassword) {
      return res.status(400).json({ message: "New Password can not be same as Old One." });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.password !== currentPassword) {
      return res.status(400).json({ message: "Current password is incorrect." });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: "Password changed successfully." });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};



exports.updateUser = async (req, res) => {
  try {
    const userId = req.user;
    const updateFields = req.body; // Get the fields that need to be updated

    if (!updateFields || Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: "No fields provided for update." });
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateFields, {
      new: true, // Return updated document
      runValidators: true, // Ensure validation rules apply
    });

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Server error" });
  }
};




exports.updateBusiness = async (req, res) => {
  try {
    const userId = req.user;
    const updateFields = req.body; // Get the fields that need to be updated

    if (!updateFields || Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: "No fields provided for update." });
    }

    const updatedUser = await Business.findOneAndUpdate({ userId }, updateFields, {
      new: true, // Return updated document
      runValidators: true, // Ensure validation rules apply
    });

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({
      message: "Business updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Server error" });
  }
};




exports.sendResetPasswordOTPWithPassword = async (req, res) => {
  try {
    const { email, password } = req.body;

    const otherUser = await User.findOne({
      email,
      _id: { $ne: req.user },
    });

    if (otherUser) {
      return res.status(400).json({ error: "Another user with this email already exists." });
    }

    const user = await User.findOne({ _id: req.user });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    if (user.password !== password) {
      return res.status(400).json({ error: "Incorrect password." });
    }

    const otp = crypto.randomInt(1000, 9999).toString();

    await OTP.deleteOne({ email });

    await OTP.create({ email, otp });

    await sendEmail(email, "Reset Password OTP", `Your OTP is: ${otp}`);

    res.status(200).json({ message: "OTP sent successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message, message: "Failed to send OTP." });
  }
};




exports.verifyOtpAndUpdateEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Check if the OTP exists for the provided email
    const otpRecord = await OTP.findOne({ email });
    if (!otpRecord) {
      return res.status(400).json({ error: "No OTP found for this email" });
    }

    // Compare the OTP
    if (otpRecord.otp !== otp) {
      return res.status(400).json({ error: "Incorrect OTP" });
    }

    // Find user and update email
    const user = await User.findById(req.user);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.email = email; // Update the email
    await user.save(); // Save the updated user document

    // Delete OTP after successful verification
    await OTP.deleteOne({ email });

    res.status(200).json({ message: "Email updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message, message: "Failed to update email" });
  }
};