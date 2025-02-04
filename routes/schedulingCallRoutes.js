const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const { 
    addSchedulingCall, 
    getSchedulingCalls, 
    getSchedulingCallById, 
    updateSchedulingCall, 
    deleteSchedulingCall,
    getAllSchedulingCalls 
} = require("../controller/SchedulingCallController");

const router = express.Router();

// Basic CRUD routes
router.post('/', authMiddleware, addSchedulingCall);
router.get('/all', authMiddleware, getAllSchedulingCalls);
router.get('/', authMiddleware, getSchedulingCalls);
router.get('/:id', authMiddleware, getSchedulingCallById);
router.put('/:id', authMiddleware, updateSchedulingCall);
router.delete('/:id', authMiddleware, deleteSchedulingCall);

module.exports = router;
