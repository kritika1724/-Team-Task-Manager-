import { useEffect, useState } from "react";

function ProjectCard({ project, isActive, onSelect }) {
  return (
    <button className={`project-card ${isActive ? "active" : ""}`} onClick={onSelect} type="button">
      <div className="project-card-top">
        <div>
          <h4>{project.name}</h4>
          <p className="subtle">{project.description || "No description yet"}</p>
        </div>
        <span className="role-pill">{project.displayRole || project.role}</span>
      </div>
      <div className="project-card-meta">
        <span>{project.memberCount} members</span>
        <span>{project.summary.totalTasks} tasks</span>
        <span>{project.summary.progressPercent}% progress</span>
      </div>
    </button>
  );
}

const formatDisplayLabel = (value) =>
  value.replace("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());

const createRoleOptionValue = (role = "member", roleTitle = "") =>
  `${role === "admin" ? "admin" : "member"}|${(roleTitle || "").trim()}`;

const formatActivityTime = (value) =>
  new Date(value).toLocaleString([], {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

function ProjectsView({
  customRoleForm,
  currentUserId,
  memberForm,
  onAddMember,
  onCreateCustomRole,
  onCreateProject,
  onCreateTask,
  onCustomRoleInput,
  onDeleteProject,
  onDeleteTask,
  onMemberInput,
  onProjectInput,
  onProjectSettingsInput,
  onRemoveMember,
  onSelectProject,
  onStatusChange,
  onTaskInput,
  onUpdateMember,
  onUpdateProject,
  projectDetail,
  projectForm,
  projectSettingsForm,
  projects,
  selectedProjectId,
  taskForm,
}) {
  const [filters, setFilters] = useState({
    assignedTo: "all",
    overdue: "all",
    priority: "all",
    status: "all",
  });
  const [memberEdits, setMemberEdits] = useState({});

  const canManageProject = projectDetail?.role === "admin";
  const summary = projectDetail?.summary || {
    completedTasks: 0,
    overdueTasks: 0,
    pendingTasks: 0,
    progressPercent: 0,
    totalTasks: 0,
  };
  const members = projectDetail?.members || [];
  const memberAnalytics = projectDetail?.memberAnalytics || [];
  const recentActivity = projectDetail?.recentActivity || [];
  const tasks = projectDetail?.tasks || [];
  const projectRoleOptions = projectDetail?.roleOptions || [
    { label: "Admin", permissionRole: "admin", roleTitle: "", value: "admin|" },
    { label: "Member", permissionRole: "member", roleTitle: "", value: "member|" },
  ];
  const customRoleEntries = projectDetail?.customRoles || [];

  useEffect(() => {
    const nextEdits = {};

    members.forEach((member) => {
      nextEdits[member.id] = {
        roleOption: createRoleOptionValue(member.role, member.roleTitle),
      };
    });

    setMemberEdits(nextEdits);
  }, [members]);
  const filteredTasks = tasks.filter((task) => {
    if (filters.status !== "all" && task.status !== filters.status) {
      return false;
    }

    if (filters.priority !== "all" && task.priority !== filters.priority) {
      return false;
    }

    if (filters.assignedTo !== "all" && task.assignedTo?.id !== filters.assignedTo) {
      return false;
    }

    if (filters.overdue === "only" && !task.isOverdue) {
      return false;
    }

    return true;
  });

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleMemberEditChange = (memberId, value) => {
    setMemberEdits((current) => ({
      ...current,
      [memberId]: {
        ...(current[memberId] || {}),
        roleOption: value,
      },
    }));
  };

  return (
    <section className="tab-panel active">
      <div className="projects-grid">
        <aside className="surface projects-sidebar">
          <div className="card-header project-sidebar-header">
            <div>
              <p className="eyebrow">Projects</p>
              <h3>Create and switch workspaces</h3>
              <p className="subtle helper-copy">
                Select a project to manage members, create tasks, and track progress.
              </p>
            </div>
            <span className="project-count-badge">{projects.length}</span>
          </div>

          <form className="stack-form" onSubmit={onCreateProject}>
            <label className="field">
              <span>Project name</span>
              <input
                name="name"
                onChange={onProjectInput}
                placeholder="Website redesign"
                value={projectForm.name}
              />
            </label>
            <label className="field">
              <span>Description</span>
              <textarea
                name="description"
                onChange={onProjectInput}
                placeholder="What is this project for?"
                rows="3"
                value={projectForm.description}
              />
            </label>
            <button className="primary-button" type="submit">
              Create Project
            </button>
          </form>

          <div className="project-list">
            {projects.length === 0 ? (
              <div className="empty-inline">
                <p>No projects yet. Create the first one to start assigning tasks.</p>
              </div>
            ) : (
              projects.map((project) => (
                <ProjectCard
                  isActive={project.id === selectedProjectId}
                  key={project.id}
                  onSelect={() => onSelectProject(project.id)}
                  project={project}
                />
              ))
            )}
          </div>
        </aside>

        <section className="surface project-workspace">
          {!projectDetail ? (
            <div className="empty-state">
              <div>
                <h3>Select a project</h3>
                <p>Choose a project from the left to view tasks, members, analytics, and activity.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="detail-header">
                <div>
                  <p className="eyebrow">Project Workspace</p>
                  <h3>{projectDetail.name}</h3>
                  <p className="subtle">{projectDetail.description || "No description provided yet."}</p>
                  <p className="section-note">
                    {canManageProject
                      ? "Admins can edit the project, manage team members, assign tasks, and delete tasks."
                      : "Members can view project work and update status only on tasks assigned to them."}
                  </p>
                </div>
                <span className="role-pill">{projectDetail.displayRole || projectDetail.role}</span>
              </div>

              <div className="detail-summary-grid detail-summary-grid-expanded">
                <article className="summary-box tone-sky">
                  <span>Total tasks</span>
                  <strong>{summary.totalTasks}</strong>
                </article>
                <article className="summary-box tone-sand">
                  <span>Pending</span>
                  <strong>{summary.pendingTasks}</strong>
                </article>
                <article className="summary-box tone-mint">
                  <span>Completed</span>
                  <strong>{summary.completedTasks}</strong>
                </article>
                <article className="summary-box tone-rose">
                  <span>Overdue</span>
                  <strong>{summary.overdueTasks}</strong>
                </article>
                <article className="summary-box tone-lavender">
                  <span>Progress</span>
                  <strong>{summary.progressPercent}%</strong>
                </article>
              </div>

              <div className="workspace-grid">
                <article className="workspace-panel-card">
                  <div className="card-header">
                    <div>
                      <p className="eyebrow">Team</p>
                      <h4>Project members</h4>
                    </div>
                  </div>

                  <div className="member-list">
                    {members.map((member) => (
                      <article className="member-card" key={member.id}>
                        <div className="member-row member-row-compact">
                          <div>
                            <strong>{member.name}</strong>
                            <p className="subtle">{member.email}</p>
                          </div>

                          <div className="member-actions">
                            <span className="meta-pill">{member.displayRole || member.role}</span>
                            <span className="meta-pill">
                              {member.role === "admin" ? "Admin access" : "Member access"}
                            </span>
                            {canManageProject && member.id !== currentUserId ? (
                              <button
                                className="text-button danger-text-button"
                                onClick={() => onRemoveMember(member.id)}
                                type="button"
                              >
                                Remove
                              </button>
                            ) : null}
                          </div>
                        </div>

                        {canManageProject ? (
                          <div className="member-role-editor">
                            <label className="field compact-field">
                              <span>Role</span>
                              <select
                                name="roleOption"
                                onChange={(event) => handleMemberEditChange(member.id, event.target.value)}
                                value={
                                  memberEdits[member.id]?.roleOption ||
                                  createRoleOptionValue(member.role, member.roleTitle)
                                }
                              >
                                {projectRoleOptions.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </label>

                            <button
                              className="secondary-button"
                              onClick={() => onUpdateMember(member.id, memberEdits[member.id])}
                              type="button"
                            >
                              Save Role
                            </button>
                          </div>
                        ) : null}
                      </article>
                    ))}
                  </div>

                  {canManageProject ? (
                    <>
                      <div className="role-library top-gap">
                        <p className="guide-title">Custom project roles</p>
                        <p className="subtle helper-copy">
                          Create roles like Designer, QA Lead, or Project Manager and choose
                          whether they behave like admin access or member access.
                        </p>

                        <div className="inline-role-list">
                          {projectRoleOptions.map((option) => (
                            <span className="meta-pill" key={option.value}>
                              {option.label}
                            </span>
                          ))}
                        </div>

                        <form className="inline-form top-gap" onSubmit={onCreateCustomRole}>
                          <label className="field">
                            <span>New custom role</span>
                            <input
                              name="name"
                              onChange={onCustomRoleInput}
                              placeholder="Designer"
                              value={customRoleForm.name}
                            />
                          </label>
                          <label className="field">
                            <span>Permission base</span>
                            <select
                              name="permissionRole"
                              onChange={onCustomRoleInput}
                              value={customRoleForm.permissionRole}
                            >
                              <option value="member">Member access</option>
                              <option value="admin">Admin access</option>
                            </select>
                          </label>
                          <button className="secondary-button" type="submit">
                            Add Role
                          </button>
                        </form>

                        {customRoleEntries.length > 0 ? (
                          <div className="data-list top-gap">
                            {customRoleEntries.map((roleEntry) => (
                              <article className="data-row-card" key={`${roleEntry.name}-${roleEntry.permissionRole}`}>
                                <div className="data-row-header">
                                  <div>
                                    <strong>{roleEntry.name}</strong>
                                    <p className="subtle">
                                      {roleEntry.permissionRole === "admin"
                                        ? "Admin access"
                                        : "Member access"}
                                    </p>
                                  </div>
                                </div>
                              </article>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      <form className="stack-form top-gap" onSubmit={onAddMember}>
                        <label className="field">
                          <span>Add member by email</span>
                          <input
                            name="email"
                            onChange={onMemberInput}
                            placeholder="member@example.com"
                            value={memberForm.email}
                          />
                        </label>
                        <label className="field">
                          <span>Access level</span>
                          <select name="roleOption" onChange={onMemberInput} value={memberForm.roleOption}>
                            {projectRoleOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <button className="secondary-button" type="submit">
                          Add Member
                        </button>
                      </form>
                    </>
                  ) : null}
                </article>

                <article className="workspace-panel-card">
                  <div className="card-header">
                    <div>
                      <p className="eyebrow">Project Settings</p>
                      <h4>{canManageProject ? "Edit or delete project" : "Project overview"}</h4>
                    </div>
                  </div>

                  {canManageProject ? (
                    <form className="stack-form" onSubmit={onUpdateProject}>
                      <label className="field">
                        <span>Project name</span>
                        <input
                          name="name"
                          onChange={onProjectSettingsInput}
                          value={projectSettingsForm.name}
                        />
                      </label>
                      <label className="field">
                        <span>Description</span>
                        <textarea
                          name="description"
                          onChange={onProjectSettingsInput}
                          rows="3"
                          value={projectSettingsForm.description}
                        />
                      </label>
                      <div className="inline-actions">
                        <button className="secondary-button" type="submit">
                          Save Changes
                        </button>
                        <button className="ghost-button danger-outline-button" onClick={onDeleteProject} type="button">
                          Delete Project
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="info-stack">
                      <span className="meta-pill">{members.length} team members</span>
                      <span className="meta-pill">{summary.progressPercent}% project progress</span>
                      <span className="meta-pill">{summary.overdueTasks} overdue tasks</span>
                    </div>
                  )}
                </article>

                <article className="workspace-panel-card full-span-panel">
                  <div className="card-header">
                    <div>
                      <p className="eyebrow">{canManageProject ? "Task Setup" : "Task Management"}</p>
                      <h4>{canManageProject ? "Create and assign work" : "Track your assigned work"}</h4>
                      <p className="subtle helper-copy">
                        {canManageProject
                          ? "Set task owner, description, deadline, and priority in one place."
                          : "Members can update status on assigned tasks. Admins control assignment and deletion."}
                      </p>
                    </div>
                  </div>

                  {canManageProject ? (
                    <form className="task-form" onSubmit={onCreateTask}>
                      <div className="task-form-grid">
                        <label className="field">
                          <span>Task title</span>
                          <input
                            name="title"
                            onChange={onTaskInput}
                            placeholder="Fix login bug before demo"
                            value={taskForm.title}
                          />
                        </label>
                        <label className="field">
                          <span>Assign to</span>
                          <select name="assignedTo" onChange={onTaskInput} value={taskForm.assignedTo}>
                            <option value="">Select member</option>
                            {members.map((member) => (
                              <option key={member.id} value={member.id}>
                                {member.name} ({member.displayRole || member.role})
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="field">
                          <span>Priority</span>
                          <select name="priority" onChange={onTaskInput} value={taskForm.priority}>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </label>
                        <label className="field">
                          <span>Due date</span>
                          <input name="dueDate" onChange={onTaskInput} type="date" value={taskForm.dueDate} />
                        </label>
                      </div>

                      <label className="field">
                        <span>Description</span>
                        <textarea
                          name="description"
                          onChange={onTaskInput}
                          placeholder="Describe the expected outcome"
                          rows="3"
                          value={taskForm.description}
                        />
                      </label>

                      <button className="primary-button" type="submit">
                        Create Task
                      </button>
                    </form>
                  ) : (
                    <div className="empty-inline">
                      <p>Use the task board below to update status on the tasks assigned to you.</p>
                    </div>
                  )}
                </article>

                <article className="workspace-panel-card">
                  <div className="card-header">
                    <div>
                      <p className="eyebrow">Member Analytics</p>
                      <h4>Workload and completion</h4>
                    </div>
                  </div>

                  <div className="data-list">
                    {memberAnalytics.length === 0 ? (
                      <div className="empty-inline">
                        <p>Analytics will appear once members have assigned tasks.</p>
                      </div>
                    ) : (
                      memberAnalytics.map((member) => (
                            <article className="data-row-card" key={member.id}>
                          <div className="data-row-header">
                            <div>
                              <strong>{member.name}</strong>
                              <p className="subtle">{member.displayRole || member.role}</p>
                            </div>
                            <span className="meta-pill">{member.completionRate}%</span>
                          </div>
                          <div className="mini-stat-row">
                            <span>{member.assignedTasks} assigned</span>
                            <span>{member.openTasks} open</span>
                            <span>{member.overdueTasks} overdue</span>
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                </article>

                <article className="workspace-panel-card">
                  <div className="card-header">
                    <div>
                      <p className="eyebrow">Activity Timeline</p>
                      <h4>Recent project actions</h4>
                    </div>
                  </div>

                  <div className="timeline-list">
                    {recentActivity.length === 0 ? (
                      <div className="empty-inline">
                        <p>Timeline activity will appear as the project changes.</p>
                      </div>
                    ) : (
                      recentActivity.map((item) => (
                        <article className="timeline-item" key={item.id}>
                          <div className="timeline-dot"></div>
                          <div>
                            <strong>{item.message}</strong>
                            <p className="subtle">{formatActivityTime(item.createdAt)}</p>
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                </article>

                <article className="workspace-panel-card task-board-panel">
                  <div className="card-header">
                    <div>
                      <p className="eyebrow">Task Board</p>
                      <h4>All project tasks</h4>
                      <p className="subtle helper-copy">
                        Filter by status, priority, assignee, or overdue risk to inspect work quickly.
                      </p>
                    </div>
                  </div>

                  <div className="filter-grid">
                    <label className="field">
                      <span>Status</span>
                      <select name="status" onChange={handleFilterChange} value={filters.status}>
                        <option value="all">All</option>
                        <option value="todo">Todo</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </label>
                    <label className="field">
                      <span>Priority</span>
                      <select name="priority" onChange={handleFilterChange} value={filters.priority}>
                        <option value="all">All</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </label>
                    <label className="field">
                      <span>Assigned member</span>
                      <select name="assignedTo" onChange={handleFilterChange} value={filters.assignedTo}>
                        <option value="all">All</option>
                        {members.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      <span>Overdue</span>
                      <select name="overdue" onChange={handleFilterChange} value={filters.overdue}>
                        <option value="all">All</option>
                        <option value="only">Only overdue</option>
                      </select>
                    </label>
                  </div>

                  <div className="task-board">
                    {filteredTasks.length === 0 ? (
                      <div className="empty-inline">
                        <p>No tasks match the current filters.</p>
                      </div>
                    ) : (
                      filteredTasks.map((task) => {
                        const canUpdateStatus =
                          projectDetail.role === "admin" || task.assignedTo?.id === currentUserId;

                        return (
                          <article className="task-item" key={task.id}>
                            <div className="task-item-top">
                              <div>
                                <h4>{task.title}</h4>
                                <p className="subtle">{task.description || "No description provided."}</p>
                              </div>
                              <div className="task-card-actions">
                                <span className={`status-pill status-${task.status}`}>
                                  {formatDisplayLabel(task.status)}
                                </span>
                                {canManageProject ? (
                                  <button
                                    className="text-button danger-text-button"
                                    onClick={() => onDeleteTask(task.id)}
                                    type="button"
                                  >
                                    Delete
                                  </button>
                                ) : null}
                              </div>
                            </div>

                            <div className="task-meta-row">
                              <span className="meta-pill">Assigned: {task.assignedTo?.name || "Unknown"}</span>
                              <span className="meta-pill">Priority: {formatDisplayLabel(task.priority)}</span>
                              <span className={`risk-pill risk-${task.riskLevel}`}>{task.riskLevel} risk</span>
                              <span className="meta-pill">
                                Due: {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                              <span className="meta-pill">
                                Suggested: {formatDisplayLabel(task.suggestedPriority)}
                              </span>
                            </div>

                            <div className="task-status-row">
                              <label className="field">
                                <span>Status</span>
                                <select
                                  disabled={!canUpdateStatus}
                                  onChange={(event) => onStatusChange(task.id, event.target.value)}
                                  value={task.status}
                                >
                                  <option value="todo">Todo</option>
                                  <option value="in_progress">In Progress</option>
                                  <option value="completed">Completed</option>
                                </select>
                              </label>
                            </div>
                          </article>
                        );
                      })
                    )}
                  </div>
                </article>
              </div>
            </>
          )}
        </section>
      </div>
    </section>
  );
}

export default ProjectsView;
