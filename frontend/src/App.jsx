import { useEffect, useState } from "react";
import AuthPanel from "./components/AuthPanel";
import DashboardView from "./components/DashboardView";
import GuideModal from "./components/GuideModal";
import HeroPanel from "./components/HeroPanel";
import MetricGrid from "./components/MetricGrid";
import ProjectsView from "./components/ProjectsView";
import Toast from "./components/Toast";
import { request } from "./lib/api";

const TOKEN_KEY = "taskpilot_token";
const USER_KEY = "taskpilot_user";

const parseStoredUser = () => {
  const rawValue = localStorage.getItem(USER_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch (error) {
    localStorage.removeItem(USER_KEY);
    return null;
  }
};

const emptyDashboard = {
  summary: {
    totalProjects: 0,
    totalTasks: 0,
    pendingTasks: 0,
    completedTasks: 0,
    myOpenTasks: 0,
    myTasks: 0,
    overdueTasks: 0,
    progressPercent: 0,
    completionRate: 0,
    overduePercentage: 0,
    tasksByStatus: {
      todo: 0,
      inProgress: 0,
      completed: 0,
    },
  },
  myTasks: [],
  overdueTasks: [],
  memberAnalytics: [],
  projectAnalytics: [],
  recentActivity: [],
  adminInsights: {
    busiestMember: null,
    delayedProject: null,
  },
};

const emptyProjectForm = {
  name: "",
  description: "",
};

const emptyMemberForm = {
  email: "",
  roleOption: "member|",
};

const emptyTaskForm = {
  title: "",
  description: "",
  assignedTo: "",
  priority: "medium",
  dueDate: "",
};

const emptyProjectSettingsForm = {
  name: "",
  description: "",
};

const emptyCustomRoleForm = {
  name: "",
  permissionRole: "member",
};

const toSafeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getDefaultRoleTitle = (role = "member") => (role === "admin" ? "Admin" : "Member");

const getDisplayRole = (entry = {}) =>
  entry.displayRole || entry.roleTitle || getDefaultRoleTitle(entry.role);

const createRoleOptionValue = (role = "member", roleTitle = "") =>
  `${role === "admin" ? "admin" : "member"}|${(roleTitle || "").trim()}`;

const parseRoleOptionValue = (value = "member|") => {
  const [rolePart = "member", ...titleParts] = value.split("|");
  const role = rolePart === "admin" ? "admin" : "member";
  const roleTitle = titleParts.join("|").trim();

  return {
    role,
    roleTitle,
  };
};

const normalizeStatus = (status) => {
  if (status === "done") {
    return "completed";
  }

  if (status === "review") {
    return "in_progress";
  }

  if (["todo", "in_progress", "completed"].includes(status)) {
    return status;
  }

  return "todo";
};

const normalizeTasksByStatus = (summary = {}) => {
  const statusMap = summary.tasksByStatus || {};

  return {
    todo: toSafeNumber(statusMap.todo),
    inProgress:
      toSafeNumber(statusMap.inProgress) +
      toSafeNumber(statusMap.in_progress) +
      toSafeNumber(statusMap.review),
    completed: toSafeNumber(statusMap.completed) + toSafeNumber(statusMap.done),
  };
};

const normalizeTask = (task = {}) => ({
  ...task,
  description: task.description || "",
  dueDate: task.dueDate || new Date().toISOString(),
  isOverdue: Boolean(task.isOverdue),
  priority: task.priority || task.suggestedPriority || "medium",
  progressPercent: Math.min(
    100,
    Math.max(0, Number.isFinite(Number(task.progressPercent)) ? Number(task.progressPercent) : 0)
  ),
  riskLevel: task.riskLevel || "low",
  status: normalizeStatus(task.status),
  suggestedPriority: task.suggestedPriority || task.priority || "medium",
  title: task.title || "Untitled task",
});

const normalizeSummary = (summary = {}, tasks = []) => {
  const tasksByStatus = normalizeTasksByStatus(summary);
  const totalTasks = toSafeNumber(summary.totalTasks, tasks.length);
  const completedTasks = toSafeNumber(summary.completedTasks, tasksByStatus.completed);
  const pendingTasks = toSafeNumber(
    summary.pendingTasks,
    Math.max(totalTasks - completedTasks, 0)
  );
  const overdueTasks = toSafeNumber(summary.overdueTasks);
  const progressPercent = toSafeNumber(
    summary.progressPercent,
    summary.completionRate ?? (totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0)
  );

  return {
    totalProjects: toSafeNumber(summary.totalProjects),
    totalTasks,
    pendingTasks,
    completedTasks,
    myOpenTasks: toSafeNumber(summary.myOpenTasks, pendingTasks),
    myTasks: toSafeNumber(summary.myTasks, tasks.length),
    overdueTasks,
    progressPercent,
    completionRate: toSafeNumber(summary.completionRate, progressPercent),
    overduePercentage: toSafeNumber(
      summary.overduePercentage,
      totalTasks ? Math.round((overdueTasks / totalTasks) * 100) : 0
    ),
    tasksByStatus,
  };
};

const normalizeDashboardData = (data = {}) => {
  const myTasks = Array.isArray(data.myTasks) ? data.myTasks.map(normalizeTask) : [];
  const overdueTasks = Array.isArray(data.overdueTasks) ? data.overdueTasks.map(normalizeTask) : [];

  return {
    ...emptyDashboard,
    ...data,
    summary: normalizeSummary(data.summary, myTasks),
    myTasks,
    overdueTasks,
    memberAnalytics: Array.isArray(data.memberAnalytics)
      ? data.memberAnalytics.map((member) => ({
          ...member,
          displayRole: getDisplayRole(member),
          roleTitle: member.roleTitle || "",
        }))
      : [],
    projectAnalytics: Array.isArray(data.projectAnalytics)
      ? data.projectAnalytics.map((project) => ({
          ...project,
          completedTasks: toSafeNumber(project.completedTasks),
          memberCount: toSafeNumber(project.memberCount),
          overdueTasks: toSafeNumber(project.overdueTasks),
          pendingTasks: toSafeNumber(project.pendingTasks),
          progressPercent: toSafeNumber(project.progressPercent),
          totalTasks: toSafeNumber(project.totalTasks),
        }))
      : [],
    recentActivity: Array.isArray(data.recentActivity) ? data.recentActivity : [],
  };
};

const normalizeProject = (project = {}) => ({
  ...project,
  displayRole: getDisplayRole(project),
  memberCount: toSafeNumber(project.memberCount),
  summary: normalizeSummary(project.summary),
});

const normalizeMember = (member = {}) => ({
  ...member,
  displayRole: getDisplayRole(member),
  roleTitle: member.roleTitle || "",
});

const normalizeProjectDetail = (project = {}) => {
  const tasks = Array.isArray(project.tasks) ? project.tasks.map(normalizeTask) : [];

  return {
    ...project,
    customRoles: Array.isArray(project.customRoles) ? project.customRoles : [],
    description: project.description || "",
    displayRole: getDisplayRole(project),
    roleOptions: Array.isArray(project.roleOptions)
      ? project.roleOptions.map((option) => ({
          ...option,
          value: option.value || createRoleOptionValue(option.permissionRole, option.roleTitle),
        }))
      : [
          { label: "Admin", permissionRole: "admin", roleTitle: "", value: createRoleOptionValue("admin") },
          { label: "Member", permissionRole: "member", roleTitle: "", value: createRoleOptionValue("member") },
        ],
    memberAnalytics: Array.isArray(project.memberAnalytics)
      ? project.memberAnalytics.map((member) => ({
          ...member,
          displayRole: getDisplayRole(member),
          roleTitle: member.roleTitle || "",
        }))
      : [],
    members: Array.isArray(project.members) ? project.members.map(normalizeMember) : [],
    recentActivity: Array.isArray(project.recentActivity) ? project.recentActivity : [],
    summary: normalizeSummary(project.summary, tasks),
    tasks,
  };
};

function App() {
  const [authMode, setAuthMode] = useState("login");
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY) || "");
  const [user, setUser] = useState(parseStoredUser);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [projectDetail, setProjectDetail] = useState(null);
  const [projectForm, setProjectForm] = useState(emptyProjectForm);
  const [projectSettingsForm, setProjectSettingsForm] = useState(emptyProjectSettingsForm);
  const [memberForm, setMemberForm] = useState(emptyMemberForm);
  const [customRoleForm, setCustomRoleForm] = useState(emptyCustomRoleForm);
  const [taskForm, setTaskForm] = useState(emptyTaskForm);
  const [authLoading, setAuthLoading] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [showGuide, setShowGuide] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });

  useEffect(() => {
    if (!toast.message) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setToast({ message: "", type: "success" });
    }, 3200);

    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!projectDetail) {
      setProjectSettingsForm(emptyProjectSettingsForm);
      return;
    }

    setProjectSettingsForm({
      name: projectDetail.name,
      description: projectDetail.description || "",
    });
  }, [projectDetail]);

  useEffect(() => {
    if (!showGuide) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showGuide]);

  useEffect(() => {
    if (!token) {
      setBootstrapping(false);
      return;
    }

    const bootstrap = async () => {
      try {
        const session = await request("/auth/me", { token });
        setUser(session.user);
        localStorage.setItem(USER_KEY, JSON.stringify(session.user));
        await refreshWorkspace(token);
      } catch (error) {
        handleLogout(false);
        pushToast(error.message, "error");
      } finally {
        setBootstrapping(false);
      }
    };

    bootstrap();
  }, []);

  const pushToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const persistSession = (sessionToken, sessionUser) => {
    setToken(sessionToken);
    setUser(sessionUser);
    localStorage.setItem(TOKEN_KEY, sessionToken);
    localStorage.setItem(USER_KEY, JSON.stringify(sessionUser));
  };

  const handleLogout = (shouldToast = true) => {
    setToken("");
    setUser(null);
    setShowGuide(false);
    setProjects([]);
    setSelectedProjectId("");
    setProjectDetail(null);
    setDashboard(emptyDashboard);
    setProjectForm(emptyProjectForm);
    setProjectSettingsForm(emptyProjectSettingsForm);
    setMemberForm(emptyMemberForm);
    setCustomRoleForm(emptyCustomRoleForm);
    setTaskForm(emptyTaskForm);
    setActiveTab("dashboard");
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    if (shouldToast) {
      pushToast("Logged out.");
    }
  };

  const loadDashboard = async (sessionToken = token) => {
    const data = await request("/dashboard", { token: sessionToken });
    setDashboard(normalizeDashboardData(data));
  };

  const loadProjects = async (sessionToken = token) => {
    const data = await request("/projects", { token: sessionToken });
    const normalizedProjects = Array.isArray(data.projects) ? data.projects.map(normalizeProject) : [];
    setProjects(normalizedProjects);
    return normalizedProjects;
  };

  const loadProjectDetail = async (projectId, sessionToken = token) => {
    const data = await request(`/projects/${projectId}`, { token: sessionToken });
    const normalizedProject = normalizeProjectDetail(data.project);
    setProjectDetail(normalizedProject);
    setSelectedProjectId(projectId);
    return normalizedProject;
  };

  const refreshWorkspace = async (sessionToken = token, preferredProjectId = "") => {
    await loadDashboard(sessionToken);
    const nextProjects = await loadProjects(sessionToken);
    const nextSelectedId =
      preferredProjectId || selectedProjectId || nextProjects[0]?.id || "";

    if (!nextSelectedId) {
      setActiveTab("projects");
      setSelectedProjectId("");
      setProjectDetail(null);
      return;
    }

    await loadProjectDetail(nextSelectedId, sessionToken);
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    setAuthLoading(true);

    const formElement = event.currentTarget;
    const formData = new FormData(formElement);
    const payload = {
      email: formData.get("email"),
      password: formData.get("password"),
    };

    if (authMode === "signup") {
      payload.name = formData.get("name");
    }

    try {
      const data = await request(authMode === "signup" ? "/auth/register" : "/auth/login", {
        method: "POST",
        body: payload,
      });

      persistSession(data.token, data.user);
      formElement.reset();
      await refreshWorkspace(data.token);
      pushToast(authMode === "signup" ? "Account created successfully." : "Login successful.");
    } catch (error) {
      handleLogout(false);
      pushToast(error.message, "error");
    } finally {
      setAuthLoading(false);
      setBootstrapping(false);
    }
  };

  const handleProjectInput = (event) => {
    const { name, value } = event.target;
    setProjectForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleMemberInput = (event) => {
    const { name, value } = event.target;
    setMemberForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleProjectSettingsInput = (event) => {
    const { name, value } = event.target;
    setProjectSettingsForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleCustomRoleInput = (event) => {
    const { name, value } = event.target;
    setCustomRoleForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleTaskInput = (event) => {
    const { name, value } = event.target;
    setTaskForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleCreateProject = async (event) => {
    event.preventDefault();

    if (!projectForm.name.trim()) {
      pushToast("Project name is required.", "error");
      return;
    }

    try {
      const data = await request("/projects", {
        method: "POST",
        token,
        body: projectForm,
      });

      setProjectForm(emptyProjectForm);
      await refreshWorkspace(token, data.project.id);
      setActiveTab("projects");
      pushToast("Project created successfully.");
    } catch (error) {
      pushToast(error.message, "error");
    }
  };

  const handleAddMember = async (event) => {
    event.preventDefault();

    if (!selectedProjectId) {
      pushToast("Select a project first.", "error");
      return;
    }

    if (!memberForm.email.trim()) {
      pushToast("Member email is required.", "error");
      return;
    }

    try {
      const resolvedRole = parseRoleOptionValue(memberForm.roleOption);

      await request(`/projects/${selectedProjectId}/members`, {
        method: "POST",
        token,
        body: {
          email: memberForm.email,
          ...resolvedRole,
        },
      });

      setMemberForm(emptyMemberForm);
      await refreshWorkspace(token, selectedProjectId);
      pushToast("Member added successfully.");
    } catch (error) {
      pushToast(error.message, "error");
    }
  };

  const handleCreateCustomRole = async (event) => {
    event.preventDefault();

    if (!selectedProjectId) {
      pushToast("Select a project first.", "error");
      return;
    }

    if (!customRoleForm.name.trim()) {
      pushToast("Custom role name is required.", "error");
      return;
    }

    try {
      await request(`/projects/${selectedProjectId}/roles`, {
        method: "POST",
        token,
        body: {
          name: customRoleForm.name,
          permissionRole: customRoleForm.permissionRole,
        },
      });

      setCustomRoleForm(emptyCustomRoleForm);
      await refreshWorkspace(token, selectedProjectId);
      pushToast("Custom role created successfully.");
    } catch (error) {
      pushToast(error.message, "error");
    }
  };

  const handleCreateTask = async (event) => {
    event.preventDefault();

    if (!selectedProjectId) {
      pushToast("Select a project first.", "error");
      return;
    }

    if (!taskForm.title.trim() || !taskForm.assignedTo || !taskForm.dueDate) {
      pushToast("Title, assignee, and due date are required.", "error");
      return;
    }

    try {
      await request(`/projects/${selectedProjectId}/tasks`, {
        method: "POST",
        token,
        body: taskForm,
      });

      setTaskForm(emptyTaskForm);
      await refreshWorkspace(token, selectedProjectId);
      pushToast("Task created successfully.");
    } catch (error) {
      pushToast(error.message, "error");
    }
  };

  const handleUpdateProject = async (event) => {
    event.preventDefault();

    if (!selectedProjectId) {
      pushToast("Select a project first.", "error");
      return;
    }

    if (!projectSettingsForm.name.trim()) {
      pushToast("Project name is required.", "error");
      return;
    }

    try {
      await request(`/projects/${selectedProjectId}`, {
        method: "PATCH",
        token,
        body: projectSettingsForm,
      });

      await refreshWorkspace(token, selectedProjectId);
      pushToast("Project updated successfully.");
    } catch (error) {
      pushToast(error.message, "error");
    }
  };

  const handleDeleteProject = async () => {
    if (!selectedProjectId) {
      pushToast("Select a project first.", "error");
      return;
    }

    if (!window.confirm("Delete this project and all of its tasks?")) {
      return;
    }

    try {
      await request(`/projects/${selectedProjectId}`, {
        method: "DELETE",
        token,
      });

      setSelectedProjectId("");
      setProjectDetail(null);
      const nextProjects = await loadProjects(token);
      await loadDashboard(token);

      if (nextProjects[0]?.id) {
        await loadProjectDetail(nextProjects[0].id, token);
      } else {
        setProjectSettingsForm(emptyProjectSettingsForm);
      }

      pushToast("Project deleted successfully.");
    } catch (error) {
      pushToast(error.message, "error");
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!selectedProjectId) {
      pushToast("Select a project first.", "error");
      return;
    }

    if (!window.confirm("Remove this member from the project?")) {
      return;
    }

    try {
      await request(`/projects/${selectedProjectId}/members/${memberId}`, {
        method: "DELETE",
        token,
      });

      await refreshWorkspace(token, selectedProjectId);
      pushToast("Member removed successfully.");
    } catch (error) {
      pushToast(error.message, "error");
    }
  };

  const handleUpdateMember = async (memberId, payload) => {
    if (!selectedProjectId) {
      pushToast("Select a project first.", "error");
      return;
    }

    try {
      const resolvedRole = parseRoleOptionValue(payload.roleOption);

      await request(`/projects/${selectedProjectId}/members/${memberId}`, {
        method: "PATCH",
        token,
        body: resolvedRole,
      });

      await refreshWorkspace(token, selectedProjectId);
      pushToast("Member role updated successfully.");
    } catch (error) {
      pushToast(error.message, "error");
    }
  };

  const handleStatusChange = async (taskId, status) => {
    try {
      const data = await request(`/tasks/${taskId}`, {
        method: "PATCH",
        token,
        body: { status },
      });

      await refreshWorkspace(token, selectedProjectId);
      if (status === "completed") {
        pushToast(`Congrats! ${data.task?.title || "Task"} marked complete.`, "celebration");
      } else {
        pushToast("Task status updated.");
      }
    } catch (error) {
      pushToast(error.message, "error");
    }
  };

  const handleProgressChange = async (taskId, progressPercent) => {
    try {
      const data = await request(`/tasks/${taskId}`, {
        method: "PATCH",
        token,
        body: { progressPercent },
      });

      await refreshWorkspace(token, selectedProjectId);
      pushToast(`Progress updated to ${data.task?.progressPercent ?? progressPercent}%.`);
    } catch (error) {
      pushToast(error.message, "error");
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Delete this task?")) {
      return;
    }

    try {
      await request(`/tasks/${taskId}`, {
        method: "DELETE",
        token,
      });

      await refreshWorkspace(token, selectedProjectId);
      pushToast("Task deleted successfully.");
    } catch (error) {
      pushToast(error.message, "error");
    }
  };

  const handleProjectSelect = async (projectId) => {
    try {
      await loadProjectDetail(projectId);
      setSelectedProjectId(projectId);
    } catch (error) {
      pushToast(error.message, "error");
    }
  };

  if (bootstrapping) {
    return (
      <div className="app-shell">
        <div className="ambient ambient-one"></div>
        <div className="ambient ambient-two"></div>
        <div className="page-shell">
          <header className="app-topbar surface">
            <div className="topbar-brand">
              <div className="topbar-mark">TP</div>
              <div>
                <p className="topbar-name">TaskPilot</p>
                <p className="topbar-subtitle">Team task manager</p>
              </div>
            </div>

            <div className="topbar-actions">
              <button
                className="secondary-button guide-trigger"
                onClick={() => setShowGuide(true)}
                type="button"
              >
                Guide how to use
              </button>
            </div>
          </header>

          <main className="public-layout">
            <HeroPanel />
            <section className="public-auth-column">
              <div className="surface loading-shell">
                <p className="eyebrow">Booting Workspace</p>
                <h2>Preparing projects...</h2>
              </div>
            </section>
          </main>

          <GuideModal
            onClose={() => setShowGuide(false)}
            open={showGuide}
            projects={projects}
            selectedProject={projectDetail}
            summary={dashboard.summary}
            user={user}
          />
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="app-shell public-shell">
        <div className="ambient ambient-one"></div>
        <div className="ambient ambient-two"></div>

        <div className="page-shell public-page-shell">
          <header className="app-topbar public-topbar surface">
            <div className="topbar-brand">
              <div className="topbar-mark">TP</div>
              <div>
                <p className="topbar-name">TaskPilot</p>
                <p className="topbar-subtitle">Professional team task manager</p>
              </div>
            </div>

            <div className="topbar-actions">
              <div className="topbar-chips">
                <span className="topbar-chip">Admin and member roles</span>
                <span className="topbar-chip">Deadline tracking</span>
              </div>
              <button
                className="secondary-button guide-trigger"
                onClick={() => setShowGuide(true)}
                type="button"
              >
                Guide how to use
              </button>
            </div>
          </header>

          <main className="public-layout">
            <HeroPanel />

            <section className="public-auth-column">
              <div className="public-auth-intro">
                <p className="eyebrow">Get Started</p>
                <h2>Everything your team needs to move work forward</h2>
                <p className="workspace-copy">
                  Sign up once, create projects, add teammates, assign tasks, and track progress
                  from a clean dashboard.
                </p>
              </div>

              <Toast message={toast.message} type={toast.type} />
              <AuthPanel
                loading={authLoading}
                mode={authMode}
                onModeChange={setAuthMode}
                onSubmit={handleAuthSubmit}
              />
            </section>
          </main>

          <GuideModal
            onClose={() => setShowGuide(false)}
            open={showGuide}
            projects={projects}
            selectedProject={projectDetail}
            summary={dashboard.summary}
            user={user}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="ambient ambient-one"></div>
      <div className="ambient ambient-two"></div>

      <div className="page-shell">
        <header className="app-topbar surface">
          <div className="topbar-brand">
            <div className="topbar-mark">TP</div>
            <div>
              <p className="topbar-name">TaskPilot</p>
              <p className="topbar-subtitle">Team task manager</p>
            </div>
          </div>

          <div className="topbar-actions">
            <div className="topbar-chips">
              <span className="topbar-chip">Projects {projects.length}</span>
              <span className="topbar-chip">Dashboard</span>
              <span className="topbar-chip">Secure workspace</span>
            </div>
            <button
              className="secondary-button guide-trigger"
              onClick={() => setShowGuide(true)}
              type="button"
            >
              Guide how to use
            </button>
          </div>
        </header>

        <main className="layout logged-in">
          <HeroPanel
            projectCount={projects.length}
            selectedProject={projectDetail}
            summary={dashboard.summary}
            user={user}
          />

          <section className="workspace-panel">
            <header className="workspace-header">
              <div className="workspace-header-text">
                <p className="eyebrow">Operations Console</p>
                <h2>Manage projects, assign work, and track progress clearly</h2>
              </div>

              {user ? (
                <div className="user-block">
                  <div>
                    <p className="user-label">Signed in as</p>
                    <strong>{user.name}</strong>
                  </div>
                  <button className="ghost-button" onClick={() => handleLogout(true)} type="button">
                    Logout
                  </button>
                </div>
              ) : null}
            </header>

            <Toast message={toast.message} type={toast.type} />

            <MetricGrid summary={dashboard.summary} />

            <div className="tab-strip">
              <button
                className={`tab-button ${activeTab === "dashboard" ? "active" : ""}`}
                onClick={() => setActiveTab("dashboard")}
                type="button"
              >
                My Dashboard
              </button>
              <button
                className={`tab-button ${activeTab === "projects" ? "active" : ""}`}
                onClick={() => setActiveTab("projects")}
                type="button"
              >
                Projects ({projects.length})
              </button>
            </div>

            {activeTab === "dashboard" ? (
              <DashboardView dashboard={dashboard} />
            ) : (
              <ProjectsView
                customRoleForm={customRoleForm}
                currentUserId={user?.id}
                memberForm={memberForm}
                onAddMember={handleAddMember}
                onCreateCustomRole={handleCreateCustomRole}
                onCreateProject={handleCreateProject}
                onCreateTask={handleCreateTask}
                onCustomRoleInput={handleCustomRoleInput}
                onDeleteProject={handleDeleteProject}
                onDeleteTask={handleDeleteTask}
                onMemberInput={handleMemberInput}
                onProjectInput={handleProjectInput}
                onProjectSettingsInput={handleProjectSettingsInput}
                onProgressChange={handleProgressChange}
                onRemoveMember={handleRemoveMember}
                onSelectProject={handleProjectSelect}
                onStatusChange={handleStatusChange}
                onTaskInput={handleTaskInput}
                onUpdateMember={handleUpdateMember}
                onUpdateProject={handleUpdateProject}
                projectDetail={projectDetail}
                projectForm={projectForm}
                projectSettingsForm={projectSettingsForm}
                projects={projects}
                selectedProjectId={selectedProjectId}
                taskForm={taskForm}
              />
            )}
          </section>
        </main>

        <GuideModal
          onClose={() => setShowGuide(false)}
          onGoToDashboard={() => {
            setActiveTab("dashboard");
            setShowGuide(false);
          }}
          onGoToProjects={() => {
            setActiveTab("projects");
            setShowGuide(false);
          }}
          open={showGuide}
          projects={projects}
          selectedProject={projectDetail}
          summary={dashboard.summary}
          user={user}
        />
      </div>
    </div>
  );
}

export default App;
