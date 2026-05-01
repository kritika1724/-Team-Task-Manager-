import { useEffect } from "react";

function GuideModal({
  onClose,
  onGoToDashboard,
  onGoToProjects,
  open,
  projects = [],
  selectedProject,
  summary,
  user,
}) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeydown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeydown);

    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  const firstName = user?.name?.split(" ")[0] || "there";
  const projectCount = projects.length;
  const nextStep = !user
    ? "Create your account first, then sign in to open your workspace."
    : projectCount === 0
      ? "Start by creating your first project from the Projects tab."
      : !selectedProject
        ? "Pick a project from the Projects tab to manage members and tasks."
        : selectedProject.summary?.totalTasks
          ? "Open the selected project and keep task statuses updated daily."
          : `Add the first task inside ${selectedProject.name} to kick off execution.`;

  return (
    <div
      aria-modal="true"
      className="guide-overlay"
      onClick={onClose}
      role="dialog"
    >
      <div className="guide-modal surface" onClick={(event) => event.stopPropagation()}>
        <div className="guide-modal-header">
          <div>
            <p className="eyebrow">Guide</p>
            <h2>How to use TaskPilot</h2>
            <p className="guide-modal-copy">
              {user
                ? `Hi ${firstName}, follow this quick flow to manage projects, assign tasks, and keep the team on track.`
                : "This walkthrough explains the full product flow before you sign in."}
            </p>
          </div>

          <button className="ghost-button guide-close-button" onClick={onClose} type="button">
            Close
          </button>
        </div>

        <div className="guide-status-row">
          <div className="guide-status-chip tone-sky">
            <span>Projects</span>
            <strong>{projectCount}</strong>
          </div>
          <div className="guide-status-chip tone-peach">
            <span>Open tasks</span>
            <strong>{summary?.myOpenTasks || 0}</strong>
          </div>
          <div className="guide-status-chip tone-mint">
            <span>Completed</span>
            <strong>{summary?.completedTasks || 0}</strong>
          </div>
          <div className="guide-status-chip tone-lavender">
            <span>Current role</span>
            <strong>{selectedProject?.displayRole || selectedProject?.role || "Guest"}</strong>
          </div>
        </div>

        <section className="guide-section">
          <div className="guide-section-heading">
            <h3>Quick tutorial</h3>
            <p className="subtle">{nextStep}</p>
          </div>

          <div className="guide-step-grid">
            <article className="guide-step-card tone-sky">
              <span className="guide-step-number">01</span>
              <strong>Sign up or log in</strong>
              <p>
                Create your account once. After login, the dashboard and Projects tab become your
                main workspace.
              </p>
            </article>

            <article className="guide-step-card tone-peach">
              <span className="guide-step-number">02</span>
              <strong>Create a project</strong>
              <p>
                Admins start by creating a project with a name and short description so the team
                knows the scope.
              </p>
            </article>

            <article className="guide-step-card tone-sand">
              <span className="guide-step-number">03</span>
              <strong>Add team members</strong>
              <p>
                Add teammates by email from the selected project. Make sure they already have
                accounts in the app first.
              </p>
            </article>

            <article className="guide-step-card tone-mint">
              <span className="guide-step-number">04</span>
              <strong>Create and assign tasks</strong>
              <p>
                Add a title, description, assignee, priority, and due date. This is where the real
                work planning happens.
              </p>
            </article>

            <article className="guide-step-card tone-rose">
              <span className="guide-step-number">05</span>
              <strong>Update status daily</strong>
              <p>
                Members move tasks through Todo, In Progress, and Completed so everyone can see the
                latest delivery state.
              </p>
            </article>

            <article className="guide-step-card tone-lavender">
              <span className="guide-step-number">06</span>
              <strong>Track progress and risk</strong>
              <p>
                Use the dashboard to monitor overdue work, completion rate, activity timeline, and
                member workload.
              </p>
            </article>
          </div>
        </section>

        <section className="guide-section guide-detail-grid">
          <article className="guide-info-card">
            <p className="guide-card-label">Admin workflow</p>
            <div className="checklist guide-inline-list">
              <div className="check-item">Create project</div>
              <div className="check-item">Add or remove members</div>
              <div className="check-item">Create and assign tasks</div>
              <div className="check-item">Edit project settings and delete tasks</div>
            </div>
          </article>

          <article className="guide-info-card">
            <p className="guide-card-label">Member workflow</p>
            <div className="checklist guide-inline-list">
              <div className="check-item">Open assigned project</div>
              <div className="check-item">Check your due dates</div>
              <div className="check-item">Update task status on time</div>
              <div className="check-item">Watch the dashboard for overdue work</div>
            </div>
          </article>
        </section>

        <section className="guide-section guide-detail-grid">
          <article className="guide-info-card">
            <p className="guide-card-label">What the dashboard means</p>
            <div className="guide-glossary">
              <div className="guide-glossary-item">
                <strong>Progress %</strong>
                <p>How much of your visible work is completed.</p>
              </div>
              <div className="guide-glossary-item">
                <strong>Overdue tasks</strong>
                <p>Tasks whose due date has passed and are not completed yet.</p>
              </div>
              <div className="guide-glossary-item">
                <strong>Activity timeline</strong>
                <p>Recent changes like tasks created, assigned, updated, or members added.</p>
              </div>
            </div>
          </article>

          <article className="guide-info-card">
            <p className="guide-card-label">Helpful tips</p>
            <div className="guide-glossary">
              <div className="guide-glossary-item">
                <strong>Create teammate accounts first</strong>
                <p>Then add them to a project by email, otherwise assignment will fail.</p>
              </div>
              <div className="guide-glossary-item">
                <strong>Use due dates carefully</strong>
                <p>The app uses them to surface overdue risk and delivery pressure.</p>
              </div>
              <div className="guide-glossary-item">
                <strong>Task completion feels rewarding</strong>
                <p>When a task is marked complete, the app shows a small congrats message.</p>
              </div>
            </div>
          </article>
        </section>

        <div className="guide-footer">
          <div className="guide-note">
            <strong>Your next best action:</strong> {nextStep}
          </div>

          <div className="guide-footer-actions">
            {user ? (
              <>
                <button className="secondary-button" onClick={onGoToDashboard} type="button">
                  Open dashboard
                </button>
                <button className="primary-button" onClick={onGoToProjects} type="button">
                  Go to projects
                </button>
              </>
            ) : null}
            <button className="ghost-button" onClick={onClose} type="button">
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GuideModal;
