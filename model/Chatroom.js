const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  messages: {
    type: [String], // Array of strings
    required: true,
    default: [] // Optional: ensures that messages array is always initialized
  }
});

const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema);

module.exports = ChatRoom;
