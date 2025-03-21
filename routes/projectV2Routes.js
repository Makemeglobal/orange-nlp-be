const {authMiddleware} = require("../middleware/auth")

const express= require('express')

const Project = require("../model/ProjectV2")

const router = express.Router();

/**
 * @route POST /projects
 * @desc Create a new project
 * @access Private (Authenticated Users Only)
 */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { fullName, email, phone, projectLocation, projectType, password, confirmPassword, isConditionsAccepted } = req.body;

    // Validate required fields
    if (!fullName || !email || !phone || !projectLocation || !projectType || !password || !confirmPassword) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    // Hash the password before storing

    // Get user ID from authenticated request
    const userId = req.user;

    const newProject = new Project({
      userId,
      fullName,
      email,
      phone,
      projectLocation,
      projectType,
      password,
      isConditionsAccepted,
    });

    await newProject.save();
    res.status(201).json({ message: "Project created successfully", project: newProject });

  } catch (error) {
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

/**
 * @route GET /projects/:id
 * @desc Get a single project by ID
 * @access Private (Authenticated Users Only)
 */
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

/**
 * @route GET /projects
 * @desc Get all projects for the authenticated user
 * @access Private (Authenticated Users Only)
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const projects = await Project.find({ userId: req.user.userId });

    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

/**
 * @route PUT /projects/:id
 * @desc Update a project
 * @access Private (Authenticated Users Only)
 */
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { fullName, email, phone, projectLocation, projectType, password, confirmPassword, isConditionsAccepted } = req.body;

    let updatedFields = { fullName, email, phone, projectLocation, projectType, isConditionsAccepted };

    // If updating password, validate and hash it
    if (password || confirmPassword) {
      if (password !== confirmPassword) {
        return res.status(400).json({ error: "Passwords do not match" });
      }
      updatedFields.password = await bcrypt.hash(password, 10);
    }

    const updatedProject = await Project.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId }, // Ensure user can only update their projects
      updatedFields,
      { new: true, runValidators: true }
    );

    if (!updatedProject) {
      return res.status(404).json({ error: "Project not found or unauthorized" });
    }

    res.status(200).json({ message: "Project updated successfully", project: updatedProject });

  } catch (error) {
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

/**
 * @route DELETE /projects/:id
 * @desc Delete a project
 * @access Private (Authenticated Users Only)
 */
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const deletedProject = await Project.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });

    if (!deletedProject) {
      return res.status(404).json({ error: "Project not found or unauthorized" });
    }

    res.status(200).json({ message: "Project deleted successfully" });

  } catch (error) {
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

module.exports=router;
