const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  fullName: { type: String, required: false },
  country: { type: String, required: false },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: false },
  password: { type: String, required: false },
  userType: {
    type: String,
    enum: ["user", "subUser"],
  },
  loginType: {
    type: String,
    enum: ["google", "email"],
    default: "email",
  },
  socialId: {
    type: String,
  },
  inviteAccepted: {
    type: Boolean,
  },
  subUsers: [{ type: String }],
  profilePicture: { type: String, required: false },
  activePlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Plan",
    required: false,
  },
});

module.exports = mongoose.model("User", UserSchema);
