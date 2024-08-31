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
    let userId = req.user;
    console.log("userId", userId);
    try {
      const rooms = await ChatRoom.find({ user: userId });
      console.log("rooms", rooms);
      return res.status(200).send({ data: rooms });
    } catch (err) {
      return res.status(err).status(500);
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

      const room = await ChatRoom.findOne({ roomId: roomId });
      if (!room) {
        return res.send("no room found").status(404);
      }
      console.log(room);
      return res.send({ data: room }).status(200);
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

  updateChatRoom: async (req, res) => {
    try {
      const { id } = req.params;

      const { meetingTitle, meetingPurpose } = req.body;
      const updatedChatRoom = await ChatRoom.findOneAndUpdate(
        { _id: id },
        { meetingTitle, meetingPurpose },
        { new: true }
      );
      if (!updatedChatRoom) {
        return res.status(404).json({ error: "ChatRoom not found" });
      }
      res.status(200).json(updatedChatRoom);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  deleteChatRoom: async (req, res) => {
    try {
      const { id } = req.params;
      const chatRoom = await ChatRoom.findOneAndDelete({ _id: id });
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
