const mongoose = require("mongoose");
const Project = require("../models/Project");
const Task = require("../models/Task");
const { logActivity } = require("../services/activityService");
const { getProjectRole } = require("../utils/projectAccess");
const {
  getSuggestedPriority,
  serializeTask,
} = require("../utils/taskInsights");

const resolveIncomingStatus = (status) => {
  if (status === "done") {
    return "completed";
  }

  if (status === "review") {
    return "in_progress";
  }

  if (["todo", "in_progress", "completed"].includes(status)) {
    return status;
  }

  return null;
};

const createTask = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.projectId)) {
      res.status(404);
      throw new Error("Project not found or access denied.");
    }

    const project = await Project.findById(req.params.projectId).populate("members.user", "name email");

    if (!project) {
      res.status(404);
      throw new Error("Project not found or access denied.");
    }

    const role = getProjectRole(project, req.user._id);

    if (!role) {
      res.status(404);
      throw new Error("Project not found or access denied.");
    }

    if (role !== "admin") {
      return res.status(403).json({
        message: "Only project admins can create tasks.",
      });
    }

    const { title, description = "", assignedTo, priority, dueDate } = req.body;
    const trimmedTitle = title?.trim();
    const parsedDueDate = new Date(dueDate);

    if (!trimmedTitle || !assignedTo || !dueDate) {
      res.status(400);
      throw new Error("Title, assignee, and due date are required.");
    }

    if (!mongoose.Types.ObjectId.isValid(assignedTo)) {
      res.status(400);
      throw new Error("Assigned user is invalid.");
    }

    if (Number.isNaN(parsedDueDate.getTime())) {
      res.status(400);
      throw new Error("Due date must be a valid date.");
    }

    const assigneeExists = project.members.some((member) => member.user._id.toString() === assignedTo);

    if (!assigneeExists) {
      res.status(400);
      throw new Error("Assigned user must be part of the selected project.");
    }

    const suggestedPriority = getSuggestedPriority({
      title: trimmedTitle,
      description,
      dueDate: parsedDueDate,
    });

    const finalPriority = ["low", "medium", "high"].includes(priority) ? priority : suggestedPriority;
    const task = await Task.create({
      project: project._id,
      title: trimmedTitle,
      description: typeof description === "string" ? description.trim() : "",
      assignedTo,
      createdBy: req.user._id,
      priority: finalPriority,
      dueDate: parsedDueDate,
      status: "todo",
    });

    await task.populate("assignedTo", "name email");
    await task.populate("createdBy", "name email");
    await task.populate("project", "name");

    await logActivity({
      actor: req.user._id,
      message: `${req.user.name} created task ${task.title} and assigned it to ${task.assignedTo.name}.`,
      project: project._id,
      task: task._id,
      type: "task_created",
    });

    res.status(201).json({
      message: "Task created successfully.",
      task: serializeTask(task),
    });
  } catch (error) {
    next(error);
  }
};

const updateTask = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.taskId)) {
      res.status(404);
      throw new Error("Task not found.");
    }

    const task = await Task.findById(req.params.taskId)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email");

    if (!task) {
      res.status(404);
      throw new Error("Task not found.");
    }

    const project = await Project.findById(task.project).populate("members.user", "name email");

    if (!project) {
      res.status(404);
      throw new Error("Project not found.");
    }

    const role = getProjectRole(project, req.user._id);

    if (!role) {
      return res.status(403).json({
        message: "You do not have access to this task.",
      });
    }

    const isAssignedMember = task.assignedTo?._id.toString() === req.user._id.toString();

    if (role !== "admin" && !isAssignedMember) {
      return res.status(403).json({
        message: "Only admins or the assigned member can update this task.",
      });
    }

    const { title, description, assignedTo, priority, dueDate, status } = req.body;
    const activityMessages = [];

    if (role === "admin") {
      if (typeof title === "string" && title.trim() && task.title !== title.trim()) {
        task.title = title.trim();
        activityMessages.push(`renamed task to ${task.title}`);
      }

      if (typeof description === "string" && task.description !== description.trim()) {
        task.description = description.trim();
      }

      if (typeof priority === "string" && ["low", "medium", "high"].includes(priority) && task.priority !== priority) {
        task.priority = priority;
        activityMessages.push(`set priority to ${priority}`);
      }

      if (dueDate) {
        const parsedDueDate = new Date(dueDate);

        if (Number.isNaN(parsedDueDate.getTime())) {
          res.status(400);
          throw new Error("Due date must be a valid date.");
        }

        task.dueDate = parsedDueDate;
      }

      if (assignedTo) {
        if (!mongoose.Types.ObjectId.isValid(assignedTo)) {
          res.status(400);
          throw new Error("Assigned user is invalid.");
        }

        const assigneeExists = project.members.some(
          (member) => member.user._id.toString() === assignedTo
        );

        if (!assigneeExists) {
          res.status(400);
          throw new Error("Assigned user must be part of the selected project.");
        }

        if (task.assignedTo?._id.toString() !== assignedTo) {
          const nextAssignee = project.members.find((member) => member.user._id.toString() === assignedTo);
          activityMessages.push(`reassigned task to ${nextAssignee.user.name}`);
        }

        task.assignedTo = assignedTo;
      }
    }

    if (typeof status === "string") {
      const normalizedStatus = resolveIncomingStatus(status);

      if (!normalizedStatus) {
        res.status(400);
        throw new Error("Status must be Todo, In Progress, or Completed.");
      }

      if (task.status !== normalizedStatus) {
        task.status = normalizedStatus;
        activityMessages.push(`changed status to ${normalizedStatus.replace("_", " ")}`);
      }
    }

    await task.save();
    await task.populate("assignedTo", "name email");
    await task.populate("createdBy", "name email");
    await task.populate("project", "name");

    if (activityMessages.length > 0) {
      await logActivity({
        actor: req.user._id,
        message: `${req.user.name} ${activityMessages.join(" and ")} for ${task.title}.`,
        project: project._id,
        task: task._id,
        type: "task_updated",
      });
    }

    res.json({
      message: "Task updated successfully.",
      task: serializeTask(task),
    });
  } catch (error) {
    next(error);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.taskId)) {
      res.status(404);
      throw new Error("Task not found.");
    }

    const task = await Task.findById(req.params.taskId).populate("assignedTo", "name email");

    if (!task) {
      res.status(404);
      throw new Error("Task not found.");
    }

    const project = await Project.findById(task.project).populate("members.user", "name email");

    if (!project) {
      res.status(404);
      throw new Error("Project not found.");
    }

    const role = getProjectRole(project, req.user._id);

    if (role !== "admin") {
      return res.status(403).json({
        message: "Only project admins can delete tasks.",
      });
    }

    const taskTitle = task.title;
    await task.deleteOne();

    await logActivity({
      actor: req.user._id,
      message: `${req.user.name} deleted task ${taskTitle}.`,
      project: project._id,
      type: "task_deleted",
    });

    res.json({
      message: "Task deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTask,
  deleteTask,
  updateTask,
};
