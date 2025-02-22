const MeetingInventory = require("../model/MeetingInventory");
const { User } = require("../model/User");

exports.addMeeting = async (req, res) => {
  try {
    const {
      projectName,
      personName,
      end,
      phone,
      url,
      location,
      inventory,
      subtitle,
      inventory_url,
      email,
    } = req.body;
    console.log("inv", inventory);
    const meeting = await MeetingInventory.create({
      project_Name: projectName,
      person_Name: personName,
      end,
      phone,
      url,
      email: req.user,
      location,
      email_id: email,
      inventory_url,
      user: req.user,
      inventory,
      subtitle,
    });
    res.status(201).json(meeting);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding meeting", error });
  }
};

exports.addMeetingCreate = async (req, res) => {
  try {
    const {
      project_Name,
      person_Name,
      end,
      phone,
      url,
      location,
      inventory,
      subtitle,
      inventory_url,
      email,
    } = req.body;
    console.log("inv", inventory);
    const meeting = await MeetingInventory.create({
      project_Name,
      person_Name,
      end,
      phone,
      url,
      email: req.user,
      location,
      email_id: email,
      inventory_url,
      user: req.user,
      inventory,
      subtitle,
    });
    res.status(201).json(meeting);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding meeting", error });
  }
};

exports.getMeetings = async (req, res) => {
  try {
    const { endDate } = req.query;
    const filter = {
      email: req.user._id,
    };

    if (endDate) {
      filter.end = { $lte: new Date(endDate) };
    }

    const meetings = await MeetingInventory.find(filter);
    res.status(200).json(meetings);
  } catch (error) {
    res.status(500).json({ message: "Error fetching meetings", error });
  }
};

exports.getMeetingById = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the meeting and populate inventory, suggestions, and user
    const meeting = await MeetingInventory.findById(id)
      .populate({
        path: "inventory.inventory_url",
        model: "Inventory",
        populate: [
          { path: "brand", model: "Brand" }, // Populate brand
          { path: "category", model: "Category" }, // Populate category
        ],
      })
      .populate({
        path: "inventory.suggestions.suggestionId", // Populate suggestion details
        model: "Inventory",
        populate: [
            { path: "brand", model: "Brand" },       // Populate brand for suggestions
            { path: "category", model: "Category" }  // Populate category for suggestions
        ]
    })
      .populate({
        path: "user",
        model: "User",
      });

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    // Convert the meeting to a plain object
    const meetingObject = meeting.toObject();

    // Filter out inventory items where `isAvailable` is `true`
    meetingObject.inventory = meetingObject.inventory.filter(
      (item) => item.isAvailable == true
    );

    // Keep the user data
    const user = meetingObject.user || null;

    // Send the response with the filtered inventory and user
    res.status(200).json({ ...meetingObject, user });
  } catch (error) {
    console.log("err", error);
    res.status(500).json({ message: "Error fetching meeting", error });
  }
};

exports.updateMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedMeeting = await MeetingInventory.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedMeeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    res.status(200).json(updatedMeeting);
  } catch (error) {
    res.status(500).json({ message: "Error updating meeting", error });
  }
};

exports.deleteMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedMeeting = await MeetingInventory.findByIdAndDelete(id);

    if (!deletedMeeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    res.status(200).json({ message: "Meeting deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting meeting", error });
  }
};

exports.getAllMeetings = async (req, res) => {
  try {
    const usr = await User.findOne({ _id: req.user });
    const meetings = await MeetingInventory.find({
      $or: [{ email_id: usr.email, isApproved: true }, { user: req.user }],
    });

    res.status(200).json(meetings);
  } catch (error) {
    res.status(500).json({ message: "Error fetching all meetings", error });
  }
};

exports.approveMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const meeting = await MeetingInventory.findByIdAndUpdate(
      id,
      { $set: { isApproved: true } }, // Set isApproved to true
      { new: true } // Return the updated document
    );

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    res.status(200).json({ message: "Meeting approved successfully", meeting });
  } catch (error) {
    res.status(500).json({ message: "Error approving meeting", error });
  }
};

exports.completeMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const meeting = await MeetingInventory.findByIdAndUpdate(
      id,
      { $set: { status: "completed" } }, // Set isApproved to true
      { new: true } // Return the updated document
    );

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    res.status(200).json({ message: "Meeting approved successfully", meeting });
  } catch (error) {
    res.status(500).json({ message: "Error approving meeting", error });
  }
};

exports.getFilteredInventories = async (req, res) => {
  try {
    const userId = req.user; // Extract user ID from request

    const inventories = await MeetingInventory.find({ user: userId })
      .select("_id project_Name person_Name") // Select only the required fields
      .lean(); // Convert Mongoose documents to plain objects

    return res.status(200).json({ success: true, data: inventories });
  } catch (error) {
    console.error("Error fetching inventories:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};
