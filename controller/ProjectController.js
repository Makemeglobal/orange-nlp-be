
const Project = require('../model/Project');
const MeetingNote = require('../model/MeetingNote');


exports.createProject = async (req, res) => {
    try {
        const user =  req.user ;

        console.log(user)
        const meetingNotes = await MeetingNote.insertMany(req.body.meetingNotes);
        const project = new Project({
            projectName: req.body.projectName,
            projectDate: req.body.projectDate,
            projectDuration: req.body.projectDuration,
            meetingNotes: meetingNotes.map(note => note._id),
            meetingSummary: req.body.meetingSummary,
            user:user,
            meetingDescription: req.body.meetingDescription,
            meetingTexts: req.body.meetingTexts
        });
        await project.save();
        res.status(201).json(project);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAllProjects = async (req, res) => {
    try {
        const projects = await Project.find().populate('meetingNotes');
        res.status(200).json(projects);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getProjectsByMonth = async (req, res) => {
    try {
        const userId = req.user;  


        const projects = await Project.find({ user: userId })
                                      .sort({ createdAt: 1 })
                                      .exec();

        const projectsByMonth = projects.reduce((acc, project) => {
            const month = new Date(project.createdAt).getMonth(); 
            if (!acc[month]) {
                acc[month] = [];
            }
            acc[month].push(project);
            return acc;
        }, {});

     
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const formattedProjectsByMonth = Object.keys(projectsByMonth).map(month => ({
            month: monthNames[parseInt(month, 10)],  
            projects: projectsByMonth[month]
        }));

        res.status(200).json(formattedProjectsByMonth);
    } catch (error) {
        console.error('Error fetching projects by month:', error);
        res.status(500).json({ error: error.message });
    }
};





exports.getProjectById = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id).populate('meetingNotes');
        if (!project) return res.status(404).json({ error: 'Project not found' });
        res.status(200).json(project);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


exports.updateProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ error: 'Project not found' });

        if (req.body.meetingNotes) {
            await MeetingNote.deleteMany({ _id: { $in: project.meetingNotes } });
            const meetingNotes = await MeetingNote.insertMany(req.body.meetingNotes);
            project.meetingNotes = meetingNotes.map(note => note._id);
        }

        project.projectName = req.body.projectName || project.projectName;
        project.projectDate = req.body.projectDate || project.projectDate;
        project.projectDuration = req.body.projectDuration || project.projectDuration;
        project.meetingSummary = req.body.meetingSummary || project.meetingSummary;
        project.meetingDescription = req.body.meetingDescription || project.meetingDescription;
        project.meetingTexts = req.body.meetingTexts || project.meetingTexts;

        await project.save();
        res.status(200).json(project);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


exports.deleteProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ error: 'Project not found' });

        await MeetingNote.deleteMany({ _id: { $in: project.meetingNotes } });
        await project.remove();
        res.status(204).end();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
