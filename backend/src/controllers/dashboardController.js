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

    const myTasks = tasks.filter(
      (task) => task.assignedTo && task.assignedTo._id.toString() === req.user._id.toString()
    );
    const myOverdueTasks = myTasks.filter((task) => isTaskOverdue(task));
    const overallSummary = buildTaskSummary(tasks);
    const mySummary = buildTaskSummary(myTasks);
    const memberMap = new Map();
    const tasksByProject = new Map();

    projects.forEach((project) => {
      project.members.forEach((member) => {
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

      if (!tasksByProject.has(key)) {
        tasksByProject.set(key, []);
      }

      tasksByProject.get(key).push(task);
    });

    const memberAnalytics = Array.from(memberMap.values())
      .map((member) => {
        const assignedTasks = tasks.filter(
          (task) => task.assignedTo && task.assignedTo._id.toString() === member.id.toString()
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
      recentActivity: recentActivity.map(serializeActivity),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
};
