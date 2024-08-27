const Project = require("../model/Project");
const MeetingNote = require("../model/MeetingNote");
const Transcription = require("../model/Transcription");

exports.createProject = async (req, res) => {
  try {
    const user = req.user;

    console.log(user);
    const meetingNotes = await MeetingNote.insertMany(req.body.meetingNotes);
    const project = new Project({
      projectName: req.body.projectName,
      projectDate: req.body.projectDate,
      projectDuration: req.body.projectDuration,
      meetingNotes: meetingNotes.map((note) => note._id),
      meetingSummary: req.body.meetingSummary,
      user: user,
      meetingDescription: req.body.meetingDescription,
      meetingTexts: req.body.meetingTexts,
    });
    await project.save();
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find().populate("meetingNotes");
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

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const formattedProjectsByMonth = Object.keys(projectsByMonth).map(
      (month) => ({
        month: monthNames[parseInt(month, 10)],
        projects: projectsByMonth[month],
      })
    );

    res.status(200).json(formattedProjectsByMonth);
  } catch (error) {
    console.error("Error fetching projects by month:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.analysis = async (req, res) => {
  try {
    const userId = req.user;
    const { filter } = req.query; // Get filter from query parameters

    let startDate = new Date();
    let endDate = new Date();

    if (filter === "week") {
      startDate.setDate(startDate.getDate() - 7);
      endDate = new Date(); // Current date
    } else if (filter === "month") {
      startDate.setDate(startDate.getDate() - 30); // Last 30 days
      endDate = new Date(); // Current date
    }
    const projects = await Project.find({
      user: userId,
      projectDate: { $gte: startDate, $lte: endDate },
    });

    const formatData = (projects, filter) => {
      if (filter === "month") {
        // Initialize daily data for the last 30 days
        const dailyHours = Array(30).fill(0);
        const today = new Date();

        projects.forEach((project) => {
          const projectDate = new Date(project.projectDate);
          const daysAgo = Math.floor(
            (today - projectDate) / (1000 * 60 * 60 * 24)
          );
          if (daysAgo >= 0 && daysAgo < 30) {
            dailyHours[daysAgo] += project.projectDuration / 60;
          }
        });

        // Create labels for each day from 1 to 30
        const labels = Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`);

        return {
          labels,
          data: dailyHours,
        };
      }

      // Default case for 'week' filter
      const dailyHours = {
        Sun: 0,
        Mon: 0,
        Tue: 0,
        Wed: 0,
        Thu: 0,
        Fri: 0,
        Sat: 0,
      };

      projects.forEach((project) => {
        const projectDate = new Date(project.projectDate);
        const dayName = getDayName(projectDate);
        dailyHours[dayName] += project.projectDuration / 60;
      });

      return {
        labels: Object.keys(dailyHours),
        data: Object.values(dailyHours),
      };
    };

    const { labels, data } = formatData(projects, filter);

    const result = {
      labels,
      datasets: [
        {
          categoryPercentage: 1.0,
          barPercentage: 0.2,
          label: "Hours",
          data,
          borderColor: "rgb(53, 162, 235)",
          backgroundColor: "#0057FF",
        },
      ],
    };

    return res.status(200).send({ result });
  } catch (err) {
    console.log(err);
    return res.status(500).send(err);
  }
};

exports.searchAll = async (req, res) => {
  try {
    let user = req.user;
    const { projectName } = req.body;
    if (!user) {
      return res.status(401).send({ error: "User not authenticated" });
    }
    if (!projectName) {
      return res
        .status(400)
        .send({ error: "projectName query parameter is required" });
    }
    // Search for projects by projectName and user
    const projects = await Project.find({
      projectName: new RegExp(projectName, "i"),
      user: user,
    });

    // Search for transcriptions by projectName and user
    const transcriptions = await Transcription.find({
      projectName: new RegExp(projectName, "i"),
      user: user,
    });

    console.log("transcriptions", transcriptions);
    // Combine results and add type key
    const results = [
      ...projects.map((project) => ({
        ...project.toObject(),
        type: "Project",
      })),
      ...transcriptions.map((transcription) => ({
        ...transcription.toObject(),
        type: "Transcription",
      })),
    ];

    return res.status(200).send({ results });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ error: "An error occurred while searching" });
  }
};

exports.dashboardCount = async (req, res) => {
  try {
    let user = req.user;
    console.log("user", user);
    const Projects = await Project.find({ user: user });
    const transcriptions = await Transcription.find({ user: user });
    const result = {
      recordings: Projects.length,
      totalHours: Projects.reduce(
        (total, project) => total + project.projectDuration / 60,
        0
      ),
      transcriptions: transcriptions.length,
      totalRecordings: Projects.length + transcriptions.length,
    };
    return res.send({ result: result }).status(200);
  } catch (err) {
    console.log(err);
    return res.send(err);
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate(
      "meetingNotes"
    );
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found" });

    if (req.body.meetingNotes) {
      await MeetingNote.deleteMany({ _id: { $in: project.meetingNotes } });
      const meetingNotes = await MeetingNote.insertMany(req.body.meetingNotes);
      project.meetingNotes = meetingNotes.map((note) => note._id);
    }

    project.projectName = req.body.projectName || project.projectName;
    project.projectDate = req.body.projectDate || project.projectDate;
    project.projectDuration =
      req.body.projectDuration || project.projectDuration;
    project.meetingSummary = req.body.meetingSummary || project.meetingSummary;
    project.meetingDescription =
      req.body.meetingDescription || project.meetingDescription;
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
    if (!project) return res.status(404).json({ error: "Project not found" });

    await MeetingNote.deleteMany({ _id: { $in: project.meetingNotes } });
    await project.remove();
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
