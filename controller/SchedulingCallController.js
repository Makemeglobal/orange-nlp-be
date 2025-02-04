const SchedulingCall = require('../model/SchedulingCall');

exports.addSchedulingCall = async (req, res) => {
    try {
        const { title, start, end, roomId, url } = req.body;
        const schedulingCall = await SchedulingCall.create({ 
            title, 
            start, 
            end, 
            roomId,
            url,
            user: req.user 
        });
        res.status(201).json(schedulingCall);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error adding scheduling call", error });
    }
};

exports.getSchedulingCalls = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        let filter = {
            is_deleted: false,
            user: req.user
        };

        if (start_date || end_date) {
            filter.start = start_date ? { $gte: new Date(start_date) } : undefined;
            filter.end = end_date ? { $lte: new Date(end_date) } : undefined;
        }

        const schedulingCalls = await SchedulingCall.find(filter);
        res.status(200).json(schedulingCalls);
    } catch (error) {
        res.status(500).json({ message: "Error fetching scheduling calls", error });
    }
};

exports.getSchedulingCallById = async (req, res) => {
    try {
        const { id } = req.params;
        const schedulingCall = await SchedulingCall.findById(id);
        res.status(200).json(schedulingCall);
    } catch (error) {
        res.status(500).json({ message: "Error fetching scheduling call", error });
    }
};

exports.updateSchedulingCall = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedSchedulingCall = await SchedulingCall.findByIdAndUpdate(
            id, 
            req.body, 
            { new: true }
        );
        res.status(200).json(updatedSchedulingCall);
    } catch (error) {
        res.status(500).json({ message: "Error updating scheduling call", error });
    }
};

exports.deleteSchedulingCall = async (req, res) => {
    try {
        const { id } = req.params;
        await SchedulingCall.findByIdAndUpdate(id, { is_deleted: true });
        res.status(200).json({ message: "Scheduling call deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting scheduling call", error });
    }
};

exports.getAllSchedulingCalls = async (req, res) => {
    try {
        const schedulingCalls = await SchedulingCall.find({ 
            user: req.user,
            is_deleted: false 
        });
        res.status(200).json(schedulingCalls);
    } catch (error) {
        res.status(500).json({ message: "Error fetching all scheduling calls", error });
    }
};
