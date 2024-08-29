const mongoose = require("mongoose");

const chatRoomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  messages: {
    type: [String],
    required: true,
    default: [],
  },
  notes: {
    type: [
      {
        text: { type: String, required: true },
        note: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    default: [],
  },
  meetingTitle: { type: String, required: false },
  summary: { type: String, required: false },
  meetingPurpose: { type: String, required: false },
  participants: [
    {
      name: { type: String, required: false },
      title: { type: String, required: false },
    },
  ],
  user: {
    type: mongoose.Schema.Types.ObjectId, // Data type is ObjectId
    ref: "User", // Reference to the 'User' model
    required: false, // This field is not mandatory
  },
});

const ChatRoom = mongoose.model("ChatRoom", chatRoomSchema);

module.exports = ChatRoom;
