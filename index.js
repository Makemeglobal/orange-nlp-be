const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const bodyParser = require("body-parser");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
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

const chatRooms = new Map();

app.post("/api/create-room", (req, res) => {
  const roomId = uuidv4();
  chatRooms.set(roomId, []);
  const inviteLink = `${req.protocol}://${req.get('host')}/join/${roomId}`;
  res.json({ roomId, inviteLink });
});

app.get("/join/:roomId", (req, res) => {
  const { roomId } = req.params;
  if (chatRooms.has(roomId)) {
    res.json({ roomId, message: "Room found, you can join via Socket.IO." });
  } else {
    res.status(404).json({ message: "Room not found" });
  }
});

io.on("connection", (socket) => {
  socket.on("joinRoom", ({ roomId, username }) => {
    if (chatRooms.has(roomId)) {
      socket.join(roomId);
      chatRooms.get(roomId).push({ username, socketId: socket.id });
      io.to(roomId).emit("user-connected", { username, socketId: socket.id });

      socket.on("disconnect", () => {
        chatRooms.get(roomId).forEach((user, index) => {
          if (user.socketId === socket.id) {
            chatRooms.get(roomId).splice(index, 1);
            io.to(roomId).emit("user-disconnected", { username });
          }
        });
      });
    } else {
      socket.emit("error", "Room not found");
    }
  });

  socket.on("signal", ({ roomId, signal, to }) => {
    io.to(to).emit("signal", { signal, from: socket.id });
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
