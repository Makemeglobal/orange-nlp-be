const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const {
  addMeeting,
  getMeetings,
  getMeetingById,
  updateMeeting,
  deleteMeeting,
  getAllMeetings,
  approveMeeting,
  completeMeeting,
  getFilteredInventories
} = require("../controller/MeetingInventoryController");
const MeetingInventory = require("../model/MeetingInventory");

const router = express.Router();

// Basic CRUD routes
router.post("/", authMiddleware, addMeeting);
router.get("/all", authMiddleware, getAllMeetings);
router.get("/", authMiddleware, getMeetings);
router.get("/:id", authMiddleware, getMeetingById);
router.put("/:id", authMiddleware, updateMeeting);
router.put("/aprv/:id", authMiddleware, approveMeeting);
router.put("/complete/:id", authMiddleware, completeMeeting);
router.delete("/:id", authMiddleware, deleteMeeting);
router.get('/list/data',authMiddleware,getFilteredInventories)
router.put("/:meetingId/inventory/:inventoryId", async (req, res) => {
    try {
      const { meetingId, inventoryId } = req.params;
      let { quantity } = req.body;
  
      const parsedQuantity = parseInt(quantity, 10);
      if (isNaN(parsedQuantity)) {
        return res.status(400).json({ message: "Quantity must be a number" });
      }
  
      const meeting = await MeetingInventory.findById(meetingId);
      if (!meeting) {
        return res.status(404).json({ message: "Meeting not found" });
      }
  
      let inventoryItem = meeting.inventory.find(
        (item) => item.inventory_url.toString() === inventoryId
      );
  
      if (!inventoryItem) {
        return res.status(404).json({ message: "Inventory item not found" });
      }
  
      inventoryItem.quantity = parsedQuantity;
      meeting.markModified("inventory"); // 🔥 Ensure MongoDB detects the update
  
      console.log("Final meeting object before save:", JSON.stringify(meeting, null, 2));
  
      await meeting.save();
      res.status(200).json({ message: "Quantity updated successfully", meeting });
    } catch (error) {
      console.error("Server Error:", error);
      res.status(500).json({ message: "Server error", error });
    }
  });
  

module.exports = router;
