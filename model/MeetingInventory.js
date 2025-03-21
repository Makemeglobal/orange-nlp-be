const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const MeetingInventorySchema = new Schema(
  {
    meetingGroupId: { type: String, required: false }, // Common ID for all versions of a meeting
    project_Name: { type: String, required: true },
    person_Name: { type: String, required: true },
    end: { type: Date, required: false },
    phone: { type: String },
    url: { type: String },
    email: { type: Schema.Types.ObjectId, ref: "User" },
    email_id: { type: String },
    location: { type: String },
    status: { type: String, default: "upcoming" },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },

    inventory: [
      {
        type: Schema.Types.Mixed,
        inventory_url: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Inventory",
          required: true,
        },
        suggestions: [
          {
            suggestionId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Inventory",
            },
          },
        ],
        notes: [
          {
            text: { type: String, required: true }, // Stores the note text
            createdAt: { type: Date, default: Date.now }, // Timestamp for the note
          },
        ],
      },
    ],
    subtitle: { type: String },
    version: { type: Number, default: 1 },
    lastUpdated: { type: Date },

    isApproved: { type: Boolean, required: true, default: false },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("MeetingInventory", MeetingInventorySchema);
