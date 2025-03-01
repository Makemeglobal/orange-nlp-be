const express = require("express");
const mongoose = require("mongoose");
const Inventory = require("../model/Inventory"); // Adjust path if necessary

const Brand = require("../model/Brand");
const Category = require("../model/Category");
// Create a new Inventory
exports.createInventory = async (req, res) => {
  try {
    const {
      brand,
      category,
      itemName,
      description,
      price,
      quantity,
      image,
      currentStockStatus,
    } = req.body;
    console.log("req,file", req.user);

    const newInventory = new Inventory({
      brand,
      category,
      itemName,
      description,
      quantity,
      user: req.user,
      imageUrl: image,
      price,

      currentStockStatus,
    });

    const savedInventory = await newInventory.save();
    res.status(201).json(savedInventory);
  } catch (err) {
    console.log("err", err);
    res.status(400).json({ error: err.message });
  }
};

exports.getAllInventorys = async (req, res) => {
  try {
    const { filter, sortBy, isUser, contractor } = req.query;

    // Determine user filter condition
    let userFilter = isUser === "true" ? contractor : req.user;

    // Base query excluding soft-deleted items and filtering by user
    let query = { is_deleted: false };

// Check if the query param 'isUserSpecific' is 'true'
if (req.query.isUserSpecific == 'true') {
  // Set query.user to req.user
  query.user = req.user;
}

// Now, query will have user if the condition is met
console.log(query);
    

    // Apply filtering conditions
    if (filter === "in-stock") query.currentStockStatus = true;
    if (filter === "out-of-stock") query.currentStockStatus = false;

    // Determine sorting order
    let sortOptions = { createdAt: -1 }; // Default: Newest first
    if (sortBy === "quantity") sortOptions = { quantity: -1 };
    if (sortBy === "last-updated") sortOptions = { updatedAt: -1 };
    if (sortBy === "old-to-new") sortOptions = { createdAt: 1 };

    // Fetch and format inventory items
    const inventoryItems = await Inventory.find(query)
      .populate("brand category user")
    
      .sort(sortOptions);

    const formattedItems = inventoryItems.map((item) => ({
      id: item._id,
      productId: item.productId,
      itemName: item.itemName,
      description: item.description,
      img: item.imageUrl || "/images/default-image.svg",
      brand: item.brand?.brandName || "Unknown Brand",
      category: item.category?.categoryName || "Unknown Category",
      quantity: item.quantity,
      price: item.price,
      addedOn: item.createdAt ? item.createdAt.toLocaleDateString() : "N/A",
      lastUpdated: item.updatedAt ? item.updatedAt.toLocaleDateString() : "N/A",
      inStock: item.currentStockStatus,
    }));

    res.status(200).json(formattedItems);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Get a single Inventory by ID
exports.getInventoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const Item = await Inventory.findOne({
      _id: id,
      is_deleted: false,
    }).populate("brand category");

    if (!Item) {
      return res.status(404).json({ message: "Inventory not found" });
    }

    // const updatedItem = {
    //     ...Item.toObject(),
    //     brand: Item.brand.brandName,
    //     category: Item.category.categoryName
    //   };
    res.status(200).json(Item);
  } catch (err) {
    console.log("err", err);
    res.status(500).json({ error: err.message });
  }
};

// Update an Inventory by ID
exports.updateInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    const updatedInventory = await Inventory.findOneAndUpdate(
      { _id: id, is_deleted: false },
      updatedData,
      { new: true } // Returns the updated document
    );

    if (!updatedInventory) {
      return res
        .status(404)
        .json({ message: "Inventory not found or already deleted" });
    }

    res.status(200).json(updatedInventory);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete an Inventory by ID (hard delete)
exports.deleteInventory = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedInventory = await Inventory.findByIdAndDelete(id);

    if (!deletedInventory) {
      return res.status(404).json({ message: "Inventory not found" });
    }

    res.status(200).json({ message: "Inventory deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Mark Inventory as deleted (soft delete)
exports.markAsDeleted = async (req, res) => {
  try {
    const { id } = req.params;

    const Item = await Inventory.findOneAndUpdate(
      { _id: id },
      { is_deleted: true },
      { new: true }
    );

    if (!Item) {
      return res.status(404).json({ message: "Inventory not found" });
    }

    res.status(200).json({ message: "Inventory marked as deleted", Item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Mark Inventory as out of stock
exports.markAsOutOfStock = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await Inventory.findOne({ _id: id, is_deleted: false });

    if (item) {
      const updatedItem = await Inventory.findOneAndUpdate(
        { _id: id, is_deleted: false },
        { currentStockStatus: !item.currentStockStatus },
        { new: true } // Return the updated document
      );
      console.log("Updated Item:", updatedItem);
    } else {
      console.error("Item not found or is deleted.");
    }

    if (!item) {
      return res
        .status(404)
        .json({ message: "Inventory not found or already deleted" });
    }

    res.status(200).json({ message: "Inventory marked as out of stock", item });
  } catch (err) {
    console.log("err", err);
    res.status(500).json({ error: err.message });
  }
};

exports.fetchBrands = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    const searchQuery = search
      ? { brandName: { $regex: search, $options: "i" } }
      : {};

    const brands = await Brand.find(searchQuery)
      .select("brandName _id")
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ brandName: 1 });

    const total = await Brand.countDocuments(searchQuery);

    res.status(200).json({
      brands,
      total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.fetchCategories = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    const searchQuery = search
      ? { categoryName: { $regex: search, $options: "i" } }
      : {};

    const categories = await Category.find(searchQuery)
      .select("categoryName _id")
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ categoryName: 1 });

    const total = await Category.countDocuments(searchQuery);

    res.status(200).json({
      categories,
      total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
