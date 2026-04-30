const EMPTY_FORM = {
  reaction: "",
  rating: "",
  confidence: "",
  errorTag: "",
  feedback: "",
  improvedResponse: "",
};

function ChoiceGroup({ label, group, options, value, onSelect, compact = false, chips = false }) {
  return (
    <div className="group">
      <label>{label}</label>
      <div className={`choice-row ${compact ? "compact" : ""} ${chips ? "chips" : ""}`}>
        {options.map((option) => (
          <button
            key={option.value}
            className={`choice-button ${value === option.value ? "active" : ""}`}
            onClick={() => onSelect(group, option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function EvaluatorView({
  response,
  form,
  progress,
  onChange,
  onSelect,
  onSkip,
  onSubmit,
  saving,
}) {
  return (
    <section className="tab-panel active">
      <div className="review-grid">
        <article className="surface response-card">
          <div className="card-header">
            <div>
              <p className="eyebrow">Current Response</p>
              <h3>Decision-grade evaluation, one answer at a time</h3>
            </div>
            {response ? (
              <div className="response-badges">
                <span className="badge">{response.category}</span>
                <span className="badge badge-muted">{response.sourceModel}</span>
              </div>
            ) : null}
          </div>

          {response ? (
            <div className="response-body">
              <div className="response-block">
                <h4>Prompt</h4>
                <p>{response.prompt}</p>
              </div>
              <div className="response-block">
                <h4>AI Response</h4>
                <p>{response.responseText}</p>
              </div>
              <p className="subtle">
                {progress.pendingCount} response{progress.pendingCount === 1 ? "" : "s"} still pending
                review in the current batch.
              </p>
              <div className="ops-card">
                <p className="eyebrow">Reviewer Checklist</p>
                <ul className="ops-list">
                  <li>Check whether the answer is correct, relevant, and complete.</li>
                  <li>Use confidence to show how safe it feels to rely on the output.</li>
                  <li>Tag the main failure mode instead of mixing multiple issues together.</li>
                  <li>Use the rewrite field when a stronger answer would be meaningfully better.</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div>
                <h3>Queue complete</h3>
                <p>
                  All available prompts for this reviewer have been processed. Switch to dashboard
                  to inspect your saved evaluations and analytics.
                </p>
              </div>
            </div>
          )}
        </article>

        <article className="surface form-card">
          <div className="card-header">
            <div>
              <p className="eyebrow">Evaluation Form</p>
              <h3>Capture quality, uncertainty, and remediation</h3>
            </div>
          </div>

          <div className="form-intro">
            <span>Use consistent labels so dashboard trends stay meaningful over time.</span>
          </div>

          <form className="evaluation-form" onSubmit={onSubmit}>
            <ChoiceGroup
              group="reaction"
              label="Reaction"
              onSelect={onSelect}
              options={[
                { label: "Like", value: "like" },
                { label: "Dislike", value: "dislike" },
              ]}
              value={form.reaction}
            />

            <ChoiceGroup
              compact
              group="rating"
              label="Rating"
              onSelect={onSelect}
              options={[
                { label: "1", value: "1" },
                { label: "2", value: "2" },
                { label: "3", value: "3" },
                { label: "4", value: "4" },
                { label: "5", value: "5" },
              ]}
              value={form.rating}
            />

            <ChoiceGroup
              group="confidence"
              label="Confidence Score"
              onSelect={onSelect}
              options={[
                { label: "Low", value: "low" },
                { label: "Medium", value: "medium" },
                { label: "High", value: "high" },
              ]}
              value={form.confidence}
            />

            <ChoiceGroup
              chips
              group="errorTag"
              label="Error Type Tag"
              onSelect={onSelect}
              options={[
                { label: "Factually incorrect", value: "factually_incorrect" },
                { label: "Irrelevant", value: "irrelevant" },
                { label: "Incomplete", value: "incomplete" },
                { label: "Correct", value: "correct" },
              ]}
              value={form.errorTag}
            />

            <label className="field">
              <span>Feedback</span>
              <textarea
                name="feedback"
                onChange={onChange}
                placeholder="What worked, what felt risky, and why?"
                rows="5"
                value={form.feedback}
              />
            </label>

            <label className="field">
              <span>Improve Response</span>
              <textarea
                name="improvedResponse"
                onChange={onChange}
                placeholder="Optional: write a better version of the AI answer."
                rows="4"
                value={form.improvedResponse}
              />
            </label>

            <div className="form-actions">
              <button className="secondary-button" onClick={onSkip} type="button">
                Skip / Next
              </button>
              <button className="primary-button" disabled={saving || !response} type="submit">
                {saving ? "Saving..." : "Save Evaluation"}
              </button>
            </div>
          </form>
        </article>
      </div>
    </section>
  );
}

EvaluatorView.emptyForm = EMPTY_FORM;

export default EvaluatorView;
