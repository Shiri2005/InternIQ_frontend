import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { request } from "../services/api";
import Galaxy from "../components/Galaxy";
import Navbar from "../components/Navbar";

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
}

export default function Admin() {
  const [invite, setInvite] = useState("");
  const [users, setUsers] = useState([]);
  const [tiers, setTiers] = useState({});
  const [projects, setProjects] = useState([]);
  const [projectReadiness, setProjectReadiness] = useState({});
  const [tasks, setTasks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [overview, setOverview] = useState({
    totalUsers: 0,
    totalQuizzes: 0,
    totalAttempts: 0,
    averageScore: 0,
  });
  const [recentAttempts, setRecentAttempts] = useState([]);
  const [message, setMessage] = useState("");
  const [projectForm, setProjectForm] = useState({
    title: "",
    description: "",
    requiredSkills: "",
    deadline: "",
    assignedUsers: [],
    tier: "free",
  });

  const todayISO = new Date().toISOString().split("T")[0];

  const isFutureOrTodayDate = (value) => {
    if (!value) return false;

    const selected = new Date(value);
    if (Number.isNaN(selected.getTime())) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selected.setHours(0, 0, 0, 0);

    return selected >= today;
  };

  const loadUsers = async () => {
    const data = await request("/api/users");
    setUsers(data || []);

    const nextTiers = {};
    (data || []).forEach((user) => {
      nextTiers[user._id] = user.tier || "free";
    });
    setTiers(nextTiers);
  };

  const loadOverview = async () => {
    const data = await request("/api/users/admin-overview");
    setOverview({
      totalUsers: data.totalUsers || 0,
      totalQuizzes: data.totalQuizzes || 0,
      totalAttempts: data.totalAttempts || 0,
      averageScore: data.averageScore || 0,
    });
  };

  const loadRecentAttempts = async () => {
    const data = await request("/api/quiz/attempts");
    setRecentAttempts(data || []);
  };

  const loadProjects = async () => {
    const data = await request("/api/projects");
    const projectList = data || [];
    setProjects(projectList);

    const readinessPairs = await Promise.all(
      projectList.map(async (project) => {
        try {
          const readiness = await request(`/api/projects/${project._id}/readiness`);
          return [project._id, readiness];
        } catch {
          return [project._id, null];
        }
      })
    );

    setProjectReadiness(Object.fromEntries(readinessPairs.filter(Boolean)));
  };

  const loadTasks = async () => {
    const data = await request("/api/tasks");
    setTasks(data || []);
  };

  const loadSubmissions = async () => {
    const data = await request("/api/submissions");
    setSubmissions(data || []);
  };

  const loadDashboardData = async () => {
    await Promise.all([loadUsers(), loadOverview(), loadRecentAttempts(), loadProjects(), loadTasks(), loadSubmissions()]);
  };

  useEffect(() => {
    loadDashboardData().catch((err) => setMessage(err.message));
  }, []);

  const generateInvite = async () => {
    try {
      const res = await request("/api/invites/create", "POST");
      setInvite(res.code);
    } catch (err) {
      setMessage(err.message);
    }
  };

  const updateTier = async (userId) => {
    try {
      await request(`/api/users/${userId}/tier`, "PUT", {
        tier: tiers[userId],
      });
      setMessage("User tier updated ✅");
      await loadDashboardData();
    } catch (err) {
      setMessage(err.message);
    }
  };

  const createProject = async () => {
    try {
      if (!projectForm.title.trim() || !projectForm.description.trim()) {
        throw new Error("Project title and description are required");
      }

      if (!projectForm.requiredSkills.trim()) {
        throw new Error("Required skills are required");
      }

      if (!projectForm.deadline) {
        throw new Error("Project deadline is required");
      }

      if (!isFutureOrTodayDate(projectForm.deadline)) {
        throw new Error("Please choose today or a future deadline");
      }

      if (projectForm.assignedUsers.length === 0) {
        throw new Error("Assign at least one user before saving the project");
      }

      await request("/api/projects", "POST", {
        title: projectForm.title,
        description: projectForm.description,
        requiredSkills: projectForm.requiredSkills,
        deadline: projectForm.deadline,
        assignedUsers: projectForm.assignedUsers,
        tier: projectForm.tier,
      });

      setMessage("Project created ✅");
      setProjectForm({
        title: "",
        description: "",
        requiredSkills: "",
        deadline: "",
        assignedUsers: [],
        tier: "free",
      });

      await loadDashboardData();
    } catch (err) {
      setMessage(err.message);
    }
  };

  const pendingSubmissions = submissions.filter((submission) => submission.status !== "reviewed").length;
  const reviewedSubmissions = submissions.length - pendingSubmissions;

  const statsCards = [
    { label: "Total Users", value: overview.totalUsers },
    { label: "Total Projects", value: projects.length },
    { label: "Total Tasks", value: tasks.length },
    { label: "Resume Analysis Overview", value: `${reviewedSubmissions}/${submissions.length}` },
    { label: "Pending Submissions", value: pendingSubmissions },
    { label: "Average Score", value: `${overview.averageScore}%` },
  ];

  const submissionStatsByProject = useMemo(() => {
    return submissions.reduce((accumulator, submission) => {
      const projectId = submission.project?._id || submission.project;
      if (!projectId) return accumulator;

      if (!accumulator[projectId]) {
        accumulator[projectId] = { total: 0, reviewed: 0, pending: 0 };
      }

      accumulator[projectId].total += 1;
      if (submission.status === "reviewed") {
        accumulator[projectId].reviewed += 1;
      } else {
        accumulator[projectId].pending += 1;
      }

      return accumulator;
    }, {});
  }, [submissions]);

  const taskStatsByProject = useMemo(() => {
    return tasks.reduce((accumulator, task) => {
      const projectId = task.project?._id || task.project;
      if (!projectId) return accumulator;

      if (!accumulator[projectId]) {
        accumulator[projectId] = { total: 0, completed: 0 };
      }

      accumulator[projectId].total += 1;
      if (task.status === "completed") {
        accumulator[projectId].completed += 1;
      }

      return accumulator;
    }, {});
  }, [tasks]);

  const projectSummaries = useMemo(
    () =>
      projects.map((project) => {
        const readiness = projectReadiness[project._id];
        const assignedUsers = readiness?.assignedUsers || [];
        const averageMatch = assignedUsers.length
          ? Math.round(
              assignedUsers.reduce((sum, user) => sum + (user.resumeMatchPercentage || 0), 0) /
                assignedUsers.length
            )
          : 0;
        const readyUsers = assignedUsers.filter((user) => user.readinessStatus === "Ready").length;
        const taskStats = taskStatsByProject[project._id] || { total: 0, completed: 0 };
        const submissionStats = submissionStatsByProject[project._id] || { total: 0, reviewed: 0, pending: 0 };

        return {
          project,
          assignedUsers,
          averageMatch,
          readyUsers,
          taskStats,
          submissionStats,
        };
      }),
    [projects, projectReadiness, taskStatsByProject, submissionStatsByProject]
  );

  const lowReadinessProjects = projectSummaries.filter(
    (summary) => summary.assignedUsers.length > 0 && (summary.averageMatch < 60 || summary.readyUsers === 0)
  );

  const lowReadinessUsers = useMemo(() => {
    return projectSummaries
      .flatMap((summary) =>
        summary.assignedUsers
          .filter(
            (user) => user.readinessStatus !== "Ready" || (user.resumeMatchPercentage || 0) < 60
          )
          .map((user) => ({
            ...user,
            projectTitle: summary.project.title,
          }))
      )
      .sort((a, b) => (a.resumeMatchPercentage || 0) - (b.resumeMatchPercentage || 0))
      .slice(0, 8);
  }, [projectSummaries]);

  const recentSubmissionRows = useMemo(
    () =>
      [...submissions]
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, 8),
    [submissions]
  );

  const recentActivity = useMemo(
    () =>
      [...recentAttempts]
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, 6),
    [recentAttempts]
  );

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-950">
      <Navbar />
      <div className="galaxy-backdrop-layer absolute inset-0 z-0 min-h-0">
        <Galaxy
          mouseRepulsion
          mouseInteraction
          density={1}
          glowIntensity={0.3}
          saturation={0}
          hueShift={140}
          twinkleIntensity={0.3}
          rotationSpeed={0.1}
          repulsionStrength={2}
          autoCenterRepulsion={0}
          starSpeed={0.5}
          speed={1}
          transparent={false}
          className="h-full w-full min-h-0"
        />
      </div>

      <div className="relative z-10 flex min-h-screen items-start justify-center p-6 pt-10">
        <div className="w-full max-w-7xl space-y-6 text-left">
          <div className="auth-glass-panel max-w-full text-left">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-3xl">
                
                <h1 className="text-3xl font-semibold text-cyan-50">Admin Dashboard</h1>
                
              </div>

              <div className="flex flex-wrap gap-3">
                <button onClick={generateInvite} className="auth-btn-primary" type="button">
                  Generate Invite
                </button>
                <Link
                  to="/admin/quizzes"
                  className="inline-flex items-center justify-center rounded-lg border border-cyan-400/25 bg-slate-950/30 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:border-cyan-300/45 hover:text-cyan-50"
                >
                  Manage Quizzes
                </Link>
                <Link
                  to="/admin/submissions"
                  className="inline-flex items-center justify-center rounded-lg border border-cyan-400/25 bg-slate-950/30 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:border-cyan-300/45 hover:text-cyan-50"
                >
                  Review Submissions
                </Link>
                <Link
                  to="/admin/analytics"
                  className="inline-flex items-center justify-center rounded-lg border border-cyan-400/25 bg-slate-950/30 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:border-cyan-300/45 hover:text-cyan-50"
                >
                  Open Analytics
                </Link>
              </div>
            </div>

            

            {invite && (
              <div className="mt-4 dashboard-glass-muted text-cyan-50">
                <p className="mb-1 text-xs uppercase tracking-wide text-cyan-400/80">Invite code</p>
                <p className="break-all font-mono text-lg font-medium text-cyan-100">{invite}</p>
              </div>
            )}
          </div>

          {message && !/fetch failed|failed to fetch/i.test(message) && (
            <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
              {message}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {statsCards.map((card) => (
              <div key={card.label} className="dashboard-glass-muted border-cyan-500/15 p-4">
                <p className="text-[11px] uppercase tracking-[0.26em] text-cyan-300/70">{card.label}</p>
                <p className="mt-3 text-3xl font-semibold text-cyan-50">{card.value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="dashboard-glass space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-cyan-50">Project Setup</h2>
                <p className="text-sm text-cyan-200/65">
                  Create projects, define required skills, set deadlines, and assign users from one operational panel.
                </p>
              </div>

              <div className="grid gap-4">
                <div className="dashboard-glass-muted space-y-3">
                  <h3 className="text-lg font-semibold text-cyan-50">Create Project</h3>

                  <input
                    value={projectForm.title}
                    onChange={(event) =>
                      setProjectForm((current) => ({ ...current, title: event.target.value }))
                    }
                    placeholder="Project title"
                    className="w-full rounded-lg border border-cyan-500/25 bg-slate-950/40 p-2.5 text-cyan-50 outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30"
                  />

                  <textarea
                    value={projectForm.description}
                    onChange={(event) =>
                      setProjectForm((current) => ({ ...current, description: event.target.value }))
                    }
                    placeholder="Project description"
                    rows={4}
                    className="w-full rounded-lg border border-cyan-500/25 bg-slate-950/40 p-2.5 text-cyan-50 outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30"
                  />

                  <textarea
                    value={projectForm.requiredSkills}
                    onChange={(event) =>
                      setProjectForm((current) => ({ ...current, requiredSkills: event.target.value }))
                    }
                    placeholder="Required skills, comma separated"
                    rows={3}
                    className="w-full rounded-lg border border-cyan-500/25 bg-slate-950/40 p-2.5 text-cyan-50 outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30"
                  />

                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      type="date"
                      value={projectForm.deadline}
                      min={todayISO}
                      onChange={(event) =>
                        setProjectForm((current) => ({ ...current, deadline: event.target.value }))
                      }
                      className="w-full rounded-lg border border-cyan-500/25 bg-slate-950/40 p-2.5 text-cyan-50 outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30"
                    />

                    <select
                      value={projectForm.tier}
                      onChange={(event) =>
                        setProjectForm((current) => ({ ...current, tier: event.target.value }))
                      }
                      className="w-full rounded-lg border border-cyan-500/25 bg-slate-950/40 p-2.5 text-cyan-50 outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30"
                    >
                      <option value="free">Free</option>
                      <option value="pro">Pro</option>
                      <option value="premium">Premium</option>
                    </select>
                  </div>

                  <select
                    multiple
                    value={projectForm.assignedUsers}
                    onChange={(event) => {
                      const selected = Array.from(event.target.selectedOptions, (option) => option.value);
                      setProjectForm((current) => ({ ...current, assignedUsers: selected }));
                    }}
                    className="min-h-[140px] w-full rounded-lg border border-cyan-500/25 bg-slate-950/40 p-2.5 text-cyan-50 outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30"
                  >
                    {users.map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={createProject}
                    className="rounded-lg bg-gradient-to-r from-cyan-600 to-teal-600 px-4 py-2 text-sm font-medium text-white shadow-md transition hover:brightness-110"
                  >
                    Save project
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="dashboard-glass space-y-4">
                <div>
                  <h2 className="text-xl font-semibold text-cyan-50">Quick Actions</h2>
                  <p className="text-sm text-cyan-200/65">Shortcuts for common admin operations.</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Link
                    to="/admin/quizzes"
                    className="rounded-xl border border-cyan-500/15 bg-slate-950/35 px-4 py-3 text-sm font-medium text-cyan-100 transition hover:border-cyan-400/35"
                  >
                    Open quiz tools
                  </Link>
                  <Link
                    to="/admin/submissions"
                    className="rounded-xl border border-cyan-500/15 bg-slate-950/35 px-4 py-3 text-sm font-medium text-cyan-100 transition hover:border-cyan-400/35"
                  >
                    Review submissions
                  </Link>
                  <Link
                    to="/admin/analytics"
                    className="rounded-xl border border-cyan-500/15 bg-slate-950/35 px-4 py-3 text-sm font-medium text-cyan-100 transition hover:border-cyan-400/35"
                  >
                    View analytics
                  </Link>
                  <button
                    type="button"
                    onClick={generateInvite}
                    className="rounded-xl border border-cyan-500/15 bg-slate-950/35 px-4 py-3 text-left text-sm font-medium text-cyan-100 transition hover:border-cyan-400/35"
                  >
                    Refresh invite code
                  </button>
                </div>
              </div>

              <div className="dashboard-glass space-y-4">
                <div>
                  <h2 className="text-xl font-semibold text-cyan-50">Low Readiness Alerts</h2>
                  <p className="text-sm text-cyan-200/65">
                    Projects with weak resume matches or no ready users surface here.
                  </p>
                </div>

                {lowReadinessProjects.length === 0 ? (
                  <p className="text-sm text-cyan-200/60">No readiness issues detected right now.</p>
                ) : (
                  <div className="space-y-3">
                    {lowReadinessProjects.slice(0, 4).map((summary) => (
                      <div key={summary.project._id} className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-cyan-50">{summary.project.title}</p>
                            <p className="text-xs text-cyan-200/70">
                              {summary.averageMatch}% avg match · {summary.readyUsers}/{summary.assignedUsers.length} ready
                            </p>
                          </div>
                          <Link
                            to={`/admin/project/${summary.project._id}`}
                            className="rounded-md border border-cyan-500/20 bg-slate-950/30 px-3 py-1.5 text-xs font-medium text-cyan-100 transition hover:border-cyan-400/35"
                          >
                            Open
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="dashboard-glass space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-cyan-50">Project Assignment Controls</h2>
              <p className="text-sm text-cyan-200/65">
                Manage assigned users, readiness, tasks, and submission status from each project card.
              </p>
            </div>

            {projects.length === 0 ? (
              <p className="text-sm text-cyan-200/60">No projects available yet.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {projectSummaries.map((summary) => (
                  <div key={summary.project._id} className="dashboard-glass-muted space-y-3 border-cyan-500/15 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-cyan-50">{summary.project.title}</h3>
                        <p className="text-sm text-cyan-200/70">{summary.project.description}</p>
                      </div>
                      <Link
                        to={`/admin/project/${summary.project._id}`}
                        className="rounded-md border border-cyan-500/20 bg-slate-950/30 px-3 py-1.5 text-xs font-medium text-cyan-100 transition hover:border-cyan-400/35"
                      >
                        Control
                      </Link>
                    </div>

                    {Array.isArray(summary.project.requiredSkills) && summary.project.requiredSkills.length > 0 && (
                      <p className="text-sm text-cyan-100/80">
                        Required skills: {summary.project.requiredSkills.join(", ")}
                      </p>
                    )}

                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="rounded-xl border border-cyan-500/15 bg-slate-950/35 p-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">Assigned users</p>
                        <p className="mt-1 text-lg font-semibold text-cyan-50">{summary.assignedUsers.length}</p>
                      </div>
                      <div className="rounded-xl border border-cyan-500/15 bg-slate-950/35 p-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">Average match</p>
                        <p className="mt-1 text-lg font-semibold text-cyan-50">{summary.averageMatch}%</p>
                      </div>
                      <div className="rounded-xl border border-cyan-500/15 bg-slate-950/35 p-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">Ready users</p>
                        <p className="mt-1 text-lg font-semibold text-cyan-50">{summary.readyUsers}</p>
                      </div>
                      <div className="rounded-xl border border-cyan-500/15 bg-slate-950/35 p-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">Submission status</p>
                        <p className="mt-1 text-sm font-semibold text-cyan-50">
                          {summary.submissionStats.reviewed}/{summary.submissionStats.total} reviewed
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="rounded-xl border border-cyan-500/15 bg-slate-950/35 p-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">Tasks progress</p>
                        <p className="mt-1 text-sm font-semibold text-cyan-50">
                          {summary.taskStats.completed}/{summary.taskStats.total} completed
                        </p>
                      </div>
                      <div className="rounded-xl border border-cyan-500/15 bg-slate-950/35 p-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">Analysis status</p>
                        <p className="mt-1 text-sm font-semibold text-cyan-50">
                          {summary.assignedUsers.length > 0 ? "Tracked" : "Waiting for assignments"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Delete project \"${summary.project.title}\"?`)) {
                          request(`/api/projects/${summary.project._id}`, "DELETE")
                            .then(() => {
                              setMessage("Project deleted ✅");
                              return loadDashboardData();
                            })
                            .catch((err) => setMessage(err.message));
                        }
                      }}
                      className="rounded-lg bg-rose-600/90 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-500"
                    >
                      Delete project
                    </button>

                    {summary.assignedUsers.length > 0 && (
                      <div className="space-y-2 rounded-xl border border-cyan-500/15 bg-slate-950/35 p-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">Assigned user readiness</p>
                        {summary.assignedUsers.map((user) => (
                          <div
                            key={user.userId}
                            className="flex flex-wrap items-center justify-between gap-2 text-sm text-cyan-100/85"
                          >
                            <span>{user.name}</span>
                            <span>
                              {user.resumeMatchPercentage ?? 0}% · {user.readinessStatus}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="dashboard-glass space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-cyan-50">Recent Submissions</h2>
                <p className="text-sm text-cyan-200/65">Latest uploads and review states from the platform.</p>
              </div>

              {recentSubmissionRows.length === 0 ? (
                <p className="text-sm text-cyan-200/60">No submissions yet.</p>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-cyan-500/15 bg-slate-950/30">
                  <table className="min-w-full text-left text-sm text-cyan-100/85">
                    <thead className="border-b border-cyan-500/15 bg-slate-950/40 text-xs uppercase tracking-[0.22em] text-cyan-300/70">
                      <tr>
                        <th className="px-4 py-3">User</th>
                        <th className="px-4 py-3">Project</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Score</th>
                        <th className="px-4 py-3">Submitted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentSubmissionRows.map((submission) => (
                        <tr key={submission._id} className="border-b border-cyan-500/10 last:border-b-0">
                          <td className="px-4 py-3">{submission.user?.name || "User"}</td>
                          <td className="px-4 py-3">{submission.project?.title || "Project"}</td>
                          <td className="px-4 py-3">{submission.status || "pending"}</td>
                          <td className="px-4 py-3">
                            {submission.score != null ? submission.score : "—"}
                          </td>
                          <td className="px-4 py-3">{formatDate(submission.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="dashboard-glass space-y-4">
                <div>
                  <h2 className="text-xl font-semibold text-cyan-50">User Readiness Status</h2>
                  <p className="text-sm text-cyan-200/65">Users needing attention across assigned projects.</p>
                </div>

                {lowReadinessUsers.length === 0 ? (
                  <p className="text-sm text-cyan-200/60">No low readiness users right now.</p>
                ) : (
                  <div className="space-y-3">
                    {lowReadinessUsers.map((user) => (
                      <div key={`${user.userId}-${user.projectTitle}`} className="rounded-xl border border-cyan-500/15 bg-slate-950/35 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-cyan-50">{user.name}</p>
                            <p className="text-xs text-cyan-200/70">{user.projectTitle}</p>
                          </div>
                          <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-1 text-xs text-cyan-200">
                            {user.resumeMatchPercentage ?? 0}%
                          </span>
                        </div>
                        <p className="mt-2 text-xs uppercase tracking-[0.2em] text-cyan-300/70">
                          {user.readinessStatus}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="dashboard-glass space-y-4">
                <div>
                  <h2 className="text-xl font-semibold text-cyan-50">Recent Activity</h2>
                  <p className="text-sm text-cyan-200/65">Most recent quiz attempts across the team.</p>
                </div>

                {recentActivity.length === 0 ? (
                  <p className="text-sm text-cyan-200/60">No attempts yet.</p>
                ) : (
                  <div className="space-y-3">
                    {recentActivity.map((attempt) => (
                      <div key={attempt._id} className="rounded-xl border border-cyan-500/15 bg-slate-950/35 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-medium text-cyan-50">{attempt.quiz?.title || "Quiz"}</p>
                            <p className="text-xs text-cyan-200/70">{attempt.user?.name || "User"}</p>
                          </div>
                          <span className="text-xs text-cyan-300/70">{formatDate(attempt.createdAt)}</span>
                        </div>
                        <p className="mt-2 text-sm text-cyan-100/85">
                          Score: {attempt.score}/{attempt.total} ({attempt.total ? Math.round((attempt.score / attempt.total) * 100) : attempt.score}%)
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="dashboard-glass space-y-4">
            <h2 className="text-xl font-semibold text-cyan-50">User Tier Management</h2>
            <p className="text-sm text-cyan-200/65">
              Change any user from free to pro or premium. Access updates immediately after saving.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              {users.map((user) => (
                <div key={user._id} className="dashboard-glass-muted space-y-3">
                  <div>
                    <h3 className="font-semibold text-cyan-50">{user.name}</h3>
                    <p className="text-sm text-cyan-200/70">{user.email}</p>
                    <p className="mt-1 text-xs uppercase tracking-wide text-cyan-300/70">
                      Current tier: {user.tier || "free"}
                    </p>
                  </div>

                  <select
                    value={tiers[user._id] || "free"}
                    onChange={(event) =>
                      setTiers((current) => ({
                        ...current,
                        [user._id]: event.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-cyan-500/25 bg-slate-950/40 p-2.5 text-cyan-50 outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30"
                  >
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="premium">Premium</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => updateTier(user._id)}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-white transition hover:bg-emerald-500"
                  >
                    Update tier
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
