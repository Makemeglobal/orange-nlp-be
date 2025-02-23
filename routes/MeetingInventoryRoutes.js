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

    // Find the latest version of the meeting
    const latestMeeting = await MeetingInventory.findById(meetingId);
    if (!latestMeeting) {
      return res.status(404).json({ message: "MeetingInventory not found" });
    }

    // Find inventory details
    const inventoryDetails = await Inventory.findById(inventoryId).populate(
      "brand category"
    );

    // Check if inventory is already present
    const isAlreadyAdded = latestMeeting.inventory.some(
      (item) => item.inventory_url.toString() === inventoryId
    );

    if (isAlreadyAdded) {
      return res.status(400).json({ message: "Inventory item already added" });
    }

    // Create a new version with copied data
    const newVersion = new MeetingInventory({
      ...latestMeeting.toObject(), // Copy all fields
      _id: undefined, // Remove _id so MongoDB generates a new one
      version: latestMeeting.version + 1,
      lastUpdated: new Date(), // Increment version
      inventory: [
        ...latestMeeting.inventory,
        {
          inventory_url: inventoryId,
          isAvailable: true,
          quantity: 1,
          brand: inventoryDetails.brand.brandName,
          category: inventoryDetails.category.categoryName,
          itemName: inventoryDetails.itemName,
        },
      ],
      meetingGroupId:
        latestMeeting.meetingGroupId || latestMeeting._id.toString(), // Keep group ID consistent
    });

    await newVersion.save();

    res.status(201).json({
      message: "New version created with added inventory",
      data: newVersion,
    });
  } catch (error) {
    console.error("Error creating new version:", error);
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

      // Find the latest version of the meeting
      const latestMeeting = await MeetingInventory.findOne({
        meetingGroupId: req.params.meetingId,
      }).sort({ version: -1 });

      if (!latestMeeting) {
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

      // Find the inventory item in the latest meeting's inventory
      const inventoryItem = latestMeeting.inventory.find(
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

      // Add the new suggestion
      inventoryItem.suggestions.push({ suggestionId, notes: note || "" });

      // Create a new version of the meeting with updated data
      const newVersion = new MeetingInventory({
        ...latestMeeting.toObject(), // Copy previous meeting data
        _id: new mongoose.Types.ObjectId(), // Generate a new ID
        version: latestMeeting.version + 1, // Increment version
        lastUpdated: new Date(), // Update timestamp
        inventory: latestMeeting.inventory, // Copy inventory with updated suggestion
      });

      await newVersion.save();

      res.status(200).json({
        message: "Suggestion added successfully",
        meeting: newVersion,
      });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  }
);

router.post("/:meetingId/inventory/:inventoryId/notes", async (req, res) => {
  try {
    const { note } = req.body; // Note text
    const { meetingId, inventoryId } = req.params;

    if (!note) {
      return res.status(400).json({ message: "Note cannot be empty" });
    }

    // Find the latest version of the meeting
    const latestMeeting = await MeetingInventory.findOne({
      meetingGroupId: meetingId,
    }).sort({ version: -1 });

    if (!latestMeeting) {
      return res.status(404).json({ message: "MeetingInventory not found" });
    }

    // Find the inventory item
    const inventoryItem = latestMeeting.inventory.find(
      (item) => item.inventory_url.toString() === inventoryId
    );

    if (!inventoryItem) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    // Add the new note
    // Ensure notes array exists before pushing
    if (!inventoryItem.notes) {
      inventoryItem.notes = [];
    }

    inventoryItem.notes.push({ text: note });

    // Create a new version of the meeting with updated data
    const newVersion = new MeetingInventory({
      ...latestMeeting.toObject(), // Copy previous meeting data
      _id: new mongoose.Types.ObjectId(), // Generate a new ID
      version: latestMeeting.version + 1, // Increment version
      lastUpdated: new Date(), // Update timestamp
      inventory: latestMeeting.inventory, // Copy inventory with updated notes
    });

    await newVersion.save();

    res.status(200).json({
      message: "Note added successfully",
      meeting: newVersion,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

router.delete(
  "/:meetingId/inventory/:inventoryId/suggestions/:suggestionId",
  async (req, res) => {
    try {
      // Find the latest version of the meeting
      const latestMeeting = await MeetingInventory.findOne({
        meetingGroupId: req.params.meetingId,
      }).sort({ version: -1 });

      if (!latestMeeting) {
        return res.status(404).json({ message: "MeetingInventory not found" });
      }

      // Find the inventory item inside the inventory array
      const inventoryItem = latestMeeting.inventory.find(
        (item) => item.inventory_url.toString() === req.params.inventoryId
      );

      if (!inventoryItem) {
        return res
          .status(404)
          .json({ message: "Inventory item not found in this meeting" });
      }

      // Remove the suggestion if it exists
      const updatedSuggestions = inventoryItem.suggestions.filter(
        (sugg) => sugg.suggestionId.toString() !== req.params.suggestionId
      );

      if (updatedSuggestions.length === inventoryItem.suggestions.length) {
        return res
          .status(404)
          .json({ message: "Suggestion not found in this inventory" });
      }

      // Update the inventory item suggestions
      inventoryItem.suggestions = updatedSuggestions;

      // Create a new version of the meeting with updated data
      const newVersion = new MeetingInventory({
        ...latestMeeting.toObject(), // Copy previous meeting data
        _id: new mongoose.Types.ObjectId(), // Generate a new ID
        version: latestMeeting.version + 1, // Increment version
        lastUpdated: new Date(), // Update timestamp
        inventory: latestMeeting.inventory, // Keep inventory with updated suggestions
      });

      await newVersion.save();

      res.status(200).json({
        message: "Suggestion removed successfully",
        meeting: newVersion,
      });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  }
);

router.delete("/remove-inventory/:meetingId/:inventoryId", async (req, res) => {
  try {
    const { meetingId, inventoryId } = req.params;

    // Find the latest version of the meeting inventory
    const latestMeeting = await MeetingInventory.findOne({
      meetingGroupId: meetingId,
    }).sort({ version: -1 });

    if (!latestMeeting) {
      return res.status(404).json({ message: "MeetingInventory not found" });
    }

    // Check if inventory item exists in the meetingInventory
    const inventoryIndex = latestMeeting.inventory.findIndex(
      (item) => item?.inventory_url?.toString() === inventoryId
    );

    if (inventoryIndex === -1) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    // Remove the inventory item
    const updatedInventory = [...latestMeeting.inventory];
    updatedInventory.splice(inventoryIndex, 1);

    // Create a new version of the meeting inventory
    const newVersion = new MeetingInventory({
      ...latestMeeting.toObject(), // Copy previous meeting data
      _id: new mongoose.Types.ObjectId(), // Generate a new ID
      version: latestMeeting.version + 1, // Increment version
      lastUpdated: new Date(), // Update timestamp
      inventory: updatedInventory, // Use updated inventory without removed item
    });

    await newVersion.save();

    res.status(200).json({
      message: "Inventory removed successfully",
      data: newVersion,
    });
  } catch (error) {
    console.error("Error removing inventory:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/meeting-versions/:meetingId", async (req, res) => {
  try {
    const { meetingId } = req.params;

    // Find the latest version of this meeting
    const meeting = await MeetingInventory.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    // Count all versions under the same `meetingGroupId`
    const totalVersions = await MeetingInventory.countDocuments({
      meetingGroupId: { $exists: true, $eq: meeting.meetingGroupId },
    });

    res.status(200).json({
      meetingGroupId: meeting.meetingGroupId,
      totalVersions,
      lastUpdated: meeting.lastUpdated,
    });
  } catch (error) {
    console.error("Error fetching meeting versions:", error);
    res.status(500).json({ message: "Error fetching meeting versions", error });
  }
});


router.delete("/:meetingId/inventory/:inventoryId/notes", async (req, res) => {
  try {
    const { note } = req.body; // Get note text from request body

    if (!note || note.trim() === "") {
      return res.status(400).json({ message: "Note cannot be empty" });
    }

    // Find the latest version of the meeting
    const latestMeeting = await MeetingInventory.findOne({
      meetingGroupId: req.params.meetingId,
    }).sort({ version: -1 });

    if (!latestMeeting) {
      return res.status(404).json({ message: "MeetingInventory not found" });
    }

    // Find the inventory item in the latest meeting's inventory
    const inventoryItem = latestMeeting.inventory.find(
      (item) => item.inventory_url.toString() === req.params.inventoryId
    );

    if (!inventoryItem) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    // Ensure notes exist
    if (!inventoryItem.notes) {
      return res.status(400).json({ message: "No notes found" });
    }

    // Remove note by matching text
    const updatedNotes = inventoryItem.notes.filter((n) => n.text !== note);

    if (updatedNotes.length === inventoryItem.notes.length) {
      return res.status(404).json({ message: "Note not found" });
    }

    inventoryItem.notes = updatedNotes;

    // Create a new version of the meeting with updated data
    const newVersion = new MeetingInventory({
      ...latestMeeting.toObject(), // Copy previous meeting data
      _id: new mongoose.Types.ObjectId(), // Generate a new ID
      version: latestMeeting.version + 1, // Increment version
      lastUpdated: new Date(), // Update timestamp
      inventory: latestMeeting.inventory, // Copy inventory with updated notes
    });

    await newVersion.save();

    res.status(200).json({ message: "Note deleted successfully", meeting: newVersion });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});


module.exports = router;
