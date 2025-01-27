const Task = require('../model/tasks');

exports.addTask = async (req, res) => {
  try {
    const { title, description, priority, start_date, end_date } = req.body;
    const task = await Task.create({ title, description, priority, start_date, end_date });
    res.status(201).json(task);
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Error adding task", error });
  }
};

exports.getTasks = async (req, res) => {
  try {
    const { status, priority, start_date, end_date } = req.query;
    let filter = {
        is_deleted:false
    };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (start_date || end_date) {
      filter.start_date = start_date ? { $gte: new Date(start_date) } : undefined;
      filter.end_date = end_date ? { $lte: new Date(end_date) } : undefined;
    }
    const tasks = await Task.find(filter);
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Error fetching tasks", error });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedTask = await Task.findByIdAndUpdate(id, req.body, { new: true });
    res.status(200).json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: "Error updating task", error });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    await Task.findByIdAndUpdate(id, { is_deleted: true });
    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting task", error });
  }
};


exports.updateTaskStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.params; 
  
    try {
      const validStatuses = ["todo", "inprogress", "completed"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status value" });
      }
  
      const updatedTask = await Task.findByIdAndUpdate(
        id,
        { status },
        { new: true, runValidators: true } 
      );
  
      if (!updatedTask) {
        return res.status(404).json({ error: "Task not found" });
      }
  
      return res.status(200).json(updatedTask);
    } catch (error) {
      console.error("Error updating task status:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
  
