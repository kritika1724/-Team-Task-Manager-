function WorkspaceBanner({ currentResponse, progress, analytics }) {
  const queueSize = progress.pendingCount || progress.totalResponses;
  const categoryLabel = currentResponse?.category || "Multi-domain";
  const healthLabel =
    analytics.totalEvaluations > 0
      ? `${analytics.correctPercentage}% marked correct`
      : "Quality baseline pending";

  return (
    <section className="workspace-banner surface">
      <div className="workspace-banner-copy">
        <p className="eyebrow">Live Review Queue</p>
        <h2>Human feedback for model quality, safety, and usefulness</h2>
        <p className="subtle">
          Turn subjective judgments into structured signals your product, safety, and model teams
          can actually use.
        </p>
      </div>

      <div className="workspace-banner-grid">
        <article className="mini-panel">
          <span>Queue Ready</span>
          <strong>{queueSize}</strong>
          <small>responses available for review</small>
        </article>
        <article className="mini-panel">
          <span>Current Domain</span>
          <strong>{categoryLabel}</strong>
          <small>changes automatically with each prompt</small>
        </article>
        <article className="mini-panel">
          <span>Review Health</span>
          <strong>{healthLabel}</strong>
          <small>updates as annotations are saved</small>
        </article>
      </div>
    </section>
  );
}

export default WorkspaceBanner;

