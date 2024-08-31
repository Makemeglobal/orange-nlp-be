const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  messages: {
    type: [String], 
    required: true,
    default: [] 
  },
  notes: {
    type: [{
      text: { type: String, required: false },
      note: { type: String, required: false },
      index:{
        type:Number,required:false,
      },
      timestamp: { type: Date, default: Date.now }
    }],
    default: []
  }
});

const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema);

module.exports = ChatRoom;
