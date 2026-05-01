function HeroPanel({ projectCount = 0, selectedProject, summary, user }) {
  const firstName = user?.name?.split(" ")[0] || "there";
  const hasProjects = projectCount > 0;
  const selectedSummary = selectedProject?.summary || {
    overdueTasks: 0,
    pendingTasks: 0,
    totalTasks: 0,
  };

  if (!user) {
    return (
      <section className="story-panel public-story-panel">
        <div className="hero-badge-row">
          <span className="hero-badge">Team Task Manager</span>
          <span className="hero-badge ghost">Built for collaborative teams</span>
        </div>

        <div className="brand-block hero-brand">
          <div className="brand-mark">TP</div>
          <div>
            <p className="brand-name">TaskPilot</p>
            <p className="brand-subtitle">Built for clear ownership and smooth execution</p>
          </div>
        </div>

        <h1>Run projects with clarity, not chaos.</h1>
        <p className="lead">
          A simple workspace for creating projects, assigning tasks, tracking deadlines, and
          keeping every teammate aligned on what needs to happen next.
        </p>

        <div className="public-proof-grid">
          <article className="public-proof-card">
            <span>Access model</span>
            <strong>Admin and Member roles</strong>
          </article>
          <article className="public-proof-card">
            <span>Workflow</span>
            <strong>Projects, tasks, status, overdue</strong>
          </article>
        </div>

        <div className="public-flow-card">
          <div className="public-flow-item">
            <span>01</span>
            <div>
              <strong>Create a project</strong>
              <p>Start a workspace with clear scope and ownership.</p>
            </div>
          </div>
          <div className="public-flow-item">
            <span>02</span>
            <div>
              <strong>Add teammates</strong>
              <p>Invite members by email and assign the right role.</p>
            </div>
          </div>
          <div className="public-flow-item">
            <span>03</span>
            <div>
              <strong>Track execution</strong>
              <p>Update task status and catch overdue work early.</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="story-panel compact-story-panel surface">
      <div className="brand-block">
        <div className="brand-mark">TP</div>
        <div>
          <p className="brand-name">TaskPilot</p>
          <p className="brand-subtitle">Workspace overview</p>
        </div>
      </div>

      <p className="eyebrow">Quick Summary</p>
      <h2>{hasProjects ? `Welcome back, ${firstName}` : `Hi ${firstName}, start your first project`}</h2>
      <p className="lead">
        {hasProjects
          ? "Use the dashboard for visibility and the projects tab for members, assignments, and status updates."
          : "Create your first project to unlock member management, task assignment, and project tracking."}
      </p>

      <div className="overview-stat-grid">
        <article className="overview-stat tone-sky">
          <span>Projects</span>
          <strong>{projectCount}</strong>
        </article>
        <article className="overview-stat tone-peach">
          <span>Open tasks</span>
          <strong>{summary?.myOpenTasks || 0}</strong>
        </article>
        <article className="overview-stat tone-rose">
          <span>Overdue</span>
          <strong>{summary?.overdueTasks || 0}</strong>
        </article>
        <article className="overview-stat tone-lavender">
          <span>Current role</span>
          <strong>{selectedProject?.displayRole || selectedProject?.role || "None"}</strong>
        </article>
      </div>

      <div className="guide-card">
        <p className="guide-title">{selectedProject ? selectedProject.name : "Quick start"}</p>
        <div className="checklist">
          <div className="check-item">Create or select a project from the Projects tab.</div>
          <div className="check-item">Add members before assigning work.</div>
          <div className="check-item">Use the dashboard to catch overdue tasks fast.</div>
        </div>
      </div>

      {selectedProject ? (
        <div className="current-project-card">
          <p className="guide-title">Current project snapshot</p>
          <div className="current-project-meta">
            <span>{selectedSummary.totalTasks} total tasks</span>
            <span>{selectedSummary.pendingTasks} pending</span>
            <span>{selectedSummary.overdueTasks} overdue</span>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default HeroPanel;
