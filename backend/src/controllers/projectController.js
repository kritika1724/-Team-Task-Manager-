const mongoose = require("mongoose");
const Activity = require("../models/Activity");
const Project = require("../models/Project");
const Task = require("../models/Task");
const User = require("../models/User");
const { logActivity } = require("../services/activityService");
const { getProjectForUser } = require("../utils/projectAccess");
const {
  DEFAULT_ROLE_TITLES,
  getCustomRoleByName,
  getDefaultRoleTitle,
  getNormalizedCustomRoles,
  getProjectRoleOptions,
  matchesRoleName,
  normalizeCustomRoleName,
  normalizePermissionRole,
  resolveProjectRoleTitle,
  roleTitleExists,
} = require("../utils/projectRoles");
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
  roleTitle: member.roleTitle || "",
  displayRole: resolveProjectRoleTitle(member.role, member.roleTitle),
});

const resolveTaskAssigneeId = (task) => {
  if (!task?.assignedTo) {
    return null;
  }

  if (task.assignedTo._id) {
    return task.assignedTo._id.toString();
  }

  return task.assignedTo.toString();
};

const getVisibleTasksForRole = (tasks, role, userId) => {
  if (role === "admin") {
    return tasks;
  }

  const userIdString = userId.toString();
  return tasks.filter((task) => resolveTaskAssigneeId(task) === userIdString);
};

const ensureAdmin = (access, res, message) => {
  if (access.role === "admin") {
    return true;
  }

  res.status(403);
  throw new Error(message);
};

const validateProjectRoleTitle = (project, role, roleTitle, res) => {
  const normalizedTitle = normalizeCustomRoleName(roleTitle);

  if (!normalizedTitle) {
    return "";
  }

  if (!roleTitleExists(project, normalizedTitle)) {
    res.status(400);
    throw new Error("Define the custom project role first before assigning it.");
  }

  if (matchesRoleName(normalizedTitle, DEFAULT_ROLE_TITLES.admin) && role !== "admin") {
    res.status(400);
    throw new Error("Admin title must use admin access.");
  }

  if (matchesRoleName(normalizedTitle, DEFAULT_ROLE_TITLES.member) && role !== "member") {
    res.status(400);
    throw new Error("Member title must use member access.");
  }

  const customRole = getCustomRoleByName(project, normalizedTitle);

  if (customRole && customRole.permissionRole !== role) {
    res.status(400);
    throw new Error(`The role ${customRole.name} must use ${customRole.permissionRole} access.`);
  }

  if (matchesRoleName(normalizedTitle, getDefaultRoleTitle(role))) {
    return "";
  }

  return normalizedTitle;
};

const getProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({ "members.user": req.user._id })
      .populate("members.user", "name email")
      .sort({ updatedAt: -1 });

    const projectIds = projects.map((project) => project._id);
    const tasks = await Task.find({ project: { $in: projectIds } }, "project status dueDate assignedTo");
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
        const roleEntry = project.members.find(
          (member) => member.user._id.toString() === req.user._id.toString()
        );
        const visibleTasks = getVisibleTasksForRole(
          projectTasks,
          roleEntry?.role || "member",
          req.user._id
        );

        return {
          id: project._id,
          name: project.name,
          description: project.description,
          role: roleEntry?.role || "member",
          displayRole: resolveProjectRoleTitle(roleEntry?.role, roleEntry?.roleTitle),
          memberCount: project.members.length,
          summary: buildTaskSummary(visibleTasks),
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
          roleTitle: "",
        },
      ],
      customRoles: [],
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

    const visibleTasks = getVisibleTasksForRole(tasks, access.role, req.user._id);
    const visibleTaskIds = new Set(visibleTasks.map((task) => task._id.toString()));
    const members = access.project.members.map(serializeMember);
    const recentActivity = await Activity.find({ project: access.project._id })
      .populate("actor", "name email")
      .populate("project", "name")
      .populate("task", "title")
      .sort({ createdAt: -1 })
      .limit(12);
    const scopedActivity =
      access.role === "admin"
        ? recentActivity
        : recentActivity.filter((item) => {
            if (item.task?._id) {
              return visibleTaskIds.has(item.task._id.toString());
            }

            return item.actor?._id?.toString() === req.user._id.toString();
          });
    const analyticsMembers =
      access.role === "admin"
        ? members
        : members.filter((member) => member.id.toString() === req.user._id.toString());

    res.json({
      project: {
        id: access.project._id,
        name: access.project.name,
        description: access.project.description,
        role: access.role,
        displayRole: access.displayRole,
        roleOptions: getProjectRoleOptions(access.project),
        customRoles: getNormalizedCustomRoles(access.project),
        members,
        summary: buildTaskSummary(visibleTasks),
        memberAnalytics: buildMemberAnalytics(analyticsMembers, visibleTasks),
        recentActivity: scopedActivity.map(serializeActivity),
        tasks: visibleTasks.map(serializeTask),
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

    const { email, role = "member", roleTitle = "" } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedRole = normalizePermissionRole(role);

    if (!normalizedEmail) {
      res.status(400);
      throw new Error("Member email is required.");
    }

    if (!normalizedRole) {
      res.status(400);
      throw new Error("Role must be either admin or member.");
    }

    const normalizedRoleTitle = validateProjectRoleTitle(
      access.project,
      normalizedRole,
      roleTitle,
      res
    );

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
      roleTitle: normalizedRoleTitle,
    });
    await access.project.save();
    await access.project.populate("members.user", "name email");

    const assignedRoleLabel = resolveProjectRoleTitle(normalizedRole, normalizedRoleTitle);
    const roleSuffix = matchesRoleName(assignedRoleLabel, DEFAULT_ROLE_TITLES[normalizedRole])
      ? assignedRoleLabel
      : `${assignedRoleLabel} (${normalizedRole} access)`;

    await logActivity({
      actor: req.user._id,
      message: `${req.user.name} added ${memberUser.name} to ${access.project.name} as ${roleSuffix}.`,
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

const createCustomRole = async (req, res, next) => {
  try {
    const access = await getProjectForUser(req.params.projectId, req.user._id);

    if (!access) {
      res.status(404);
      throw new Error("Project not found or access denied.");
    }

    ensureAdmin(access, res, "Only project admins can define custom roles.");

    const normalizedRoleName = normalizeCustomRoleName(req.body?.name);
    const permissionRole = normalizePermissionRole(req.body?.permissionRole || "member");

    if (!normalizedRoleName) {
      res.status(400);
      throw new Error("Role name is required.");
    }

    if (!permissionRole) {
      res.status(400);
      throw new Error("Permission base must be admin or member.");
    }

    if (
      matchesRoleName(normalizedRoleName, DEFAULT_ROLE_TITLES.admin) ||
      matchesRoleName(normalizedRoleName, DEFAULT_ROLE_TITLES.member)
    ) {
      res.status(400);
      throw new Error("Admin and Member already exist as built-in access roles.");
    }

    const alreadyExists = getNormalizedCustomRoles(access.project).some((roleEntry) =>
      matchesRoleName(roleEntry.name, normalizedRoleName)
    );

    if (alreadyExists) {
      res.status(409);
      throw new Error("That custom role already exists for this project.");
    }

    access.project.customRoles.push({
      name: normalizedRoleName,
      permissionRole,
    });
    await access.project.save();

    await logActivity({
      actor: req.user._id,
      message: `${req.user.name} created the custom role ${normalizedRoleName} in ${access.project.name}.`,
      project: access.project._id,
      type: "project_updated",
    });

    res.status(201).json({
      message: "Custom role created successfully.",
      roleOptions: getProjectRoleOptions(access.project),
      customRoles: getNormalizedCustomRoles(access.project),
    });
  } catch (error) {
    next(error);
  }
};

const updateProjectMember = async (req, res, next) => {
  try {
    const access = await getProjectForUser(req.params.projectId, req.user._id);

    if (!access) {
      res.status(404);
      throw new Error("Project not found or access denied.");
    }

    ensureAdmin(access, res, "Only project admins can update member roles.");

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

    const nextRole =
      req.body?.role === undefined ? memberEntry.role : normalizePermissionRole(req.body.role);

    if (!nextRole) {
      res.status(400);
      throw new Error("Role must be either admin or member.");
    }

    if (access.project.owner.toString() === memberId.toString() && nextRole !== "admin") {
      res.status(400);
      throw new Error("Project owner must remain an admin.");
    }

    const adminCount = access.project.members.filter((member) => member.role === "admin").length;

    if (memberEntry.role === "admin" && nextRole !== "admin" && adminCount <= 1) {
      res.status(400);
      throw new Error("At least one admin must remain on the project.");
    }

    const nextRoleTitle =
      req.body?.roleTitle === undefined
        ? memberEntry.roleTitle || ""
        : validateProjectRoleTitle(access.project, nextRole, req.body.roleTitle, res);

    const currentDisplayRole = resolveProjectRoleTitle(memberEntry.role, memberEntry.roleTitle);
    const nextDisplayRole = resolveProjectRoleTitle(nextRole, nextRoleTitle);

    if (memberEntry.role === nextRole && (memberEntry.roleTitle || "") === nextRoleTitle) {
      return res.json({
        message: "Member role is already up to date.",
        members: access.project.members.map(serializeMember),
      });
    }

    memberEntry.role = nextRole;
    memberEntry.roleTitle = nextRoleTitle;
    await access.project.save();
    await access.project.populate("members.user", "name email");

    await logActivity({
      actor: req.user._id,
      message: `${req.user.name} updated ${memberEntry.user.name}'s role from ${currentDisplayRole} to ${nextDisplayRole}.`,
      project: access.project._id,
      type: "member_updated",
    });

    res.json({
      message: "Member role updated successfully.",
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
  createCustomRole,
  createProject,
  deleteProject,
  getProjectDetails,
  getProjects,
  removeProjectMember,
  updateProjectMember,
  updateProject,
};
