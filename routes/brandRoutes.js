const express = require("express");
const router = express.Router();
const Brand = require("../model/Brand");

// Create a new brand
router.post("/", async (req, res) => {
  try {
    const { brandName, description } = req.body;
    if (!brandName) {
      return res.status(400).json({ error: "Brand name is required" });
    }
    const brand = new Brand({ brandName, description });
    await brand.save();
    res.status(201).json(brand);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all brands
router.get("/", async (req, res) => {
  try {
    const brands = await Brand.find();
    res.status(200).json(brands);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single brand by ID
router.get("/:id", async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({ error: "Brand not found" });
    }
    res.status(200).json(brand);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a brand by ID
router.put("/:id", async (req, res) => {
  try {
    const { brandName, description } = req.body;
    const brand = await Brand.findByIdAndUpdate(
      req.params.id,
      { brandName, description },
      { new: true, runValidators: true }
    );
    if (!brand) {
      return res.status(404).json({ error: "Brand not found" });
    }
    res.status(200).json(brand);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a brand by ID
router.delete("/:id", async (req, res) => {
  try {
    const brand = await Brand.findByIdAndDelete(req.params.id);
    if (!brand) {
      return res.status(404).json({ error: "Brand not found" });
    }
    res.status(200).json({ message: "Brand deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
