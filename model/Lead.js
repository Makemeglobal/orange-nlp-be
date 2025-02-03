const mongoose = require("mongoose");

const LeadSchema = new mongoose.Schema({
  project: { type: String, required: true },
  clientName: { type: String, required: true },
  place: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
          },
  email: { type: String, required: true, unique: false },
  status: { 
    type: String, 
    enum: ["completed", "ongoing", "no reply"], 
    default: "ongoing" 
  }
});

const Lead = mongoose.model("Lead", LeadSchema);
module.exports = Lead;
