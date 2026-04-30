function AuthPanel({ mode, onModeChange, onSubmit, loading }) {
  const isSignup = mode === "signup";

  return (
    <section className="auth-shell">
      <div className="auth-header">
        <div>
          <p className="eyebrow">Workspace Access</p>
          <h3>{isSignup ? "Create your account" : "Welcome back"}</h3>
          <p className="subtle">
            {isSignup
              ? "Set up your workspace access and start creating projects in minutes."
              : "Sign in to manage projects, assign tasks, and keep delivery on track."}
          </p>
        </div>

        <div className="mode-switch">
          <button
            className={`mode-button ${mode === "login" ? "active" : ""}`}
            onClick={() => onModeChange("login")}
            type="button"
          >
            Login
          </button>
          <button
            className={`mode-button ${mode === "signup" ? "active" : ""}`}
            onClick={() => onModeChange("signup")}
            type="button"
          >
            Signup
          </button>
        </div>
      </div>

      <form className="auth-form" onSubmit={onSubmit}>
        {isSignup ? (
          <label className="field">
            <span>Name</span>
            <input name="name" type="text" placeholder="Enter your full name" required />
          </label>
        ) : null}

        <label className="field">
          <span>Email</span>
          <input name="email" type="email" placeholder="you@example.com" required />
        </label>

        <label className="field">
          <span>Password</span>
          <input name="password" type="password" placeholder="At least 6 characters" required />
        </label>

        <button className="primary-button" disabled={loading} type="submit">
          {loading ? "Please wait..." : isSignup ? "Create Account" : "Sign In"}
        </button>
      </form>

      <div className="auth-helper">
        <p>
          Demo tip: create teammate accounts first, then add them to a project from the Projects
          tab using their email addresses.
        </p>
      </div>
    </section>
  );
}

export default AuthPanel;
