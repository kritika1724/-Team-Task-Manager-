const Activity = require("../models/Activity");

const logActivity = async ({ actor, message, project, task = null, type }) => {
  if (!actor || !project || !message || !type) {
    return null;
  }

  return Activity.create({
    actor,
    message,
    project,
    task,
    type,
  });
};

module.exports = {
  logActivity,
};
