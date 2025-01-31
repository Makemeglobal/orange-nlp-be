const express = require("express");
const {
  addTask,
  getTasks,
  updateTask,
  deleteTask,
  updateTaskStatus,
  getTaskById
} = require("../controller/taskController");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

router.post("/", authMiddleware ,addTask);
router.get("/", authMiddleware ,getTasks);
router.get("/:id", getTaskById);
router.put("/:id", updateTask);
router.delete("/:id", deleteTask);
router.put('/:id/:status',updateTaskStatus)

module.exports = router;
