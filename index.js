const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const bodyParser = require("body-parser");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const ChatRoom = require("./model/Chatroom"); // Import the model
require("dotenv").config();
const cors = require("cors");
const socketHandler = require("./controller/socketHandler");
const invRoutes= require('./routes/InventoryRoutes');
const { ExpressPeerServer } = require('peer');
const authV2 =  require('./routes/auth.routes.v2')
const taskRoutes = require('./routes/task.routes')
const reviewRoutes = require('./routes/review.routes');
const contractRoutes = require('./routes/contractRoutes');
const leadRoutes = require('./routes/leadRoutes');
const meetingInventoryRoutes = require('./routes/MeetingInventoryRoutes');
const schedulingCallRoutes = require('./routes/schedulingCallRoutes');


connectDB();
const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use("/api/auth", authRoutes);
app.use('/inventory',invRoutes)
app.use('/auth/v2',authV2)
app.use('/tasks',taskRoutes);
app.use('/reviews',reviewRoutes)
app.use("/contracts", contractRoutes);
app.use("/leads",leadRoutes)
app.use('/meetings', meetingInventoryRoutes);
app.use('/scheduling-calls',schedulingCallRoutes)


const server = http.createServer(app);
const peerServer = ExpressPeerServer(server, {
  debug: true, // Enable debug logs
  path: '/myapp', // Custom path for PeerJS
});
app.use('/peerjs', peerServer);

const io = socketIo(server, {

  
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

socketHandler(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
