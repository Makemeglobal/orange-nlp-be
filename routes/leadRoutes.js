const express = require("express");
const Lead = require("../model/Lead");
const { authMiddleware } = require("../middleware/auth");
const router = express.Router();

// Create a Lead
router.post("/", authMiddleware, async (req, res) => {
  try {
    req.body.user= req.user;
    const lead = new Lead(req.body);
    await lead.save();
    res.status(201).json(lead);
  } catch (err) {
    console.log("err",err)
    res.status(400).json({ error: err.message });
  }
});

// Get all Leads
router.get("/", authMiddleware , async (req, res) => {
  try {
    const leads = await Lead.find({user:req.user});
    res.json(leads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single Lead by ID
router.get("/:id", async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: "Lead not found" });
    res.json(lead);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a Lead by ID
router.put("/:id", async (req, res) => {
  try {
    req.body.lastUpdated= new Date();
    const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!lead) return res.status(404).json({ message: "Lead not found" });
    res.json(lead);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a Lead by ID
router.delete("/:id", async (req, res) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) return res.status(404).json({ message: "Lead not found" });
    res.json({ message: "Lead deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
