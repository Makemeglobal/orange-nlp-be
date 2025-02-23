const ChatRoom = require("../model/Chatroom");
const Chat = require("../model/ChatPrivate");
const ChatPrivate = require("../model/ChatPrivate");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);


    // Joining a room
    socket.on("join-room", (roomId) => {
      console.log('room',roomId)
      if (!roomId) {
        console.log("⚠️ Room ID is missing!");
        return;
      }

      socket.join(roomId);
      console.log(`✅ Socket ${socket.id} joined room ${roomId}`);

      // Send confirmation to the client
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


    socket.on("changes-requested", (data) => {
      console.log("Changes are requested-added event:", data);
      io.to(data.meetingId).emit("changes-requested", data);
    });

    // Listen for suggestion removed event
    socket.on("client-sent", (data) => {
      console.log("Client sent:", data);
      io.to(data.meetingId).emit("client-sent", data);
    });

    socket.on("join-private-chat", async ({ userId, targetUserId }) => {
      const privateRoomId = [userId, targetUserId].sort().join("-");
      socket.join(privateRoomId);
      console.log(`Socket ${socket.id} joined private room ${privateRoomId}`);

      // Ensure chat room exists or create one
      let chatRoom = await ChatPrivate.findOne({ chatRoomId: privateRoomId });
      if (!chatRoom) {
        chatRoom = new ChatPrivate({
          chatRoomId: privateRoomId,
          participants: [userId, targetUserId],
          messages: [],
        });
        await chatRoom.save();
      }

      socket.emit("private-room-joined", {
        privateRoomId,
        message: `Successfully joined private chat with ${targetUserId}`,
      });
    });

    // Sending and Saving a Private Message
    socket.on("private-message", async ({ senderId, receiverId, message, messageType, attachments,roomId }) => {
      const privateRoomId = [senderId, receiverId].sort().join("-");

      try {
        // Find the chat room and update messages
        const chatRoom = await ChatPrivate.findOneAndUpdate(
          { chatRoomId: roomId },
          {
            $push: {
              messages: {
                senderId,
                message,
                messageType: messageType || "text",
                attachments,
                timestamp: new Date(),
                status: "sent",
              },
            },
            $set: {
              lastMessage: {
                message,
                senderId,
                timestamp: new Date(),
              },
            },
          },
          { new: true, upsert: true }
        );

        // Emit the message to both users in the chat room
        io.to(roomId).emit("private-message", {
          senderId,
          receiverId,
          message,
          roomId,
          messageType,
          attachments,
          timestamp: new Date(),
          status: "sent",
        });

        console.log(`Private message from ${senderId} to ${receiverId}: ${message}`);
      } catch (err) {
        console.error("Error saving private message:", err);
      }
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
