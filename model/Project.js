const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProjectSchema = new Schema({
    projectName: { type: String, required: true },
    projectDate: { type: Date, required: true },
    projectDuration: { type: Number, required: true },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false,
      },
    meetingNotes: [{ type: Schema.Types.ObjectId, ref: 'MeetingNote' }],
    meetingSummary: { type: String, required: true },
    meetingDescription: { type: String, required: true },
    meetingTexts: { type: Array, required: true }
    
},{ timestamps: true });

module.exports = mongoose.model('Project', ProjectSchema);
