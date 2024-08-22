const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const bodyParser = require("body-parser");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const ChatRoom = require("./model/Chatroom"); // Import the model
require("dotenv").config();
const cors = require("cors");
const { v4: uuidv4 } = require('uuid');

connectDB();
const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use("/api/auth", authRoutes);

const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.post("/api/create-room", async (req, res) => {
  const roomId = uuidv4();
  const newRoom = new ChatRoom({ roomId,messages:[] });
  await newRoom.save();

  const inviteLink = `${req.protocol}://${req.get('host')}/join/${roomId}`;
  res.json({ roomId, inviteLink });
});

app.get("/join/:roomId", async (req, res) => {
  const { roomId } = req.params;
  const room = await ChatRoom.findOne({ roomId });

  if (room) {
    res.json({ roomId, message: "Room found, you can join via Socket.IO." });
  } else {
    res.status(404).json({ message: "Room not found" });
  }
});

io.on("connection", (socket) => {
  console.log('hi');
  socket.on("joinRoom", async ({ roomId, username }) => {
    console.log('joinRoom');
    const room = await ChatRoom.findOne({ roomId });

    if (room) {
      socket.join(roomId);
      console.log('room joined')
      room.users.push({ username, socketId: socket.id });
      await room.save();
      console.log(username,socket.id)
      console.log(room)

      io.to(roomId).emit("user-connected", { username, socketId: socket.id });

      socket.on("disconnect", async () => {
        console.log('disconnecting');
        room.users = room.users.filter(user => user.socketId !== socket.id);
        await room.save();

        io.to(roomId).emit("user-disconnected", { username });
      });
    } else {
      socket.emit("error", "Room not found");
    }
  });

  // app.post('/api/create-room' , async(req,res)=>{
  //   const 
  // })
  app.post('/api/chatrooms/:roomId/messages', async (req, res) => {
    const { roomId } = req.params;
    const { message } = req.body;
  
    console.log(roomId,message)
    if (!message) {
      return res.status(400).json({ error: 'Message content is required' });
    }
  
    try {
      const chatRoom = await ChatRoom.findOneAndUpdate(
        { roomId },
        { $push: { messages: message } },
        { new: true, upsert: true }
      );
  
      res.status(200).json(chatRoom);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/chatrooms/:roomId/messages', async (req, res) => {
    const { roomId } = req.params;
  
    try {
      const chatRoom = await ChatRoom.findOne({ roomId });
  
      if (!chatRoom) {
        return res.status(404).json({ error: 'Chat room not found' });
      }
  
      res.status(200).json(chatRoom.messages);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Handle recording status
  socket.on("startRecording", (roomId) => {
    io.to(roomId).emit("recording-status", { status: "started" });
  });

  socket.on("stopRecording", (roomId) => {
    io.to(roomId).emit("recording-status", { status: "stopped" });
  });

  socket.on("signal", ({ roomId, signal, to }) => {
    io.to(to).emit("signal", { signal, from: socket.id });
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
