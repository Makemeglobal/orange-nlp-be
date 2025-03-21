const express = require("express");
const router = express.Router();
const Category = require("../model/Category");
const Inventory = require("../model/Inventory");

// Create a new category
router.post("/", async (req, res) => {
  try {
    const { categoryName, description } = req.body;
    if (!categoryName) {
      return res.status(400).json({ error: "Category name is required" });
    }
    const category = new Category({ categoryName, description });
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all categories
router.get("/", async (req, res) => {
  try {
    const categories = await Category.find().populate("subCategories"); // Populate subCategories
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/cats", async (req, res) => {
  try {
    const categories = await Category.find().populate("subCategories");

    // Fetch inventory items grouped by category and subcategory
    const inventoryItems = await Inventory.find()
      .select("_id itemName imageUrl category subCategory")
      .lean();

    const formattedCategories = categories.map((category) => ({
      id: category._id,
      name: category.categoryName,
      description: category.description,
      subcategories: category.subCategories.map((sub) => ({
        id: sub._id,
        name: sub.subCategoryName,
        description: sub.description,
        products: inventoryItems
          .filter(
            (item) =>
              item.category?.toString() === category._id.toString() &&
              item.subCategory?.toString() === sub._id.toString()
          )
          .map((item) => (item.itemName)),
      })),
    }));

    res.status(200).json(formattedCategories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get a single category by ID
router.get("/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a category by ID
router.put("/:id", async (req, res) => {
  try {
    const { categoryName, description } = req.body;
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { categoryName, description },
      { new: true, runValidators: true }
    );
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a category by ID
router.delete("/:id", async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
