const MeetingInventory = require('../model/MeetingInventory');
const { User } = require('../model/User');

exports.addMeeting = async (req, res) => {
    try {
        const { projectName, personName, end, phone, url, location, inventory, subtitle ,inventory_url,email} = req.body;
        console.log('inv',inventory)
        const meeting = await MeetingInventory.create({ 
            project_Name: projectName, 
            person_Name: personName, 
            end,
            phone,
            url,
            email: req.user.userId,
            location,
            inventory_url,
            user:req.user.userId,
            inventory,
            subtitle
        });
        res.status(201).json(meeting);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error adding meeting', error });
    }
};

exports.getMeetings = async (req, res) => {
    try {
        const { endDate } = req.query;
        const filter = {
            email: req.user._id
        };

        if (endDate) {
            filter.end = { $lte: new Date(endDate) };
        }

        const meetings = await MeetingInventory.find(filter);
        res.status(200).json(meetings);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching meetings', error });
    }
};

exports.getMeetingById = async (req, res) => {
    try {
        const { id } = req.params;

        // Find the meeting and populate inventory and user
        const meeting = await MeetingInventory.findById(id)
            .populate({
                path: 'inventory.inventory_url',
                model: 'Inventory'
            })
            .populate({
                path: 'email',
                model: 'User'
            });

        if (!meeting) {
            return res.status(404).json({ message: 'Meeting not found' });
        }

        // Convert the meeting to a plain object
        const meetingObject = meeting.toObject();

        // Filter out inventory items where `isAvailable` is `true`
        meetingObject.inventory = meetingObject.inventory.filter(item => item.isAvailable === true);

        // Keep the user data
        const user = meetingObject.email || null;

        // Send the response with the filtered inventory and user
        res.status(200).json({ ...meetingObject, user });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching meeting', error });
    }
};


exports.updateMeeting = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedMeeting = await MeetingInventory.findByIdAndUpdate(
            id, 
            req.body, 
            { new: true, runValidators: true }
        );

        if (!updatedMeeting) {
            return res.status(404).json({ message: 'Meeting not found' });
        }

        res.status(200).json(updatedMeeting);
    } catch (error) {
        res.status(500).json({ message: 'Error updating meeting', error });
    }
};

exports.deleteMeeting = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedMeeting = await MeetingInventory.findByIdAndDelete(id);

        if (!deletedMeeting) {
            return res.status(404).json({ message: 'Meeting not found' });
        }

        res.status(200).json({ message: 'Meeting deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting meeting', error });
    }
};

exports.getAllMeetings = async (req, res) => {
    try {
        const meetings = await MeetingInventory.find({ 
            email: req.user._id
        });
        res.status(200).json(meetings);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching all meetings', error });
    }
};
