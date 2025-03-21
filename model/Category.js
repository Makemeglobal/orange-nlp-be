const mongoose = require("mongoose");
require("./subCategory"); // Ensure SubCategory is loaded before using

const categorySchema = new mongoose.Schema(
  {
    categoryName: { type: String, required: true, unique: true },
    description: { type: String, default: "" },
    subCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: "SubCategory" }], // List of subcategories
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Category", categorySchema);
