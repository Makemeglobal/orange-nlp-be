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
  getFilteredInventories,
  addMeetingCreate,
} = require("../controller/MeetingInventoryController");
const MeetingInventory = require("../model/MeetingInventory");
const Inventory = require("../model/Inventory");
const { default: mongoose } = require("mongoose");

const router = express.Router();

// Basic CRUD routes
router.post("/", authMiddleware, addMeeting);
router.post("/create", authMiddleware, addMeetingCreate);
router.get("/all", authMiddleware, getAllMeetings);
router.get("/", authMiddleware, getMeetings);
router.get("/:id", authMiddleware, getMeetingById);
router.put("/:id", authMiddleware, updateMeeting);
router.put("/aprv/:id", authMiddleware, approveMeeting);
router.put("/complete/:id", authMiddleware, completeMeeting);
router.delete("/:id", authMiddleware, deleteMeeting);
router.get("/list/data", authMiddleware, getFilteredInventories);
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

    console.log(
      "Final meeting object before save:",
      JSON.stringify(meeting, null, 2)
    );

    await meeting.save();
    res.status(200).json({ message: "Quantity updated successfully", meeting });
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

router.post("/add-inventory/:meetingId/:inventoryId", async (req, res) => {
  try {
    const { meetingId, inventoryId } = req.params;

    // Find MeetingInventory by ID
    const meetingInventory = await MeetingInventory.findById(meetingId);
    if (!meetingInventory) {
      return res.status(404).json({ message: "MeetingInventory not found" });
    }

    const inventoryDetails = await Inventory.findById(inventoryId).populate(
      "brand category"
    );
    // Check if inventory item already exists
    const isAlreadyAdded =
      Array.isArray(meetingInventory?.inventory) &&
      meetingInventory.inventory.some(
        (item) => item?.inventory_url?.toString() === inventoryId
      );

    if (isAlreadyAdded) {
      return res.status(400).json({ message: "Inventory item already added" });
    }

    // Push the new inventory item
    meetingInventory.inventory.push({
      inventory_url: inventoryId,
      isAvailable: true,
      quantity: 1,
      brand: inventoryDetails.brand.brandName,
      category: inventoryDetails.category.categoryName,
      itemName: inventoryDetails.itemName,
    });

    // Save updated meeting inventory
    await meetingInventory.save();

    res
      .status(200)
      .json({
        message: "Inventory added successfully",
        data: meetingInventory,
      });
  } catch (error) {
    console.error("Error adding inventory:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.put("/update/:meetingInventoryId", async (req, res) => {
  try {
    const { meetingInventoryId } = req.params;
    const updateData = req.body;

    // Ensure there's at least one field to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No fields provided for update" });
    }

    const updatedMeeting = await MeetingInventory.findByIdAndUpdate(
      meetingInventoryId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedMeeting) {
      return res.status(404).json({ message: "Meeting Inventory not found" });
    }

    res
      .status(200)
      .json({ message: "Meeting Inventory updated", data: updatedMeeting });
  } catch (error) {
    console.error("Error updating Meeting Inventory:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post(
  "/:meetingId/inventory/:inventoryId/suggestions",
  async (req, res) => {
    try {
      const { suggestionId, note } = req.body; // Inventory ID of the suggestion & optional note

      if (!mongoose.Types.ObjectId.isValid(suggestionId)) {
        return res.status(400).json({ message: "Invalid suggestion ID" });
      }

      const meeting = await MeetingInventory.findById(req.params.meetingId);
      if (!meeting) {
        return res.status(404).json({ message: "MeetingInventory not found" });
      }

      console.log(
        "Meeting ID:",
        req.params.meetingId,
        "Inventory ID:",
        req.params.inventoryId,
        "Suggestion ID:",
        suggestionId
      );

      // Find the inventory item inside the inventory array
      const inventoryItem = meeting.inventory.find(
        (item) => item.inventory_url.toString() === req.params.inventoryId
      );

      if (!inventoryItem) {
        return res
          .status(404)
          .json({ message: "Inventory item not found in this meeting" });
      }

      // Ensure suggestions array exists
      if (!inventoryItem.suggestions) {
        inventoryItem.suggestions = [];
      }

      // Check if the suggestion already exists
      const existingSuggestion = inventoryItem.suggestions.find(
        (sugg) => sugg.suggestionId.toString() === suggestionId
      );

      if (existingSuggestion) {
        return res.status(400).json({ message: "Suggestion already exists" });
      }

      // Add the new suggestion with note
      inventoryItem.suggestions.push({ suggestionId, notes: note || "" });

      // Mark the inventory field as modified
      meeting.markModified("inventory");

      // Save the document
      await meeting.save();

      res
        .status(200)
        .json({ message: "Suggestion added successfully", meeting });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  }
);


router.delete(
  "/:meetingId/inventory/:inventoryId/suggestions/:suggestionId",
  async (req, res) => {
    try {
      const meeting = await MeetingInventory.findById(req.params.meetingId);
      if (!meeting) {
        return res.status(404).json({ message: "MeetingInventory not found" });
      }

      // Find the inventory item inside the inventory array
      const inventoryItem = meeting.inventory.find(
        (item) => item.inventory_url.toString() === req.params.inventoryId
      );
      if (!inventoryItem) {
        return res
          .status(404)
          .json({ message: "Inventory item not found in this meeting" });
      }

      // Remove suggestion if exists
      inventoryItem.suggestions = inventoryItem.suggestions.filter(
        (id) => id.toString() !== req.params.suggestionId
      );

      await meeting.save();

      res
        .status(200)
        .json({ message: "Suggestion removed successfully", meeting });
    } catch (error) {
      console.log(error),
        "err",
        res.status(500).json({ message: "Server Error", error: error.message });
    }
  }
);

module.exports = router;
