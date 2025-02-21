const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MeetingInventorySchema = new Schema({
    project_Name: { type: String, required: true },
    person_Name: { type: String, required: true },
    end: { type: Date, required: false },
    phone: { type: String },
    url: { type: String },
    email: { type: Schema.Types.ObjectId, ref: 'User' },
    email_id: { type: String },

    location: { type: String },
    status: { type: String, default: "upcoming" },
  
     user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false,
      },
    inventory: [{
        type: Schema.Types.Mixed,
        inventory_url: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Inventory",
            required: true,
          },
          
    }],
    subtitle: { type: String },
    isApproved:{type:Boolean,required:true,default:false}
}, {
    timestamps: true
});

module.exports = mongoose.model('MeetingInventory', MeetingInventorySchema);
