const express = require("express");
const http = require("http"); // Import the http module
const socketIo = require("socket.io"); // Import socket.io
const bodyParser = require("body-parser");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
require("dotenv").config();
const { swaggerUi, specs } = require("./config/swagger");

const cors = require("cors");
connectDB();
const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use("/api/auth", authRoutes);

// Create an HTTP server
const server = http.createServer(app);

// Initialize Socket.IO with the HTTP server
const io = socketIo(server, {
  cors: {
    origin: "*", // You can adjust this to restrict origins
    methods: ["GET", "POST"]
  }
});

// Socket.IO events
io.on("connection", (socket) => {
  console.log("New client connected");

  // Handling chatroom joining
  socket.on("joinRoom", (room) => {
    socket.join(room);
    console.log(`User joined room: ${room}`);
  });

  // Handling message sending
  socket.on("chatMessage", (data) => {
    const { room, message } = data;
    io.to(room).emit("message", message);
    console.log(`Message sent to room ${room}: ${message}`);
  });

  // Handling disconnection
  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

const PORT = process.env.PORT || 5000;

// Start the server with Socket.IO
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
