const DEFAULT_ROLE_TITLES = {
  admin: "Admin",
  member: "Member",
};

const normalizeCustomRoleName = (value = "") =>
  value
    .trim()
    .replace(/\|/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 40);

const normalizePermissionRole = (value = "member") =>
  value === "admin" ? "admin" : value === "member" ? "member" : null;

const getDefaultRoleTitle = (role = "member") =>
  DEFAULT_ROLE_TITLES[normalizePermissionRole(role)] || DEFAULT_ROLE_TITLES.member;

const resolveProjectRoleTitle = (role = "member", roleTitle = "") => {
  const normalizedTitle = normalizeCustomRoleName(roleTitle);
  return normalizedTitle || getDefaultRoleTitle(role);
};

const matchesRoleName = (first = "", second = "") =>
  normalizeCustomRoleName(first).toLowerCase() === normalizeCustomRoleName(second).toLowerCase();

const normalizeCustomRoleEntry = (entry) => {
  if (!entry) {
    return null;
  }

  if (typeof entry === "string") {
    const name = normalizeCustomRoleName(entry);

    if (!name) {
      return null;
    }

    return {
      name,
      permissionRole: "member",
    };
  }

  const name = normalizeCustomRoleName(entry.name || entry.roleTitle || "");
  const permissionRole = normalizePermissionRole(entry.permissionRole || entry.role || "member");

  if (!name || !permissionRole) {
    return null;
  }

  return {
    name,
    permissionRole,
  };
};

const getNormalizedCustomRoles = (project) => {
  const entries = Array.isArray(project?.customRoles) ? project.customRoles : [];
  const normalized = [];

  entries.forEach((entry) => {
    const resolved = normalizeCustomRoleEntry(entry);

    if (!resolved) {
      return;
    }

    const duplicate = normalized.some(
      (item) =>
        matchesRoleName(item.name, resolved.name) &&
        item.permissionRole === resolved.permissionRole
    );

    if (!duplicate) {
      normalized.push(resolved);
    }
  });

  return normalized;
};

const getCustomRoleByName = (project, roleTitle = "") => {
  const normalizedTitle = normalizeCustomRoleName(roleTitle);

  if (!normalizedTitle) {
    return null;
  }

  return (
    getNormalizedCustomRoles(project).find((entry) => matchesRoleName(entry.name, normalizedTitle)) || null
  );
};

const encodeRoleOptionValue = (permissionRole, roleTitle = "") =>
  `${normalizePermissionRole(permissionRole) || "member"}|${normalizeCustomRoleName(roleTitle)}`;

const getProjectRoleOptions = (project) => {
  const customRoles = getNormalizedCustomRoles(project).map((entry) => ({
    value: encodeRoleOptionValue(entry.permissionRole, entry.name),
    label: entry.name,
    permissionRole: entry.permissionRole,
    roleTitle: entry.name,
  }));

  return [
    {
      value: encodeRoleOptionValue("admin"),
      label: DEFAULT_ROLE_TITLES.admin,
      permissionRole: "admin",
      roleTitle: "",
    },
    {
      value: encodeRoleOptionValue("member"),
      label: DEFAULT_ROLE_TITLES.member,
      permissionRole: "member",
      roleTitle: "",
    },
    ...customRoles,
  ];
};

const roleTitleExists = (project, roleTitle = "") => {
  const normalizedTitle = normalizeCustomRoleName(roleTitle);

  if (!normalizedTitle) {
    return true;
  }

  if (
    matchesRoleName(normalizedTitle, DEFAULT_ROLE_TITLES.admin) ||
    matchesRoleName(normalizedTitle, DEFAULT_ROLE_TITLES.member)
  ) {
    return true;
  }

  return getNormalizedCustomRoles(project).some((entry) => matchesRoleName(entry.name, normalizedTitle));
};

module.exports = {
  DEFAULT_ROLE_TITLES,
  encodeRoleOptionValue,
  getCustomRoleByName,
  getDefaultRoleTitle,
  getNormalizedCustomRoles,
  getProjectRoleOptions,
  matchesRoleName,
  normalizeCustomRoleEntry,
  normalizeCustomRoleName,
  normalizePermissionRole,
  resolveProjectRoleTitle,
  roleTitleExists,
};
