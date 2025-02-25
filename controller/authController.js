const User = require("../model/User");
const OTP = require("../model/Otp");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const generateOTP = require("../utils/generateOTP");
const sendEmail = require("../utils/sendEmail");
require("dotenv").config();
const sendInvitationEmail = require("../utils/sendInvitationEmail");
const InvitationToken = require("../model/InvitationToken");
const mongoose = require("mongoose");
const Plan = require("../model/Plan");
const Stripe = require("stripe");
const Transaction = require("../model/Transaction");
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const cloudinary = require("../config/cloudinary");

exports.signup = async (req, res) => {
  const { fullName, country, email, phone, password, invited } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      if (!invited) {
        return res.status(400).json({ message: "User already exists" });
      }
    }

    const otp = generateOTP();
    await OTP.create({ email, otp });

    await sendEmail(email, "OTP Verification", `Your OTP is ${otp}`);

    res.status(200).json({ message: "OTP sent to email" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.googleSignup = async (req, res) => {
  const { fullName, email, profilePicture, id } = req.body;
  try {
    let user = await User.findOne({ email });

    if (user) {
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
      res.status(200).json({ user, token });
    } else {
      user = new User({
        fullName,
        email,
        profilePicture,
        socialId: id, // Store the Google ID if using Google login
        loginType: "google", // Indicate that the login type is Google
      });

      await user.save();

      // Generate a token for the newly created user
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);

      res.status(200).json({ user, token });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.resendOtp = async (req, res) => {
  const { email } = req.body;

  try {
    const userExists = await User.findOne({ email });

    await OTP.deleteMany({ email });

    const otp = generateOTP();

    await OTP.create({ email, otp });

    await sendEmail(email, "Resend OTP", `Your new OTP is ${otp}`);

    res.status(200).json({ message: "OTP resent to email" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.verifyOtpAndCreateUser = async (req, res) => {
  const { email, otp, fullName, country, phone, password, invited, token } =
    req.body;

  try {
    const otpRecord = await OTP.findOne({ email, otp });
    const otpR = await OTP.find();
    console.log(otpR);
    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (invited) {
      const decoded = jwt.verify(invited, process.env.JWT_SECRET);
      const { inviterId } = decoded;
      await User.findByIdAndUpdate(inviterId, { $push: { subUsers: email } });
      const invitedUser = await User.findOne({ email: email });
      console.log(invitedUser);
      try {
        const created = await User.findByIdAndUpdate(invitedUser.id, {
          fullName,
          country,
          phone,
          password: hashedPassword,
          userType: "subUser",
          inviteAccepted: true,
        });

        console.log(created);
      } catch (err) {
        console.log(err);
      }
    } else {
      await User.create({
        fullName,
        country,
        email,
        phone,
        password: hashedPassword,
        userType: "user",
      });
    }

    await OTP.deleteOne({ email, otp });
    console.log("done");
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    console.log(email);
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);

    res.status(200).json({ user, token });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getSubUsersById = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email }).populate("subUsers");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const allUsers = await Promise.all(
      user.subUsers.map(async (subUserEmail) => {
        const foundUser = await User.findOne({ email: subUserEmail });
        return foundUser;
      })
    );

    res.status(200).json(allUsers);
  } catch (error) {
    console.error("Error fetching sub-users:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.inviteSubUser = async (req, res) => {
  const { email } = req.body;
  console.log(req.body);
  const { inviterId } = req.body;
  console.log(typeof inviterId);
  try {
    const inviter = await User.findOne({ _id: inviterId });
    console.log(inviter);
    if (!inviter) {
      return res.status(400).json({ message: "Inviter not found" });
    }

    const token = jwt.sign({ email, inviterId }, process.env.JWT_SECRET);
    console.log(token);
    const iToken = await InvitationToken.create({
      email,
      inviter: inviterId,
      token,
    });

    console.log(iToken, "ji");

    await sendInvitationEmail(email, inviter.fullName, token);
    const user = await User.create({
      email: email,
      inviteAccepted: false,
    });

    res.status(200).json({ message: "Invitation sent", user });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
    console.log(error);
  }
};

exports.acceptInvitation = async (req, res) => {
  const { token } = req.query;
  // console.log(token);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { email, inviterId } = decoded;

    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.inviteAccepted) {
      return res.status(400).json({ message: "User already exists" });
    }

    await User.findByIdAndUpdate(inviterId, { $push: { subUsers: email } });
    const savedToken = token;
    await InvitationToken.deleteOne({ token });
    res.redirect(
      // ''
      // `http://localhost:3000/signup?token=${savedToken}`,
      `https://www.poweredbyzot.ai/api/auth/signup?token=${savedToken}&email=${email}`
    );
    res
      .status(201)
      .json({ message: "User created successfully and added as sub-user" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteSubUser = async (req, res) => {
  const { subUserId } = req.body;
  const { inviterId } = req.body;

  try {
    await User.findByIdAndUpdate(inviterId, { $pull: { subUsers: subUserId } });
    await User.findByIdAndDelete(subUserId);

    res.status(200).json({ message: "Sub-user deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const otp = generateOTP();
    await OTP.create({ email, otp });

    await sendEmail(email, "Password Reset OTP", `Your OTP is ${otp}`);

    res.status(200).json({ message: "OTP sent to email" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    const otpRecord = await OTP.findOne({ email, otp });

    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await User.updateOne({ email }, { password: hashedPassword });

    await OTP.deleteOne({ email, otp });

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user);
    if (!user) {
      return res.status(400).json({ Message: "User not found" });
    }

    const updates = req.body;
    for (const key in updates) {
      if (updates.hasOwnProperty(key)) {
        user[key] = updates[key];
      }
    }
    await user.save();
    res.status(200).json({
      message: "Profile updated successfully",
      success: true,
      user,
    });
  } catch (err) {
    console.log("err", err);
    res.status(500).send("Server error");
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user);
    console.log(user);
    if (!user) {
      return res.status(400).json({ Message: "User not found" });
    }
    res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    console.log("err", err);
    res.status(500).send("Server error");
  }
};

exports.uploadImage = async (req, res) => {
try{
  const imageUrl = req.file.path;
  console.log('image url',imageUrl)
  res.status(200).json({
    message: "Upload successfully",
    success: true,
    imageUrl,
  });
}catch(err){
  console.log('err',err);
  res.status(500).json({err:err.message})
}
};

exports.uploadAudio = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: "auto", public_id: `audio/${Date.now()}` },
      (error, result) => {
        if (error) {
          return res.status(500).send(error.message);
        }
        res.json(result);
      }
    );
    uploadStream.end(req.file.buffer);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

exports.addPlan = async (req, res) => {
  try {
    const { price, duration, title, description } = req.body;
    let plan = await Plan.create({ price, duration, title, description });
    res.status(200).json({
      success: true,
      plan,
    });
  } catch (err) {
    console.log("err", err);
    res.status(500).send("Server error");
  }
};

exports.stripeSession = async (req, res) => {
  try {
    const user = await User.findById(req.user);
    const { planId } = req.body;
    let plan = await Plan.findById(planId);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: plan.title,
            },
            unit_amount: plan.price * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: "https://www.poweredbyzot.ai/invite", // URL to redirect to after a successful payment
      cancel_url: "https://www.poweredbyzot.ai/not-successfull-order", // URL to redirect to if the payment is canceled
    });

    await Transaction.create({
      planId,
      sessionId: session.id,
      sessionUrl: session.url,
      status: "pending",
      user,
      amount: plan.price * 100,
    });

    res.status(200).json({
      success: true,
      url: session.url,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.stripePaymentStatus = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const event = req.body;
  console.log(sig);
  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    console.log("event", event);

    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object;

        break;
      case "checkout.session.expired":
        const expiredSession = event.data.object;

        console.log(`Session ${expiredSession.id} has expired.`);

        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    res.status(200).json({ received: true });
  } catch (err) {
    console.error(`Webhook error: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
};
