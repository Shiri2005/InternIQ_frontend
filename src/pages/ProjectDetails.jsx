import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { request, certificateOpenUrl } from "../services/api";
import Navbar from "../components/Navbar";
import GalaxyLayout from "../components/GalaxyLayout";

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const localUser = JSON.parse(localStorage.getItem("user")) || {};
  const [tasks, setTasks] = useState([]);
  const [project, setProject] = useState(null);
  const [projectReadiness, setProjectReadiness] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [submissionText, setSubmissionText] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [users, setUsers] = useState([]);
  const [mySubmission, setMySubmission] = useState(null);
  const [assignedTo, setAssignedTo] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const resumeInputRef = useRef(null);

  const fetchProjectReadiness = async () => {
    try {
      const data = await request(`/projects/${id}/readiness`);
      setProject(data.project || null);
      setProjectReadiness(data || null);
      setLoadError("");
    } catch (err) {
      if (/access denied|upgrade your tier/i.test(err.message)) {
        setLoadError("");
        return;
      }

      setLoadError(err.message);
    }
  };

  const fetchMySubmission = async () => {
    try {
      const data = await request("/submissions/my");

      const found = data.find(
        (s) =>
          s.project?.toString() === id && s.user?.toString() === localUser._id
      );

      setMySubmission(found || null);
    } catch (err) {
      console.log(err.message);
    }
  };

  const createTask = async () => {
    try {
      await request("/tasks", "POST", {
        title,
        description,
        project: id,
        assignedTo,
      });

      alert("Task created ✅");

      setTitle("");
      setDescription("");

      fetchTasks();
    } catch (err) {
      alert(err.message);
    }
  };

  const fetchUsers = async () => {
    if (localUser?.role !== "admin") return;
    try {
      const data = await request("/users");
      setUsers(data);
    } catch (err) {
      console.log(err.message);
    }
  };

  const fetchTasks = async () => {
    try {
      const data = await request(`/tasks/project/${id}`);
      setTasks(data);
    } catch (err) {
      console.log(err.message);
    }
  };

  const analyzeResume = async () => {
    try {
      if (!resumeFile) {
        alert("Please choose a resume PDF first");
        return;
      }

      const formData = new FormData();
      formData.append("resume", resumeFile);

      setResumeLoading(true);
      const data = await request(`/projects/${id}/resume-analysis`, "POST", formData);

      const normalizedAnalysis = {
        _id: data._id || projectReadiness?.analysis?._id,
        resumeMatchPercentage: data.match_percentage ?? data.resumeMatchPercentage ?? 0,
        matchedSkills: data.matched_skills ?? data.matchedSkills ?? [],
        missingSkills: data.missing_skills ?? data.missingSkills ?? [],
        suggestions: data.suggestions ?? [],
        uploadedResumePath: data.uploadedResumePath || "",
        analyzedAt: data.analyzedAt || new Date().toISOString(),
        readinessStatus: data.readinessStatus || "Improvement recommended",
        analysisStatus: "analyzed",
      };

      setProjectReadiness((current) => ({
        ...(current || {}),
        project: current?.project || project,
        analysis: normalizedAnalysis,
        prompt: current?.prompt || "Analyze your resume to check project readiness",
      }));
      setResumeFile(null);
      if (resumeInputRef.current) {
        resumeInputRef.current.value = "";
      }
      fetchMySubmission();
    } catch (err) {
      alert(err.message);
    } finally {
      setResumeLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectReadiness();
    fetchTasks();
    if (localUser?.role === "admin") {
      fetchUsers();
    }
    fetchMySubmission();

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchMySubmission();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [id]);

  const inputClass =
    "w-full rounded-lg border border-cyan-500/25 bg-slate-950/40 p-2.5 text-cyan-50 placeholder:text-slate-500 outline-none transition-[border-color,box-shadow] duration-150 focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30";

  const requiredSkills = projectReadiness?.project?.requiredSkills || project?.requiredSkills || [];
  const analysis = projectReadiness?.analysis || null;
  const isAssigned =
    localUser?.role !== "user"
      ? true
      : Array.isArray(projectReadiness?.project?.assignedUsers) &&
        projectReadiness.project.assignedUsers.some(
          (user) => (user?._id || user?.userId || user)?.toString() === localUser._id
        );
  const showFullProject = localUser?.role !== "user" || Boolean(analysis);

  return (
    <GalaxyLayout>
      <Navbar />

      <div className="mx-auto max-w-4xl space-y-6 p-6">
        {loadError && !/access denied|upgrade your tier/i.test(loadError) && (
          <div className="rounded-xl border border-rose-500/25 bg-rose-950/40 px-4 py-3 text-sm text-rose-100">
            {loadError}
          </div>
        )}

        <div className="dashboard-glass space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-cyan-50">{project?.title}</h2>
            <p className="mt-2 text-cyan-200/70">{project?.description}</p>
            {project?.tier && (
              <span className="mt-3 inline-block rounded-md border border-cyan-500/30 bg-cyan-500/15 px-2 py-1 text-xs text-cyan-200">
                Tier: {project.tier}
              </span>
            )}
          </div>

          {requiredSkills.length > 0 && (
            <div className="rounded-xl border border-cyan-500/15 bg-slate-950/30 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">Required skills</p>
              <p className="mt-2 text-sm text-cyan-100">{requiredSkills.join(", ")}</p>
            </div>
          )}

          {localUser?.role === "user" && isAssigned && (
            <div className="rounded-xl border border-amber-400/25 bg-amber-500/10 p-4 text-amber-50">
              <p className="font-medium">Analyze your resume to check project readiness</p>
              <p className="mt-1 text-sm text-amber-100/80">
                Upload a resume PDF to compare your skills with this project's requirements. You can continue after the analysis is saved.
              </p>
            </div>
          )}

          {analysis && (
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/80">Match</p>
                <p className="mt-2 text-3xl font-semibold text-emerald-50">{analysis.resumeMatchPercentage ?? 0}%</p>
              </div>
              <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/80">Status</p>
                <p className="mt-2 text-lg font-semibold text-cyan-50">{analysis.readinessStatus || "Improvement recommended"}</p>
              </div>
              <div className="rounded-xl border border-violet-400/20 bg-violet-500/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-violet-200/80">Uploaded</p>
                <p className="mt-2 text-sm text-violet-50">{analysis.analyzedAt ? new Date(analysis.analyzedAt).toLocaleString() : "Just now"}</p>
              </div>
            </div>
          )}

          {analysis && (
            <div className="dashboard-glass-muted space-y-3 border-cyan-500/15 p-4">
              <p className="text-sm text-cyan-100">
                Your resume match is {analysis.resumeMatchPercentage ?? 0}%. {analysis.readinessStatus || "Improvement recommended"}.
              </p>
              {Array.isArray(analysis.matchedSkills) && analysis.matchedSkills.length > 0 && (
                <p className="text-sm text-emerald-100/85">
                  Matched skills: {analysis.matchedSkills.join(", ")}
                </p>
              )}
              {Array.isArray(analysis.missingSkills) && analysis.missingSkills.length > 0 && (
                <p className="text-sm text-amber-100/85">
                  Missing skills: {analysis.missingSkills.join(", ")}
                </p>
              )}
              {Array.isArray(analysis.suggestions) && analysis.suggestions.length > 0 && (
                <ul className="space-y-1 text-sm text-cyan-100/80">
                  {analysis.suggestions.map((suggestion, index) => (
                    <li key={`${suggestion}-${index}`}>• {suggestion}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {localUser?.role === "user" && isAssigned && (
            <div className="dashboard-glass-muted space-y-3 border-cyan-500/15 p-4">
              <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                <input
                  ref={resumeInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={(event) => setResumeFile(event.target.files?.[0] || null)}
                  className="block w-full text-sm text-cyan-100 file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-500/15 file:px-4 file:py-2 file:text-cyan-100 hover:file:bg-cyan-500/25"
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (analysis) {
                      if (!window.confirm("This will replace your previous analysis. Continue?")) return;
                    }
                    await analyzeResume();
                  }}
                  disabled={resumeLoading}
                  className="rounded-lg bg-gradient-to-r from-cyan-600 to-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {resumeLoading ? "Analyzing..." : (analysis ? "Re-analyze Resume" : "Upload Resume & Analyze")}
                </button>
              </div>
            </div>
          )}

          {localUser?.role === "admin" && (
            <button
              onClick={async () => {
                if (!window.confirm("Delete project?")) return;

                await request(`/projects/${id}`, "DELETE");
                alert("Deleted ✅");
                navigate("/dashboard");
              }}
              className="rounded-lg bg-rose-600/90 px-3 py-2 text-sm font-medium text-white transition hover:bg-rose-500"
              type="button"
            >
              Delete project
            </button>
          )}
        </div>

        {showFullProject && (
          <>
            {localUser?.role === "admin" && (
              <div className="dashboard-glass">
                <h2 className="mb-4 text-xl font-semibold text-cyan-50">Tasks 📋</h2>

                <div className="dashboard-glass-muted mb-6 space-y-3">
                  <h3 className="text-lg font-semibold text-cyan-100">Create task</h3>

                  <input
                    type="text"
                    placeholder="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={inputClass}
                  />

                  <input
                    type="text"
                    placeholder="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={inputClass}
                  />

                  <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Select user</option>
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

                {tasks.length === 0 ? (
                  <p className="text-cyan-200/60">No tasks yet</p>
                ) : (
                  <div className="space-y-3">
                    {tasks.map((task) => (
                      <div
                        key={task._id}
                        className="dashboard-glass-muted border-cyan-500/15 p-4"
                      >
                        <h3 className="font-semibold text-cyan-50">{task.title}</h3>
                        <p className="text-sm text-cyan-200/65">{task.description}</p>

                        <p className="mt-2 text-xs text-cyan-300/80">
                          Status: {task.status}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {localUser?.role === "user" && !isAssigned && (
              <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-950/40 p-4">
                <p className="font-medium text-rose-200">
                  You are not assigned to this project ❌
                </p>
              </div>
            )}

            {localUser?.role === "user" && isAssigned && !mySubmission && (
              <div className="dashboard-glass-muted mb-6 space-y-3 border-cyan-500/15 p-4">
                <h3 className="text-lg font-semibold text-cyan-100">Submit work 📤</h3>

                <input
                  type="text"
                  placeholder="Submission description"
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  className={inputClass}
                />

                <input
                  type="text"
                  placeholder="File URL"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  className={inputClass}
                />

                <button
                  onClick={async () => {
                    try {
                      if (!fileUrl.includes("http")) {
                        alert("Enter valid URL");
                        return;
                      }

                      await request("/submissions", "POST", {
                        project: id,
                        task: tasks[0]?._id,
                        description: submissionText,
                        fileUrl,
                      });
                      alert("Submitted ✅");
                      setSubmissionText("");
                      setFileUrl("");
                      fetchMySubmission();
                    } catch (err) {
                      alert(err.message);
                    }
                  }}
                  className="rounded-lg bg-cyan-600 px-4 py-2 font-medium text-white shadow-md transition hover:bg-cyan-500"
                  type="button"
                >
                  Submit
                </button>
              </div>
            )}

            {localUser?.role === "user" && mySubmission && (
              <div className="mb-6 rounded-xl border border-emerald-500/25 bg-emerald-950/35 p-4">
                <p className="font-medium text-emerald-100">
                  Status: {mySubmission.status}
                </p>

                {mySubmission.status === "reviewed" && (
                  <>
                    <p className="mt-2 text-emerald-100/90">
                      Score: {mySubmission.score}
                    </p>
                    <p className="mt-1 text-sm text-emerald-100/80">
                      Feedback: {mySubmission.feedback}
                    </p>

                    {mySubmission.isCertified && mySubmission.certificateUrl && (
                      <button
                        onClick={() => {
                          const url = certificateOpenUrl(
                            mySubmission.certificateUrl,
                            mySubmission.updatedAt
                          );
                          window.open(url, "_blank");
                        }}
                        className="mt-4 inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-emerald-500"
                        type="button"
                      >
                        View Certificate 🎓
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            <div className="dashboard-glass">
              <h2 className="mb-4 text-xl font-semibold text-cyan-50">Tasks 📋</h2>
              {tasks.length === 0 ? (
                <p className="text-cyan-200/60">No tasks yet</p>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div
                      key={task._id}
                      className="dashboard-glass-muted border-cyan-500/15 p-4"
                    >
                      <h3 className="font-semibold text-cyan-50">{task.title}</h3>
                      <p className="text-sm text-cyan-200/65">{task.description}</p>

                      <p className="mt-2 text-xs text-cyan-300/80">
                        Status: {task.status}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </GalaxyLayout>
  );
}
