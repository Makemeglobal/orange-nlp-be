// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const authController = require("../controller/authController");
const upload = require("../middleware/multerConfig");
const { authMiddleware } = require("../middleware/auth");
const Feedback = require("../model/Feedback");
const nodemailer = require("nodemailer");
const projectController = require("../controller/ProjectController");
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const bodyParser = require("body-parser");
const User = require("../model/User");
const Project = require("../model/Project");
const mongoose = require('mongoose')
const ChatRoom = require('../model/Chatroom')
const {
  createTranscription,
  getTranscription,
  getTranscriptionsByUser,
  updateTranscription,
  deleteTranscription,
  createNote,
  getAllNotes,
  updateNote,
  deleteNote,
} = require("../controller/TranscriptionController");
const multer = require("multer");
const chatRoomController = require("../controller/chatRoomController");
const storage = multer.memoryStorage();
const uploadAudio = multer({ storage: storage });

router.post("/signup", authController.signup);
router.post("/google-signup", authController.googleSignup);

router.post("/users/sub-users", authController.getSubUsersById);
/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify OTP and create user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *               - fullName
 *               - companyName
 *               - phone
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *               fullName:
 *                 type: string
 *               companyName:
 *                 type: string
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Invalid input
 */
router.post("/verify-otp", authController.verifyOtpAndCreateUser);

router.get("/feedback", async (req, res) => {
  try {
    const feedbacks = await Feedback.find();
    res.status(200).json(feedbacks);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve feedback" });
  }
});

router.get("/get-users", async (req, res) => {
  try {
    // const emails = ['harshvchawla998@gmail.com' , 'forbgmi2307@gmail.com' , 'harshvchawla996@gmail.com'];
    // emails.forEach((user) =>{
    //     User.deleteOne({email:user}).then(()=>{
    //         console.log('deleted')
    //     }).catch((err)=>{
    //         console.log(err)
    //     });
    // })
    const users = await User.find();
    users.forEach(async (user) => {
      await User.findByIdAndUpdate(user._id, {
        userType: "user",
      });
      // console.log('hi')
    });
    return res.send(users);
  } catch (err) {
    console.log(err);
    return res.send(err);
  }
});
router.post("/feedback", async (req, res) => {
  const { name, email, message, prompt, reason, category } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const newFeedback = new Feedback({
      name,
      email,
      message,
      prompt,
      reason,
      category,
    });
    await newFeedback.save();
    res.status(201).json(newFeedback);
  } catch (err) {
    res.status(500).json({ error: "Failed to save feedback" });
  }
});
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User logged in successfully
 *       400:
 *         description: Invalid input
 */
router.post("/login", authController.login);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request a password reset
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset email sent
 *       400:
 *         description: Invalid input
 */
router.post("/forgot-password", authController.forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid input
 */
router.post("/reset-password", authController.resetPassword);

/**
 * @swagger
 * /api/auth/invite-sub-user:
 *   post:
 *     summary: Invite a sub-user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Invitation sent
 *       400:
 *         description: Invalid input
 */
router.post("/invite-sub-user", authController.inviteSubUser);

router.post("/invite-user", async (req, res) => {
  console.log("hi");
  try {
    const { email, roomId } = req.body;
    console.log(email);
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const invitationLink = `https://jot-ai.vercel.app/record?roomId=${roomId}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Invitation to Join as Sub-user",
      text: `you have been invited to join a meeting. Click the link to accept the invitation: ${invitationLink}`,
    });

    return res.send("invite sent");
  } catch (err) {
    console.log(err);
  }
});
/**
 * @swagger
 * /api/auth/accept-invitation:
 *   post:
 *     summary: Accept invitation and create sub-user
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: Invitation token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - companyName
 *               - phone
 *               - password
 *             properties:
 *               fullName:
 *                 type: string
 *               companyName:
 *                 type: string
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Sub-user created successfully
 *       400:
 *         description: Invalid input
 */
router.get("/accept-invitation", authController.acceptInvitation);

/**
 * @swagger
 * /api/auth/delete-sub-user:
 *   delete:
 *     summary: Delete a sub-user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subUserId
 *             properties:
 *               subUserId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sub-user deleted successfully
 *       400:
 *         description: Invalid input
 */
router.delete("/delete-sub-user", authController.deleteSubUser);
router.put("/update-profile", authMiddleware, authController.updateProfile);
router.get("/get-profile", authMiddleware, authController.getProfile);

router.post("/charge", async (req, res) => {
  const { amount, currency, source } = req.body;

  try {
    const charge = await stripe.charges.create({
      amount,
      currency,
      source,
      description: "Charge for payment",
    });
    res.status(200).json({ success: true, charge });
  } catch (err) {
    res.status(500).json({ error: "Failed to create charge" });
  }
});
router.post(
  "/upload-image",
  upload.single("image"),
  authController.uploadImage
);

//

router.post("/plan-add", authController.addPlan);

router.post("/create-checkout-session", authController.stripeSession);

router.post(
  "/webhook",
  bodyParser.raw({ type: "application/json" }),
  authController.stripePaymentStatus
);

router.post("/project", authMiddleware, projectController.createProject);

router.get("/projects", authMiddleware, projectController.getAllProjects);

router.get("/project/:id", authMiddleware, projectController.getProjectById);
router.get("/dashboard", authMiddleware, projectController.dashboardCount);
router.post("/search", authMiddleware, projectController.searchAll);

router.get("/analysis", authMiddleware, projectController.analysis);

router.post("/resend-otp", authController.resendOtp);

router.get(
  "/projects-by-month",
  authMiddleware,
  projectController.getProjectsByMonth
);

router.put("/project/:id", projectController.updateProject);

router.delete("/project/:id", projectController.deleteProject);

router.get("/rooms", authMiddleware, chatRoomController.getAllChatRooms);
router.get("/rooms/:id", chatRoomController.getChatRoom);
router.put("/rooms/:id", chatRoomController.updateChatRoom);
router.delete("/rooms/:id", chatRoomController.deleteChatRoom);

router.post("/rooms", chatRoomController.addMessageToChatRoom);
router.post("/rooms/notes", chatRoomController.addNoteToChatRoom);
router.get(
  "/rooms/info/:roomId",
  chatRoomController.getNotesAndMessagesByChatRoom
);

router.delete('/drop-collection/:collectionName', async (req, res) => {
  const { collectionName } = req.params;

  try {
    const result = await mongoose.connection.collection(collectionName).drop();
    res.send(`Collection ${collectionName} dropped successfully.`);
  } catch (error) {
    if (error.message === 'ns not found') {
      res.status(404).send(`Collection ${collectionName} does not exist.`);
    } else {
      res.status(500).send(`Error dropping collection: ${error.message}`);
    }
  }
});

router.get('/chatrooms-all', async (req,res) => {
  try{
    const rooms = await ChatRoom.find({});
    return res.send(rooms);
  }catch(err){
    console.log(err);
  }
})
router.post("/transcriptions", authMiddleware, createTranscription);
router.get("/transcriptions/:id", authMiddleware, getTranscription);
router.get("/transcriptions", authMiddleware, getTranscriptionsByUser);
router.put("/transcriptions/:id", authMiddleware, updateTranscription);
router.delete("/transcriptions/:id", authMiddleware, deleteTranscription);
router.post(
  "/upload-audio",
  uploadAudio.single("audio"),
  authController.uploadAudio
);

router.post("/notes", createNote);
router.get("/notes/transcription/:transcriptionId", getAllNotes);
router.put("/notes/:id", updateNote);
router.delete("/notes/:id", deleteNote);


router.get('/schema/chatroom', (req, res) => {
  try {
    // Get the schema object from the ChatRoom model
    const schema = ChatRoom.schema;

    // Convert schema to a readable format
    const schemaDefinition = schema.obj;

    // Send the schema definition as JSON response
    res.json(schemaDefinition);
  } catch (error) {
    console.error('Error fetching schema:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/rooms/:roomId/highlights', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { text, note, index } = req.body.newHighlight;
    const { message } = req.body;

    // Validate input to avoid unwanted entries
    if (!text || !note || typeof index !== 'number' || !message) {
      return res.status(400).json({ message: 'Invalid input data' });
    }

    const newNote = {
      text,
      note,
      messageIndex: index,
      message,
      timestamp: new Date(),
    };

    // Log the new note to be inserted
    console.log('New Note to be Added:', newNote);

    // Use updateOne to add the new note to the notes array
    const updateResult = await ChatRoom.updateOne(
      { roomId },
      {
        $push: {
          notes: newNote
        }
      }
    );

    console.log('Update Result:', updateResult);
    console.log('Updated Document:', await ChatRoom.findOne({ roomId }));

    if (updateResult.nModified === 0) {
      return res.status(404).json({ message: 'Room not found or note not added' });
    }

    res.status(201).json(newNote);
  } catch (error) {
    console.error('Error adding highlight:', error);
    res.status(500).json({ message: 'Error adding highlight', error });
  }
});


router.delete('/rooms/:roomId/notes/:noteId', async (req, res) => {
  try {
    const { roomId, noteId } = req.params;

    const updateResult = await ChatRoom.updateOne(
      { roomId },
      { $pull: { notes: { _id: noteId } } } 
    );

    if (updateResult.nModified === 0) {
      return res.status(404).json({ message: 'Room or Note not found' });
    }

    res.status(200).json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting note', error });
  }
});

router.get('/rooms/:roomId/notes-1', async (req, res) => {
  try {
    const { roomId } = req.params;
    const chatRoom = await mongoose.connection.db.collection('chatrooms').findOne({ roomId });

    if (!chatRoom) {
      return res.status(404).json({ error: 'Chat room not found' });
    }

    const { notes, messages } = chatRoom;

    const result = notes.map(note => {
      const messageIndex = messages.indexOf(note.message);

      // Return a new note object with the messageIndex field
      return {
        ...note,
        index: messageIndex !== -1 ? messageIndex : null // Set to null if the message is not found
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.post("/create-room", authMiddleware, chatRoomController.createChat);

module.exports = router;
