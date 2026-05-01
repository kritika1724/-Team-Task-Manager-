const formatStatusLabel = (value) =>
  value === "inProgress" ? "In progress" : value.charAt(0).toUpperCase() + value.slice(1);

const formatDateTime = (value) =>
  new Date(value).toLocaleString([], {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

function TaskList({ tasks, emptyMessage, title }) {
  return (
    <article className="surface dashboard-panel">
      <div className="card-header">
        <div>
          <p className="eyebrow">{title}</p>
          <h3>{title === "My Tasks" ? "Assigned work at a glance" : "Immediate follow-up items"}</h3>
        </div>
      </div>

      <div className="dashboard-task-list">
        {tasks.length === 0 ? (
          <div className="empty-inline">
            <p>{emptyMessage}</p>
          </div>
        ) : (
          tasks.map((task) => (
            <article className="task-item" key={task.id}>
              <div className="task-item-top">
                <div>
                  <h4>{task.title}</h4>
                  <p className="subtle">{task.project?.name || "Project unavailable"}</p>
                </div>
                <span className={`status-pill status-${task.status}`}>{task.status.replace("_", " ")}</span>
              </div>

              <div className="task-meta-row">
                <span className="meta-pill">Priority: {task.priority}</span>
                <span className={`risk-pill risk-${task.riskLevel}`}>{task.riskLevel} risk</span>
                <span className="meta-pill">
                  Due: {new Date(task.dueDate).toLocaleDateString()}
                </span>
              </div>
            </article>
          ))
        )}
      </div>
    </article>
  );
}

function MemberAnalyticsPanel({ members }) {
  return (
    <article className="surface dashboard-panel">
      <div className="card-header">
        <div>
          <p className="eyebrow">Team Analytics</p>
          <h3>Member-wise workload</h3>
        </div>
      </div>

      <div className="data-list">
        {members.length === 0 ? (
          <div className="empty-inline">
            <p>Member analytics will appear once tasks are assigned.</p>
          </div>
        ) : (
          members.slice(0, 6).map((member) => (
            <article className="data-row-card" key={member.id}>
              <div className="data-row-header">
                <div>
                  <strong>{member.name}</strong>
                  <p className="subtle">{member.displayRole || member.role}</p>
                </div>
                <span className="meta-pill">{member.completionRate}% complete</span>
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
  );
}

function ProjectAnalyticsPanel({ projects }) {
  return (
    <article className="surface dashboard-panel">
      <div className="card-header">
        <div>
          <p className="eyebrow">Project Analytics</p>
          <h3>Progress by project</h3>
        </div>
      </div>

      <div className="data-list">
        {projects.length === 0 ? (
          <div className="empty-inline">
            <p>Create a project to start tracking team progress.</p>
          </div>
        ) : (
          projects.slice(0, 6).map((project) => (
            <article className="data-row-card" key={project.id}>
              <div className="data-row-header">
                <div>
                  <strong>{project.name}</strong>
                  <p className="subtle">
                    {project.memberCount} members • {project.totalTasks} tasks
                  </p>
                </div>
                <span className="meta-pill">{project.progressPercent}%</span>
              </div>

              <div className="progress-track">
                <span className="progress-fill" style={{ width: `${project.progressPercent}%` }}></span>
              </div>

              <div className="mini-stat-row">
                <span>{project.pendingTasks} pending</span>
                <span>{project.completedTasks} completed</span>
                <span>{project.overdueTasks} overdue</span>
              </div>
            </article>
          ))
        )}
      </div>
    </article>
  );
}

function ActivityPanel({ activity }) {
  return (
    <article className="surface dashboard-panel activity-panel">
      <div className="card-header">
        <div>
          <p className="eyebrow">Activity Timeline</p>
          <h3>Recent workspace actions</h3>
        </div>
      </div>

      <div className="timeline-list">
        {activity.length === 0 ? (
          <div className="empty-inline">
            <p>Activity will appear here as projects, members, and tasks are updated.</p>
          </div>
        ) : (
          activity.map((item) => (
            <article className="timeline-item" key={item.id}>
              <div className="timeline-dot"></div>
              <div>
                <strong>{item.message}</strong>
                <p className="subtle">
                  {item.project?.name ? `${item.project.name} • ` : ""}
                  {formatDateTime(item.createdAt)}
                </p>
              </div>
            </article>
          ))
        )}
      </div>
    </article>
  );
}

function DashboardView({ dashboard }) {
  const {
    adminInsights = {},
    memberAnalytics = [],
    myTasks = [],
    overdueTasks = [],
    projectAnalytics = [],
    recentActivity = [],
    summary = { tasksByStatus: {} },
  } = dashboard || {};
  const statusEntries = Object.entries(summary.tasksByStatus || {});
  const focusTitle =
    summary.overdueTasks > 0
      ? `${summary.overdueTasks} overdue task${summary.overdueTasks > 1 ? "s" : ""} need attention`
      : summary.pendingTasks > 0
        ? `${summary.pendingTasks} pending task${summary.pendingTasks > 1 ? "s" : ""} in progress`
        : "No pending work right now";
  const focusCopy =
    summary.overdueTasks > 0
      ? "Clear overdue items first, then move the remaining work forward from the projects tab."
      : "Your dashboard now shows overall delivery health, member workload, and recent activity.";

  return (
    <section className="tab-panel active">
      <article className="surface dashboard-overview">
        <div className="dashboard-focus">
          <p className="eyebrow">Dashboard</p>
          <h3>{focusTitle}</h3>
          <p className="subtle">{focusCopy}</p>

          <div className="insight-callouts">
            <span className="meta-pill">Completion rate: {summary.completionRate}%</span>
            <span className="meta-pill">Overdue share: {summary.overduePercentage}%</span>
            {adminInsights?.busiestMember ? (
              <span className="meta-pill">Busiest member: {adminInsights.busiestMember.name}</span>
            ) : null}
            {adminInsights?.delayedProject ? (
              <span className="meta-pill">Delayed project: {adminInsights.delayedProject.name}</span>
            ) : null}
          </div>
        </div>

        <div className="status-summary-grid">
          {statusEntries.map(([statusKey, count]) => (
            <article className={`insight-card tone-${statusKey}`} key={statusKey}>
              <span>{formatStatusLabel(statusKey)}</span>
              <strong>{count}</strong>
            </article>
          ))}
        </div>
      </article>

      <div className="analytics-grid">
        <MemberAnalyticsPanel members={memberAnalytics} />
        <ProjectAnalyticsPanel projects={projectAnalytics} />
      </div>

      <div className="dashboard-grid">
        <TaskList emptyMessage="You do not have any assigned tasks yet." tasks={myTasks} title="My Tasks" />
        <TaskList
          emptyMessage="No overdue tasks right now. Nice work."
          tasks={overdueTasks}
          title="Overdue"
        />
      </div>

      <ActivityPanel activity={recentActivity} />
    </section>
  );
}

export default DashboardView;
