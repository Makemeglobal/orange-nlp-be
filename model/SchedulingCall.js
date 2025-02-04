const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SchedulingCallSchema = new Schema({
    title: { type: String, required: true },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    roomId: { type: String },
    url: { type: String },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    is_deleted: { type: Boolean, default: false },
    
}, {
    timestamps: true
});

module.exports = mongoose.model('SchedulingCall', SchedulingCallSchema);
