const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    brand: { type: mongoose.Schema.Types.ObjectId, ref: "Brand", required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    itemName: { type: String, required: true },
    description: { type: String, default: "" },
    quantity: { type: Number, required: true, min: 0 },
    currentStockStatus: { type: Boolean, default: true },
    imageUrl: { type: String, default: "" },
    is_deleted: { type: Boolean, default: false }, 
  },
  {
    timestamps: true, 
  }
);

module.exports = mongoose.model("Inventory", itemSchema);
