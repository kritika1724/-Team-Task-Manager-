const mongoose = require("mongoose");
const Activity = require("../models/Activity");
const Project = require("../models/Project");
const Task = require("../models/Task");
const User = require("../models/User");
const { logActivity } = require("../services/activityService");
const { getProjectForUser } = require("../utils/projectAccess");
const {
  buildMemberAnalytics,
  buildTaskSummary,
  serializeActivity,
  serializeTask,
} = require("../utils/taskInsights");

const serializeMember = (member) => ({
  id: member.user._id,
  name: member.user.name,
  email: member.user.email,
  role: member.role,
});

const ensureAdmin = (access, res, message) => {
  if (access.role === "admin") {
    return true;
  }

  res.status(403);
  throw new Error(message);
};

const getProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({ "members.user": req.user._id })
      .populate("members.user", "name email")
      .sort({ updatedAt: -1 });

    const projectIds = projects.map((project) => project._id);
    const tasks = await Task.find({ project: { $in: projectIds } }, "project status dueDate");
    const tasksByProject = new Map();

    tasks.forEach((task) => {
      const key = task.project.toString();

      if (!tasksByProject.has(key)) {
        tasksByProject.set(key, []);
      }

      tasksByProject.get(key).push(task);
    });

    res.json({
      projects: projects.map((project) => {
        const projectTasks = tasksByProject.get(project._id.toString()) || [];
        const summary = buildTaskSummary(projectTasks);
        const role = project.members.find(
          (member) => member.user._id.toString() === req.user._id.toString()
        )?.role;

        return {
          id: project._id,
          name: project.name,
          description: project.description,
          role,
          memberCount: project.members.length,
          summary,
          updatedAt: project.updatedAt,
        };
      }),
    });
  } catch (error) {
    next(error);
  }
};

const createProject = async (req, res, next) => {
  try {
    const { name, description = "" } = req.body;
    const trimmedName = name?.trim();

    if (!trimmedName) {
      res.status(400);
      throw new Error("Project name is required.");
    }

    const project = await Project.create({
      name: trimmedName,
      description: typeof description === "string" ? description.trim() : "",
      owner: req.user._id,
      members: [
        {
          user: req.user._id,
          role: "admin",
        },
      ],
    });

    await logActivity({
      actor: req.user._id,
      message: `${req.user.name} created the project ${project.name}.`,
      project: project._id,
      type: "project_created",
    });

    res.status(201).json({
      message: "Project created successfully.",
      project: {
        id: project._id,
        name: project.name,
        description: project.description,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getProjectDetails = async (req, res, next) => {
  try {
    const access = await getProjectForUser(req.params.projectId, req.user._id);

    if (!access) {
      res.status(404);
      throw new Error("Project not found or access denied.");
    }

    const tasks = await Task.find({ project: access.project._id })
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .sort({ dueDate: 1, createdAt: -1 });

    const members = access.project.members.map(serializeMember);
    const recentActivity = await Activity.find({ project: access.project._id })
      .populate("actor", "name email")
      .populate("project", "name")
      .populate("task", "title")
      .sort({ createdAt: -1 })
      .limit(12);

    res.json({
      project: {
        id: access.project._id,
        name: access.project.name,
        description: access.project.description,
        role: access.role,
        members,
        summary: buildTaskSummary(tasks),
        memberAnalytics: buildMemberAnalytics(members, tasks),
        recentActivity: recentActivity.map(serializeActivity),
        tasks: tasks.map(serializeTask),
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateProject = async (req, res, next) => {
  try {
    const access = await getProjectForUser(req.params.projectId, req.user._id);

    if (!access) {
      res.status(404);
      throw new Error("Project not found or access denied.");
    }

    ensureAdmin(access, res, "Only project admins can update project details.");

    const { name, description } = req.body;
    const updates = [];

    if (typeof name === "string" && name.trim() && access.project.name !== name.trim()) {
      access.project.name = name.trim();
      updates.push("name");
    }

    if (typeof description === "string" && access.project.description !== description.trim()) {
      access.project.description = description.trim();
      updates.push("description");
    }

    await access.project.save();

    if (updates.length > 0) {
      await logActivity({
        actor: req.user._id,
        message: `${req.user.name} updated ${updates.join(" and ")} for ${access.project.name}.`,
        project: access.project._id,
        type: "project_updated",
      });
    }

    res.json({
      message: "Project updated successfully.",
      project: {
        id: access.project._id,
        name: access.project.name,
        description: access.project.description,
      },
    });
  } catch (error) {
    next(error);
  }
};

const deleteProject = async (req, res, next) => {
  try {
    const access = await getProjectForUser(req.params.projectId, req.user._id);

    if (!access) {
      res.status(404);
      throw new Error("Project not found or access denied.");
    }

    ensureAdmin(access, res, "Only project admins can delete a project.");

    await Task.deleteMany({ project: access.project._id });
    await Activity.deleteMany({ project: access.project._id });
    await access.project.deleteOne();

    res.json({
      message: "Project deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

const addProjectMember = async (req, res, next) => {
  try {
    const access = await getProjectForUser(req.params.projectId, req.user._id);

    if (!access) {
      res.status(404);
      throw new Error("Project not found or access denied.");
    }

    ensureAdmin(access, res, "Only project admins can add members.");

    const { email, role = "member" } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedRole = role === "admin" ? "admin" : role === "member" ? "member" : null;

    if (!normalizedEmail) {
      res.status(400);
      throw new Error("Member email is required.");
    }

    if (!normalizedRole) {
      res.status(400);
      throw new Error("Role must be either admin or member.");
    }

    const memberUser = await User.findOne({ email: normalizedEmail });

    if (!memberUser) {
      res.status(404);
      throw new Error("No user found with that email.");
    }

    const alreadyExists = access.project.members.some(
      (member) => member.user._id.toString() === memberUser._id.toString()
    );

    if (alreadyExists) {
      res.status(409);
      throw new Error("That user is already part of this project.");
    }

    access.project.members.push({
      user: memberUser._id,
      role: normalizedRole,
    });
    await access.project.save();
    await access.project.populate("members.user", "name email");

    await logActivity({
      actor: req.user._id,
      message: `${req.user.name} added ${memberUser.name} to ${access.project.name} as ${normalizedRole}.`,
      project: access.project._id,
      type: "member_added",
    });

    res.status(201).json({
      message: "Member added successfully.",
      members: access.project.members.map(serializeMember),
    });
  } catch (error) {
    next(error);
  }
};

const removeProjectMember = async (req, res, next) => {
  try {
    const access = await getProjectForUser(req.params.projectId, req.user._id);

    if (!access) {
      res.status(404);
      throw new Error("Project not found or access denied.");
    }

    ensureAdmin(access, res, "Only project admins can remove members.");

    const { memberId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      res.status(404);
      throw new Error("Member not found.");
    }

    const memberEntry = access.project.members.find(
      (member) => member.user._id.toString() === memberId.toString()
    );

    if (!memberEntry) {
      res.status(404);
      throw new Error("Member not found in this project.");
    }

    if (access.project.owner.toString() === memberId.toString()) {
      res.status(400);
      throw new Error("Project owner cannot be removed.");
    }

    const assignedTasksCount = await Task.countDocuments({
      project: access.project._id,
      assignedTo: memberId,
    });

    if (assignedTasksCount > 0) {
      res.status(400);
      throw new Error("Reassign this member's tasks before removing them from the project.");
    }

    const adminCount = access.project.members.filter((member) => member.role === "admin").length;

    if (memberEntry.role === "admin" && adminCount <= 1) {
      res.status(400);
      throw new Error("At least one admin must remain on the project.");
    }

    const removedUserName = memberEntry.user.name;
    access.project.members = access.project.members.filter(
      (member) => member.user._id.toString() !== memberId.toString()
    );
    await access.project.save();
    await access.project.populate("members.user", "name email");

    await logActivity({
      actor: req.user._id,
      message: `${req.user.name} removed ${removedUserName} from ${access.project.name}.`,
      project: access.project._id,
      type: "member_removed",
    });

    res.json({
      message: "Member removed successfully.",
      members: access.project.members.map(serializeMember),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addProjectMember,
  createProject,
  deleteProject,
  getProjectDetails,
  getProjects,
  removeProjectMember,
  updateProject,
};
