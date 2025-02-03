const mongoose = require("mongoose");

const ContractSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: { type: String },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    lastUpdate: { type: Date, default: Date.now },
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
    paymentMilestone: [
        {
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
