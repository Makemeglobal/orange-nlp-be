const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MeetingInventorySchema = new Schema({
    project_Name: { type: String, required: true },
    person_Name: { type: String, required: true },
    end: { type: Date, required: true },
    phone: { type: String },
    url: { type: String },
    email: { type: Schema.Types.ObjectId, ref: 'User' },
    location: { type: String },
    inventory: [{
        type: Schema.Types.Mixed
    }],
    subtitle: { type: String },
}, {
    timestamps: true
});

module.exports = mongoose.model('MeetingInventory', MeetingInventorySchema);
