const express = require("express");
const { updateTask, deleteTask } = require("../controllers/taskController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.route("/:taskId").patch(updateTask).delete(deleteTask);

module.exports = router;
