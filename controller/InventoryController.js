const express = require("express");
const mongoose = require("mongoose");
const Inventory = require("../model/Inventory"); // Adjust path if necessary

const Brand = require("../model/Brand");
const Category = require("../model/Category");

const csv = require('csv-parser');
const fs = require('fs');
const { Readable } = require('stream');

exports.bulkCreateInventory = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Please upload a CSV file" });
    }

    // For CSV files, we need to handle differently since your multer is set up for images
    // You might need to adjust your multer config or create a separate one for CSV files
    
    const results = [];
    const errors = [];

    console.log('file path ',req?.file?.path);
    
    // Read the CSV file from the filesystem (since Cloudinary would have stored it)
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        // Process each row and create inventory items
        const inventoryPromises = results.map(async (item) => {
          try {
            const newInventory = new Inventory({
              brand: item.brand,
              category: item.category,
              itemName: item.itemName,
              description: item.description || "",
              quantity: parseInt(item.quantity) || 0,
              user: req.user,
              imageUrl: item.imageUrl || "",
              price: item.price || "",
              isPremium: item.isPremium === "true" || item.isPremium === true,
              status: item.status || "draft",
              currentStockStatus: item.currentStockStatus === "true" || item.currentStockStatus === true
            });

            return await newInventory.save();
          } catch (itemError) {
            errors.push({
              itemName: item.itemName,
              error: itemError.message
            });
            return null;
          }
        });

        const savedInventories = await Promise.all(inventoryPromises);
        const successfulItems = savedInventories.filter(item => item !== null);

        res.status(201).json({
          message: `Successfully created ${successfulItems.length} inventory items`,
          failedItems: errors.length > 0 ? errors : undefined,
          successfulItems
        });
      })
      .on('error', (err) => {
        console.error("CSV parsing error:", err);
        res.status(500).json({ error: "Failed to process CSV file: " + err.message });
      });
      
  } catch (err) {
    console.error("Bulk inventory creation error:", err);
    res.status(500).json({ error: "Failed to process CSV file: " + err.message });
  }
};



// Create a new Inventory
exports.createInventory = async (req, res) => {
  try {
    const {
      subCategory,
      category,
      itemName,
      description,
      price,
      quantity,
      image,
      isPremium,
      status,
      currentStockStatus,
    } = req.body;
    console.log("req,file", req.user);

    const newInventory = new Inventory({
      subCategory,
      category,
      itemName,
      description,
      quantity,
      user: req.user,
      imageUrl: image,
      price,
      isPremium,
      status,

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

    if (req.query.isUserSpecific == "true") {
      query.user = req.user;
    }

    // Apply filtering conditions
    if (filter === "in-stock") query.currentStockStatus = true;
    if (filter === "out-of-stock") query.currentStockStatus = false;

    // Determine sorting order
    let sortOptions = { createdAt: -1 }; // Default: Newest first
    if (sortBy === "quantity") sortOptions = { quantity: -1 };
    if (sortBy === "last-updated") sortOptions = { updatedAt: -1 };
    if (sortBy === "old-to-new") sortOptions = { createdAt: 1 };

    // Fetch inventory items
    const inventoryItems = await Inventory.find(query)
      .populate("brand category user")
      .sort(sortOptions);

    // Format data to match frontend expectations
    const formattedItems = inventoryItems.map((item) => ({
      id: item._id,
      name: item.itemName, // itemName → name
      description: item.description,
      category: item.category || "Unknown Category", // category → categoryName
      brand: item.brand || "Unknown Subcategory", 
      subcategory:item.subCategory,// brand → subcategory
      price: item.price,
      image: item.imageUrl || "/images/default-image.svg",
      status: item.status, // Keep status field
      isPremium: item.isPremium,
      stock: item.quantity, // quantity → stock
    }));

    res.status(200).json(formattedItems);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getAllInventorys2 = async (req, res) => {
  try {
    const { filter, sortBy, isUser, contractor } = req.query;

    // Determine user filter condition
    let userFilter = isUser === "true" ? contractor : req.user;

    // Base query excluding soft-deleted items and filtering by user
    let query = { is_deleted: false };

    if (req.query.isUserSpecific == "true") {
      query.user = req.user;
    }

    // Apply filtering conditions
    if (filter === "in-stock") query.currentStockStatus = true;
    if (filter === "out-of-stock") query.currentStockStatus = false;

    // Determine sorting order
    let sortOptions = { createdAt: -1 }; // Default: Newest first
    if (sortBy === "quantity") sortOptions = { quantity: -1 };
    if (sortBy === "last-updated") sortOptions = { updatedAt: -1 };
    if (sortBy === "old-to-new") sortOptions = { createdAt: 1 };

    // Fetch inventory items
    const inventoryItems = await Inventory.find(query)
      .populate("brand category user")
      .sort(sortOptions);

    // Format data to match frontend expectations
    const formattedItems = inventoryItems.map((item) => ({
      id: item._id,
      name: item.itemName, // itemName → name
      description: item.description,
      category: item.category.categoryName || "Unknown Category", // category → categoryName
      brand: item.brand || "Unknown Subcategory", 
      subcategory:item.subCategory,// brand → subcategory
      price: item.price,
      image: item.imageUrl || "/images/default-image.svg",
      status: item.status, // Keep status field
      isPremium: item.isPremium,
      stock: item.quantity, // quantity → stock
    }));

    res.status(200).json(formattedItems);
  } catch (err) {
    console.log('err',err)
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
exports.updateInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const { itemName, description, category, brand, price, status, isPremium, quantity, image } = req.body;

    console.log("➡️ Received Update Request for ID:", id);
    console.log("📥 Request Body:", req.body);

    // Build the update object explicitly
    let updateFields = {};

    if (itemName !== undefined) updateFields.itemName = itemName;
    if (description !== undefined) updateFields.description = description;
    if (category !== undefined) updateFields.category = new mongoose.Types.ObjectId(category);
    if (brand !== undefined) updateFields.brand = new mongoose.Types.ObjectId(brand);
    if (price !== undefined) updateFields.price = price.toString();
    if (status !== undefined) updateFields.status = status;
    if (isPremium !== undefined) updateFields.isPremium = isPremium;
    if (quantity !== undefined) updateFields.quantity = quantity;
    if (image !== undefined) updateFields.imageUrl = image;

    console.log("🛠️ Fields to Update:", updateFields);
 await Inventory.findByIdAndUpdate(
      id,
      { $set: updateFields }, // Explicitly setting fields
      { new: true, runValidators: true }
    );

    const updatedInventory = await Inventory.findById(id)
    .populate("brand")
    .populate("category");


    if (!updatedInventory) {
      console.log("❌ Inventory Not Found!");
      return res.status(404).json({ message: "Inventory not found or already deleted" });
    }

    console.log("✅ Updated Inventory:", updatedInventory);
    res.status(200).json(updatedInventory);
  } catch (err) {
    console.error("❌ Update Error:", err);
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
