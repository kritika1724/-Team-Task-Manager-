const mongoose = require("mongoose");
const Project = require("../models/Project");
const { resolveProjectRoleTitle } = require("./projectRoles");

const resolveMemberUserId = (member) => {
  if (!member?.user) {
    return null;
  }

  if (member.user._id) {
    return member.user._id.toString();
  }

  return member.user.toString();
};

const getProjectRole = (project, userId) => {
  const userIdString = userId.toString();
  const member = project.members.find((entry) => resolveMemberUserId(entry) === userIdString);
  return member?.role || null;
};

const getProjectMemberEntry = (project, userId) => {
  const userIdString = userId.toString();
  return project.members.find((entry) => resolveMemberUserId(entry) === userIdString) || null;
};

const getProjectForUser = async (projectId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return null;
  }

  const project = await Project.findById(projectId).populate("members.user", "name email");

  if (!project) {
    return null;
  }

  const member = getProjectMemberEntry(project, userId);
  const role = member?.role || null;

  if (!role) {
    return null;
  }

  return {
    project,
    role,
    roleTitle: member?.roleTitle || "",
    displayRole: resolveProjectRoleTitle(member?.role, member?.roleTitle),
    member,
  };
};

module.exports = {
  getProjectMemberEntry,
  getProjectRole,
  getProjectForUser,
};
