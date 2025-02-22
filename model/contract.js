const mongoose = require("mongoose");

const ContractSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: { type: String },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    quote: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MeetingInventory',
        required: false,
      },
    lastUpdate: { type: Date, default: Date.now },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    
    version: [
        {
            version: { type: Number },
            contractDesc: { type: String }
        }
    ],
    timeline: [
        {
            startDate: { type: Date },
            endDate: { type: Date },
            timelineName: { type: String }
        }
    ],
    totalPayment: { type: Number, default: 5000 },
    is_deleted: {
        type: Boolean,
        default: false,
      },
    paymentMilestone: [
        {    _id: { type: mongoose.Schema.Types.ObjectId, auto: true }, 
            milestoneName: { type: String },
            desc: { type: String },
            amount: { type: Number },
            startDate: { type: Date },
            endDate: { type: Date },
            status: { type: String, enum: ["completed", "pending", "inprogress"], default: "pending" }
        }
    ]
});

module.exports = mongoose.model("Contract", ContractSchema);
