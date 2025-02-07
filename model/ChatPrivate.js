const mongoose = require("mongoose");

const ChatSchema = new mongoose.Schema({
  chatRoomId: { type: String, required: true }, 
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], 
  messages: [
    {
      senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, 
      message: { type: String, required: true },
      messageType: { type: String, enum: ["text", "image", "video", "file"], default: "text" }, 
      timestamp: { type: Date, default: Date.now },
      status: { type: String, enum: ["sent", "delivered", "read"], default: "sent" },
      attachments: { type: String }, 
    },
  ],
  lastMessage: {
    message: { type: String },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    timestamp: { type: Date, default: Date.now },
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Chat", ChatSchema);
