const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const TranscriptionSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId, // Data type is ObjectId
      ref: "User", // Reference to the 'User' model
      required: false, // This field is not mandatory
    },

    text: {
      type: String, // Data type is String
      required: true, // This field is mandatory
    },

    audio_url: {
      type: String, // Data type is String
      required: true, // This field is mandatory
    },
  },
  {
    timestamps: true, // Automatically add 'createdAt' and 'updatedAt' fields
  }
);

module.exports = mongoose.model("Transcription", TranscriptionSchema);
