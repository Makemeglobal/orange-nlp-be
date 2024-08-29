const ChatRoom = require("../model/Chatroom");
const { v4: uuidv4 } = require("uuid");

const chatRoomController = {
  createChat: async (req, res) => {
    const { meetingName, meetingPurpose, participants } = req.body;
    let userId = req.user;
    const roomId = uuidv4();
    const newRoom = new ChatRoom({
      roomId,
      messages: [],
      meetingTitle: meetingName,
      meetingPurpose,
      participants,
      user: userId,
    });
    await newRoom.save();
    const inviteLink = `${req.protocol}://${req.get("host")}/join/${roomId}`;
    res.json({ roomId, inviteLink });
  },

  getChatRoom: async (req, res) => {
    try {
      const { roomId } = req.params;
      const chatRoom = await ChatRoom.findOne({ roomId });
      if (!chatRoom) {
        return res.status(404).json({ error: "ChatRoom not found" });
      }
      res.status(200).json(chatRoom);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  getAllChatRooms: async (req, res) => {
    try {
      const rooms = await ChatRoom.find({});
      if (!rooms) {
        return res.send("no rooms found").status(404);
      }
      return res.send(rooms).send(200);
    } catch (err) {
      return res.send(err).status(500);
    }
  },
  addMessageToChatRoom: async (req, res) => {
    try {
      const { roomId } = req.body;
      const { message } = req.body;

      console.log(roomId, message);

      const chatRoom = await ChatRoom.findOneAndUpdate(
        { roomId },
        { $push: { messages: message } },
        { new: true }
      );

      if (!chatRoom) {
        return res.status(404).json({ error: "ChatRoom not found" });
      }

      console.log(chatRoom);
      res.status(200).json(chatRoom);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  addNoteToChatRoom: async (req, res) => {
    try {
      const { roomId } = req.body;
      const { note } = req.body;

      const chatRoom = await ChatRoom.findOneAndUpdate(
        { roomId },
        { $push: { notes: note } },
        { new: true }
      );

      if (!chatRoom) {
        return res.status(404).json({ error: "ChatRoom not found" });
      }
      console.log(chatRoom);

      res.status(200).json(chatRoom);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  getNotesAndMessagesByChatRoom: async (req, res) => {
    try {
      const { roomId } = req.params;
      console.log(roomId);

      const room = await ChatRoom.find({ roomId: roomId });
      if (!room) {
        return res.send("no room found").status(404);
      }
      console.log(room);
      return res.send(room).status(200);
    } catch (err) {
      console.log(err);
      return res.send(err).status(500);
    }
  },

  deleteChatRoom: async (req, res) => {
    try {
      const { roomId } = req.params;

      const chatRoom = await ChatRoom.findOneAndDelete({ roomId });

      if (!chatRoom) {
        return res.status(404).json({ error: "ChatRoom not found" });
      }

      res.status(200).json({ message: "ChatRoom deleted successfully" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = chatRoomController;
