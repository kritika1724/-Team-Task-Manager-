const { resolveProjectRoleTitle } = require("./projectRoles");

const normalizeTaskStatus = (status) => {
  if (status === "done" || status === "completed") {
    return "completed";
  }

  if (status === "review" || status === "in_progress") {
    return "in_progress";
  }

  return "todo";
};

const isTaskCompleted = (status) => normalizeTaskStatus(status) === "completed";

const normalizeProgressPercent = (value, status = "todo") => {
  if (isTaskCompleted(status)) {
    return 100;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(parsed)));
};

const isTaskOverdue = (task) => !isTaskCompleted(task.status) && new Date(task.dueDate) < new Date();

const getRiskLevel = (dueDate, status) => {
  if (!dueDate || isTaskCompleted(status)) {
    return "low";
  }

  const due = new Date(dueDate);

  if (Number.isNaN(due.getTime())) {
    return "low";
  }

  const diffInHours = (due.getTime() - Date.now()) / (1000 * 60 * 60);

  if (diffInHours <= 24) {
    return "high";
  }

  if (diffInHours <= 72) {
    return "medium";
  }

  return "low";
};

const getSuggestedPriority = ({ description = "", dueDate, title = "" }) => {
  const signal = `${title} ${description}`.toLowerCase();
  const urgentKeywords = ["urgent", "bug", "fix", "broken", "critical", "demo", "launch", "blocker"];
  const mediumKeywords = ["review", "follow up", "integration", "testing", "qa", "deploy"];
  const due = dueDate ? new Date(dueDate) : null;
  const diffInHours =
    due && !Number.isNaN(due.getTime()) ? (due.getTime() - Date.now()) / (1000 * 60 * 60) : null;

  if (
    urgentKeywords.some((keyword) => signal.includes(keyword)) ||
    (typeof diffInHours === "number" && diffInHours <= 36)
  ) {
    return "high";
  }

  if (
    mediumKeywords.some((keyword) => signal.includes(keyword)) ||
    (typeof diffInHours === "number" && diffInHours <= 96)
  ) {
    return "medium";
  }

  return "low";
};

const toPercent = (value, total) => {
  if (!total) {
    return 0;
  }

  return Math.round((value / total) * 100);
};

const serializeTask = (task) => ({
  id: task._id,
  title: task.title,
  description: task.description,
  status: normalizeTaskStatus(task.status),
  priority: task.priority,
  progressPercent: normalizeProgressPercent(task.progressPercent, task.status),
  dueDate: task.dueDate,
  isOverdue: isTaskOverdue(task),
  riskLevel: getRiskLevel(task.dueDate, task.status),
  suggestedPriority: getSuggestedPriority({
    title: task.title,
    description: task.description,
    dueDate: task.dueDate,
  }),
  assignedTo: task.assignedTo
    ? {
        id: task.assignedTo._id || task.assignedTo.id || task.assignedTo,
        name: task.assignedTo.name,
        email: task.assignedTo.email,
      }
    : null,
  createdBy: task.createdBy
    ? {
        id: task.createdBy._id || task.createdBy.id || task.createdBy,
        name: task.createdBy.name,
        email: task.createdBy.email,
      }
    : null,
  project: task.project && task.project.name
    ? {
        id: task.project._id || task.project.id,
        name: task.project.name,
      }
    : null,
  projectId: task.project?._id || task.project?.id || task.project || null,
});

const buildTaskSummary = (tasks) => {
  const summary = {
    totalTasks: tasks.length,
    pendingTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    progressPercent: 0,
    tasksByStatus: {
      todo: 0,
      inProgress: 0,
      completed: 0,
    },
  };

  tasks.forEach((task) => {
    const normalizedStatus = normalizeTaskStatus(task.status);

    if (normalizedStatus === "todo") {
      summary.tasksByStatus.todo += 1;
    }

    if (normalizedStatus === "in_progress") {
      summary.tasksByStatus.inProgress += 1;
    }

    if (normalizedStatus === "completed") {
      summary.tasksByStatus.completed += 1;
      summary.completedTasks += 1;
    } else {
      summary.pendingTasks += 1;
    }

    if (isTaskOverdue(task)) {
      summary.overdueTasks += 1;
    }
  });

  summary.progressPercent = toPercent(summary.completedTasks, summary.totalTasks);

  return summary;
};

const buildMemberAnalytics = (members, tasks) =>
  members
    .map((member) => {
      const memberTasks = tasks.filter(
        (task) =>
          task.assignedTo &&
          (task.assignedTo._id || task.assignedTo.id || task.assignedTo).toString() === member.id.toString()
      );
      const completedTasks = memberTasks.filter((task) => isTaskCompleted(task.status)).length;
      const overdueTasks = memberTasks.filter((task) => isTaskOverdue(task)).length;

      return {
        id: member.id,
        name: member.name,
        role: member.role,
        roleTitle: member.roleTitle || "",
        displayRole: member.displayRole || resolveProjectRoleTitle(member.role, member.roleTitle),
        assignedTasks: memberTasks.length,
        completedTasks,
        openTasks: memberTasks.length - completedTasks,
        overdueTasks,
        completionRate: toPercent(completedTasks, memberTasks.length),
      };
    })
    .sort((first, second) => second.assignedTasks - first.assignedTasks);

const buildProjectAnalytics = (projects, tasksByProject) =>
  projects.map((project) => {
    const projectTasks = tasksByProject.get(project._id.toString()) || [];
    const summary = buildTaskSummary(projectTasks);

    return {
      id: project._id,
      name: project.name,
      role: project.members?.find?.(() => false)?.role,
      memberCount: project.members?.length || 0,
      ...summary,
    };
  });

const serializeActivity = (activity) => ({
  id: activity._id,
  type: activity.type,
  message: activity.message,
  createdAt: activity.createdAt,
  actor: activity.actor
    ? {
        id: activity.actor._id,
        name: activity.actor.name,
        email: activity.actor.email,
      }
    : null,
  project: activity.project
    ? {
        id: activity.project._id,
        name: activity.project.name,
      }
    : null,
  task: activity.task
    ? {
        id: activity.task._id,
        title: activity.task.title,
      }
    : null,
});

module.exports = {
  buildMemberAnalytics,
  buildProjectAnalytics,
  buildTaskSummary,
  getRiskLevel,
  getSuggestedPriority,
  isTaskCompleted,
  isTaskOverdue,
  normalizeTaskStatus,
  normalizeProgressPercent,
  serializeActivity,
  serializeTask,
  toPercent,
};
