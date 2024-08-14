
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MeetingNoteSchema = new Schema({
    noteTitle: { type: String, required: true },
    noteDesc: { type: String, required: true }
});

module.exports = mongoose.model('MeetingNote', MeetingNoteSchema);
