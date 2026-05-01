const express = require("express");
const {
  getProjects,
  createProject,
  getProjectDetails,
  updateProject,
  deleteProject,
  addProjectMember,
  createCustomRole,
  removeProjectMember,
  updateProjectMember,
} = require("../controllers/projectController");
const { createTask } = require("../controllers/taskController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.route("/").get(getProjects).post(createProject);
router.route("/:projectId").get(getProjectDetails).patch(updateProject).delete(deleteProject);
router.post("/:projectId/members", addProjectMember);
router.patch("/:projectId/members/:memberId", updateProjectMember);
router.delete("/:projectId/members/:memberId", removeProjectMember);
router.post("/:projectId/roles", createCustomRole);
router.post("/:projectId/tasks", createTask);

module.exports = router;
