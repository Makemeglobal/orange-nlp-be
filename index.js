const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const bodyParser = require("body-parser");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const ChatRoom = require("./model/Chatroom"); // Import the model
require("dotenv").config();
const cors = require("cors");

connectDB();
const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use("/api/auth", authRoutes);

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// API to create a new chat room

// API to join an existing chat room
app.get("/join/:roomId", async (req, res) => {
  const { roomId } = req.params;
  const room = await ChatRoom.findOne({ roomId });

  if (room) {
    res.json({ roomId, message: "Room found, you can join via Socket.IO." });
  } else {
    res.status(404).json({ message: "Room not found" });
  }
});

// API to send messages
app.post("/api/chatrooms/:roomId/messages", async (req, res) => {
  const { roomId } = req.params;
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message content is required" });
  }

  try {
    const chatRoom = await ChatRoom.findOneAndUpdate(
      { roomId },
      { $push: { messages: message } },
      { new: true, upsert: true }
    );

    io.to(roomId).emit("new-message", message);

    res.status(200).json(chatRoom);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// API to fetch messages
app.get("/api/chatrooms/:roomId/messages", async (req, res) => {
  const { roomId } = req.params;

  try {
    const chatRoom = await ChatRoom.findOne({ roomId });

    if (!chatRoom) {
      return res.status(404).json({ error: "Chat room not found" });
    }

    res.status(200).json(chatRoom.messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// WebSocket connection
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // const room = io.sockets.adapter.rooms;
  // console.log(r/oom.get('jZhGd1ceu1jwbywSAAAB'))

  socket.on("join-room", (roomId) => {
    console.log(roomId);
    socket.join(roomId);
    const room = io.sockets.adapter.rooms.get(roomId);
    console.log(room);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
    socket.emit("room-joined", {
      roomId,
      message: `Successfully joined room ${roomId}`,
    });
  });

  socket.on("leave-room", (roomId) => {
    socket.leave(roomId);
    console.log(`Socket ${socket.id} left room ${roomId}`);
  });

  // Handle receiving transcripts and broadcasting to the room
  socket.on("send_transcript", ({ roomId, transcript }) => {
    console.log(transcript);
    io.to(roomId).emit("receive_transcript", transcript);
    console.log(`Transcript sent to room ${roomId}: ${transcript}`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
