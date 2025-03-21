const express = require("express");
const router = express.Router();
const SubCategory = require("../model/subCategory");

// Create SubCategory
router.post("/", async (req, res) => {
  try {
    const { name, category, description } = req.body;
    const subCategory = new SubCategory({ name, category, description });
    await subCategory.save();
    res.status(201).json(subCategory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get All SubCategories
router.get("/", async (req, res) => {
    try {
      const { category } = req.query;
      let filter = {};
  
      if (category) {
        filter.category = category;
      }
  
      const subCategories = await SubCategory.find(filter);
      res.json(subCategories);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  

// Get Single SubCategory
router.get("/:id", async (req, res) => {
  try {
    const subCategory = await SubCategory.findById(req.params.id).populate("category", "name");
    if (!subCategory) return res.status(404).json({ message: "SubCategory not found" });
    res.json(subCategory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update SubCategory
router.put("/:id", async (req, res) => {
  try {
    const { name, category, description } = req.body;
    const subCategory = await SubCategory.findByIdAndUpdate(
      req.params.id,
      { name, category, description },
      { new: true }
    );
    if (!subCategory) return res.status(404).json({ message: "SubCategory not found" });
    res.json(subCategory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete SubCategory
router.delete("/:id", async (req, res) => {
  try {
    const subCategory = await SubCategory.findByIdAndDelete(req.params.id);
    if (!subCategory) return res.status(404).json({ message: "SubCategory not found" });
    res.json({ message: "SubCategory deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
