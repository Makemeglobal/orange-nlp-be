const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * Schema for ImportAudioNote
 * Represents an audio note with an optional transcription reference.
 */
const ImportAudioNoteSchema = new Schema(
  {
    note: {
      type: String,
      required: true,
    },
    transcription: {
      type: Schema.Types.ObjectId,
      ref: "Transcription",
      required: false,
    },
  },
  {
    timestamps: true, // Automatically manages 'createdAt' and 'updatedAt' fields
  }
);

// Export the model based on the schema
module.exports = mongoose.model("ImportAudioNote", ImportAudioNoteSchema);
