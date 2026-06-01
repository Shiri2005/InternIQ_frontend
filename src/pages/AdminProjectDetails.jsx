import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { request } from "../services/api";
import Navbar from "../components/Navbar";
import GalaxyLayout from "../components/GalaxyLayout";

export default function AdminProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const localUser = JSON.parse(localStorage.getItem("user")) || {};
  const [project, setProject] = useState(null);
  const [projectReadiness, setProjectReadiness] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  const fetchProject = async () => {
    try {
      const data = await request(`/api/projects/${id}/readiness`);
      setProject(data.project || null);
      setProjectReadiness(data || null);
      setLoadError("");
    } catch (err) {
      setLoadError(err.message);
    }
  };

  const fetchTasks = async () => {
    try {
      const data = await request(`/api/tasks/project/${id}`);
      setTasks(data);
    } catch (err) {
      console.log(err.message);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await request("/api/users");
      setUsers(data);
    } catch (err) {
      console.log(err.message);
    }
  };

  const createTask = async () => {
    try {
      await request("/api/tasks", "POST", {
        title,
        description,
        project: id,
        assignedTo,
      });

      alert("Task created ✅");

      setTitle("");
      setDescription("");
      setAssignedTo("");

      fetchTasks();
      fetchProject();
    } catch (err) {
      alert(err.message);
    }
  };

  useEffect(() => {
    fetchProject();
    fetchTasks();
    fetchUsers();
  }, [id]);

  const inputClass =
    "w-full rounded-lg border border-cyan-500/25 bg-slate-950/40 p-2.5 text-cyan-50 placeholder:text-slate-500 outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30";
  const assignedUsers = projectReadiness?.assignedUsers || [];
  const analyzedUsers = assignedUsers.filter((user) => user.analysisStatus === "analyzed");
  const readyUsers = analyzedUsers.filter((user) => user.resumeMatchPercentage >= 80);

  return (
    <GalaxyLayout>
      <Navbar />

      <div className="mx-auto max-w-4xl space-y-6 p-6">
        {loadError && (
          <div className="rounded-xl border border-rose-500/25 bg-rose-950/40 px-4 py-3 text-sm text-rose-100">
            {loadError}
          </div>
        )}

        <div className="dashboard-glass space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-cyan-50">{project?.title}</h2>
              <p className="mt-2 text-cyan-200/70">{project?.description}</p>
              {Array.isArray(project?.requiredSkills) && project.requiredSkills.length > 0 && (
                <p className="mt-3 text-sm text-cyan-100/80">Required skills: {project.requiredSkills.join(", ")}</p>
              )}
              {project?.tier && (
                <span className="mt-3 inline-block rounded-md border border-cyan-500/30 bg-cyan-500/15 px-2 py-1 text-xs text-cyan-200">Tier: {project.tier}</span>
              )}
            </div>

            <div>
              <button
                onClick={() => navigate('/admin')}
                className="rounded-md bg-cyan-600/90 px-3 py-1 text-sm font-medium text-white hover:brightness-110"
                type="button"
              >
                Back to Admin Dashboard
              </button>
            </div>
          </div>

          {localUser?.role?.toLowerCase() === "admin" && (
            <button
              onClick={async () => {
                if (!window.confirm("Delete project?")) return;

                await request(`/api/projects/${id}`, "DELETE");
                alert("Deleted ✅");
                navigate("/dashboard");
              }}
              className="mt-2 rounded-lg bg-rose-600/90 px-3 py-2 text-sm font-medium text-white transition hover:bg-rose-500"
              type="button"
            >
              Delete project
            </button>
          )}
        </div>

        <div className="dashboard-glass space-y-4">
          <h2 className="text-xl font-semibold text-cyan-50">Assigned users & readiness</h2>
          <p className="text-sm text-cyan-200/65">
            Resume analysis is stored per user and project so the readiness view survives refreshes and sign-outs.
          </p>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="dashboard-glass-muted">
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/75">Assigned users</p>
              <p className="mt-2 text-3xl font-semibold text-cyan-50">{assignedUsers.length}</p>
            </div>
            <div className="dashboard-glass-muted">
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/75">Analyzed</p>
              <p className="mt-2 text-3xl font-semibold text-cyan-50">{analyzedUsers.length}</p>
            </div>
            <div className="dashboard-glass-muted">
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/75">Ready</p>
              <p className="mt-2 text-3xl font-semibold text-cyan-50">{readyUsers.length}</p>
            </div>
          </div>

          {assignedUsers.length === 0 ? (
            <p className="text-sm text-cyan-200/60">No assigned users yet.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {assignedUsers.map((user) => (
                <div key={user.userId} className="dashboard-glass-muted space-y-2 border-cyan-500/15 p-4">
                  <div>
                    <h3 className="font-semibold text-cyan-50">{user.name}</h3>
                    <p className="text-sm text-cyan-200/70">{user.email}</p>
                  </div>

                  <p className="text-sm text-cyan-100">Status: {user.readinessStatus}</p>
                  <p className="text-sm text-cyan-100">Match: {user.resumeMatchPercentage ?? 0}%</p>

                  {Array.isArray(user.missingSkills) && user.missingSkills.length > 0 && (
                    <p className="text-sm text-amber-200/85">
                      Missing skills: {user.missingSkills.join(", ")}
                    </p>
                  )}

                  {Array.isArray(user.suggestions) && user.suggestions.length > 0 && (
                    <ul className="space-y-1 text-sm text-cyan-100/80">
                      {user.suggestions.map((suggestion, index) => (
                        <li key={`${user.userId}-${index}`}>• {suggestion}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dashboard-glass space-y-3">
          <h2 className="text-xl font-semibold text-cyan-50">Create task 🛠️</h2>

          <input
            type="text"
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
          />

          <input
            type="text"
            placeholder="Task description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputClass}
          />

          <select
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className={inputClass}
          >
            <option value="">Assign user</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name}
              </option>
            ))}
          </select>

          <button
            onClick={createTask}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-white shadow-md transition hover:bg-emerald-500"
            type="button"
          >
            Create task
          </button>
        </div>

        <div className="dashboard-glass">
          <h2 className="mb-4 text-xl font-semibold text-cyan-50">Tasks 📋</h2>

          {tasks.length === 0 ? (
            <p className="text-cyan-200/60">No tasks yet</p>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div key={task._id} className="dashboard-glass-muted p-4">
                  <h3 className="font-semibold text-cyan-50">{task.title}</h3>
                  <p className="text-sm text-cyan-200/65">{task.description}</p>

                  <p className="mt-2 text-xs text-cyan-300/80">
                    Status: {task.status}
                  </p>

                  <p className="text-xs text-cyan-300/80">
                    Assigned to: {task.assignedTo?.name || "N/A"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dashboard-glass flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate("/admin/submissions")}
            className="rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-600 px-4 py-2.5 font-medium text-white shadow-md transition hover:brightness-110"
            type="button"
          >
            View submissions 📋
          </button>
        </div>
      </div>
    </GalaxyLayout>
  );
}
