const ChatRoom = require("../model/Chatroom");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    // Joining a room
    socket.on("join-room", (roomId) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);
      socket.emit("room-joined", {
        roomId,
        message: `Successfully joined room ${roomId}`,
      });
    });

    // Leaving a room
    socket.on("leave-room", (roomId) => {
      socket.leave(roomId);
      console.log(`Socket ${socket.id} left room ${roomId}`);
    });

    // Updating a chatroom
    socket.on("update-chatroom", async (roomId, updates) => {
      try {
        const updatedChatRoom = await ChatRoom.findOneAndUpdate(
          { roomId },
          { $set: updates },
          { new: true }
        );

        if (!updatedChatRoom) {
          socket.emit("update-failed", { error: "Chat room not found" });
          return;
        }
        io.to(roomId).emit("chatroom-updated", updatedChatRoom);
      } catch (err) {
        console.error(err);
        socket.emit("update-failed", { error: "Internal server error" });
      }
    });

    // Voice broadcasting
    socket.on("voice-broadcast", (roomId, voiceData) => {
      if (!roomId || !voiceData) {
        socket.emit("broadcast-failed", { error: "Invalid data provided" });
        return;
      }

      console.log('joined broadcast');
      io.to(roomId).emit("voice-data", {
        senderId: socket.id,
        voiceData,
      });
      console.log("voice data",voiceData);

      console.log(`Voice data broadcasted to room ${roomId} by ${socket.id}`);
    });

    // Start broadcasting
    socket.on("start-broadcast", (roomId) => {
      socket.to(roomId).emit("broadcast-started", {
        senderId: socket.id,
      });
      console.log(`Broadcast started by ${socket.id} in room ${roomId}`);
    });

    // Stop broadcasting
    socket.on("stop-broadcast", (roomId) => {
      socket.to(roomId).emit("stop-broadcast", {
        senderId: socket.id,
      });
      console.log(`Broadcast stopped by ${socket.id} in room ${roomId}`);
    });

    // WebRTC Signaling
    socket.on("offer", ({ to, offer }) => {
      console.log('offerinng',to,offer)
      io.to(to).emit("offer", {
        senderId: socket.id,
        offer,
      });
      console.log(`Offer sent from ${socket.id} to ${to}`);
    });

    socket.on("answer", ({ to, answer }) => {
      io.to(to).emit("answer", {
        senderId: socket.id,
        answer,
      });
      console.log(`Answer sent from ${socket.id} to ${to}`);
    });

    socket.on("candidate", ({ to, candidate }) => {
      io.to(to).emit("candidate", {
        senderId: socket.id,
        candidate,
      });
      console.log(`Candidate sent from ${socket.id} to ${to}`);
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
};
