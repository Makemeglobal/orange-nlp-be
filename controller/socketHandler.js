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

    socket.on('voice-data', (data) => {
      // Broadcast to all users except the sender
      console.log('data',data);
      socket.broadcast.emit('voice-data', data);
    });
    // Handle disconnection
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
};
