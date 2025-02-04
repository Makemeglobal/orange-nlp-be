const MeetingInventory = require('../model/MeetingInventory');

exports.addMeeting = async (req, res) => {
    try {
        const { projectName, personName, end, phone, url, location, inventory, subtitle } = req.body;
        const meeting = await MeetingInventory.create({ 
            project_Name: projectName, 
            person_Name: personName, 
            end,
            phone,
            url,
            email: req.user._id,
            location,
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
        const meeting = await MeetingInventory.findById(id);
        
        if (!meeting) {
            return res.status(404).json({ message: 'Meeting not found' });
        }
        
        res.status(200).json(meeting);
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
