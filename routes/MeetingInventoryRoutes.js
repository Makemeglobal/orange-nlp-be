const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const { 
    addMeeting, 
    getMeetings, 
    getMeetingById, 
    updateMeeting, 
    deleteMeeting,
    getAllMeetings 
} = require("../controller/MeetingInventoryController");

const router = express.Router();

// Basic CRUD routes
router.post('/', authMiddleware, addMeeting);
router.get('/all', authMiddleware, getAllMeetings);
router.get('/', authMiddleware, getMeetings);
router.get('/:id', authMiddleware, getMeetingById);
router.put('/:id', authMiddleware, updateMeeting);
router.delete('/:id', authMiddleware, deleteMeeting);

module.exports = router;
