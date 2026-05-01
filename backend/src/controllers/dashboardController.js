const Activity = require("../models/Activity");
const Project = require("../models/Project");
const Task = require("../models/Task");
const { resolveProjectRoleTitle } = require("../utils/projectRoles");
const {
  buildTaskSummary,
  isTaskCompleted,
  isTaskOverdue,
  serializeActivity,
  serializeTask,
  toPercent,
} = require("../utils/taskInsights");

const resolveAssignedUserId = (task) => {
  if (!task?.assignedTo) {
    return null;
  }

  if (task.assignedTo._id) {
    return task.assignedTo._id.toString();
  }

  return task.assignedTo.toString();
};

const getDashboard = async (req, res, next) => {
  try {
    const projects = await Project.find({ "members.user": req.user._id }).populate(
      "members.user",
      "name email"
    );
    const projectIds = projects.map((project) => project._id);

    const tasks = await Task.find({ project: { $in: projectIds } })
      .populate("project", "name")
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .sort({ dueDate: 1, createdAt: -1 });
    const roleByProject = new Map();
    const memberMap = new Map();
    const tasksByProject = new Map();
    const visibleTaskIds = new Set();

    projects.forEach((project) => {
      const myMemberEntry = project.members.find(
        (member) => member.user._id.toString() === req.user._id.toString()
      );
      const myRole = myMemberEntry?.role || "member";

      roleByProject.set(project._id.toString(), myRole);

      project.members.forEach((member) => {
        if (myRole !== "admin" && member.user._id.toString() !== req.user._id.toString()) {
          return;
        }

        const key = member.user._id.toString();

        if (!memberMap.has(key)) {
          memberMap.set(key, {
            id: member.user._id,
            name: member.user.name,
            email: member.user.email,
            role: member.role,
            roleTitle: member.roleTitle || "",
            displayRole: resolveProjectRoleTitle(member.role, member.roleTitle),
          });
        }
      });
    });

    tasks.forEach((task) => {
      const key = task.project._id.toString();
      const projectRole = roleByProject.get(key) || "member";
      const isVisible =
        projectRole === "admin" || resolveAssignedUserId(task) === req.user._id.toString();

      if (!tasksByProject.has(key)) {
        tasksByProject.set(key, []);
      }

      if (isVisible) {
        tasksByProject.get(key).push(task);
        visibleTaskIds.add(task._id.toString());
      }
    });

    const visibleTasks = Array.from(tasksByProject.values()).flat();
    const myTasks = visibleTasks.filter((task) => resolveAssignedUserId(task) === req.user._id.toString());
    const myOverdueTasks = myTasks.filter((task) => isTaskOverdue(task));
    const overallSummary = buildTaskSummary(visibleTasks);
    const mySummary = buildTaskSummary(myTasks);

    const memberAnalytics = Array.from(memberMap.values())
      .map((member) => {
        const assignedTasks = visibleTasks.filter(
          (task) => resolveAssignedUserId(task) === member.id.toString()
        );
        const completedTasks = assignedTasks.filter((task) => isTaskCompleted(task.status)).length;
        const overdueTasks = assignedTasks.filter((task) => isTaskOverdue(task)).length;

        return {
          id: member.id,
          name: member.name,
          role: member.role,
          roleTitle: member.roleTitle || "",
          displayRole: member.displayRole || resolveProjectRoleTitle(member.role, member.roleTitle),
          assignedTasks: assignedTasks.length,
          completedTasks,
          openTasks: assignedTasks.length - completedTasks,
          overdueTasks,
          completionRate: toPercent(completedTasks, assignedTasks.length),
        };
      })
      .sort((first, second) => second.assignedTasks - first.assignedTasks);

    const projectAnalytics = projects
      .map((project) => {
        const summary = buildTaskSummary(tasksByProject.get(project._id.toString()) || []);

        return {
          id: project._id,
          name: project.name,
          memberCount: project.members.length,
          ...summary,
        };
      })
      .sort((first, second) => second.overdueTasks - first.overdueTasks);

    const recentActivity = await Activity.find({ project: { $in: projectIds } })
      .populate("actor", "name email")
      .populate("project", "name")
      .populate("task", "title")
      .sort({ createdAt: -1 })
      .limit(12);
    const scopedActivity = recentActivity.filter((item) => {
      const projectRole = item.project?._id ? roleByProject.get(item.project._id.toString()) : "member";

      if (projectRole === "admin") {
        return true;
      }

      if (item.task?._id) {
        return visibleTaskIds.has(item.task._id.toString());
      }

      return item.actor?._id?.toString() === req.user._id.toString();
    });

    const busiestMember = memberAnalytics[0] || null;
    const delayedProject =
      projectAnalytics.find((project) => project.overdueTasks > 0) || projectAnalytics[0] || null;

    res.json({
      summary: {
        totalProjects: projects.length,
        totalTasks: overallSummary.totalTasks,
        pendingTasks: overallSummary.pendingTasks,
        completedTasks: overallSummary.completedTasks,
        overdueTasks: overallSummary.overdueTasks,
        tasksByStatus: overallSummary.tasksByStatus,
        progressPercent: overallSummary.progressPercent,
        completionRate: overallSummary.progressPercent,
        overduePercentage: toPercent(overallSummary.overdueTasks, overallSummary.totalTasks),
        myTasks: myTasks.length,
        myOpenTasks: mySummary.pendingTasks,
      },
      myTasks: myTasks.slice(0, 8).map(serializeTask),
      overdueTasks: myOverdueTasks.slice(0, 8).map(serializeTask),
      memberAnalytics,
      projectAnalytics,
      adminInsights: {
        busiestMember,
        delayedProject,
      },
      recentActivity: scopedActivity.map(serializeActivity),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
};
