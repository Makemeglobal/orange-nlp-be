const mongoose = require("mongoose");

const promoteSchema = new mongoose.Schema(
  {
    inventory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
      required: true,
    },
    locations: [{ type: String, required: true }], // Array of location names
    amount: { type: mongoose.Schema.Types.Mixed, required: true }, // Can store both Number and String
    is_active: { type: Boolean, default: true }, // To track if the promotion is active
  },
  {
    timestamps: true, // Adds createdAt and updatedAt timestamps
  }
);

module.exports = mongoose.model("Promote", promoteSchema);
