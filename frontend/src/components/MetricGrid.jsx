function MetricGrid({ summary }) {
  const items = [
    { label: "Total projects", value: summary.totalProjects ?? 0, copy: "Projects you can access", tone: "sky" },
    { label: "Total tasks", value: summary.totalTasks ?? 0, copy: "Across all visible projects", tone: "peach" },
    { label: "Pending tasks", value: summary.pendingTasks ?? 0, copy: "Tasks still in progress", tone: "sand" },
    { label: "Completed tasks", value: summary.completedTasks ?? 0, copy: "Finished work items", tone: "mint" },
    { label: "Overdue tasks", value: summary.overdueTasks ?? 0, copy: "Need immediate follow-up", tone: "rose" },
    { label: "Progress", value: `${summary.progressPercent ?? 0}%`, copy: "Overall completion rate", tone: "lavender" },
  ];

  return (
    <div className="metric-grid metric-grid-expanded">
      {items.map((item) => (
        <article className={`metric-card tone-${item.tone}`} key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
          <p className="metric-copy">{item.copy}</p>
        </article>
      ))}
    </div>
  );
}

export default MetricGrid;
