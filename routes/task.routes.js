const express = require("express");
const {
  addTask,
  getTasks,
  updateTask,
  deleteTask,
  updateTaskStatus
} = require("../controller/taskController");

const router = express.Router();

router.post("/", addTask);
router.get("/", getTasks);
router.put("/:id", updateTask);
router.delete("/:id", deleteTask);
router.put('/:id/:status',updateTaskStatus)

module.exports = router;
