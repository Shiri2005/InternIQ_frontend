import { useEffect, useState } from "react";
import { request } from "../services/api";
import Navbar from "../components/Navbar";
import GalaxyLayout from "../components/GalaxyLayout";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
export default function Dashboard() {
  const localUser = JSON.parse(localStorage.getItem("user") || "null") || {};
  const isAdmin = (localUser?.role || "").toLowerCase() === "admin";
  const [tasks, setTasks] = useState([]);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [myQuizzes, setMyQuizzes] = useState([]);
  const [myAttempts, setMyAttempts] = useState([]);
  const [aiFeatures, setAiFeatures] = useState(null);
  const [successChance, setSuccessChance] = useState(null);
  const [skillsInput, setSkillsInput] = useState((localUser?.skills || []).join(", "));
  const [aiLoading, setAiLoading] = useState(false);

  const fetchTasks = async () => {
  try {
    let data;

    if ((localUser?.role || "").toLowerCase() === "admin") {
      data = await request("/tasks");
    } else {
      data = await request("/tasks/my");
    }

    setTasks(data);
  } catch (err) {
    console.log(err.message);
  }
};

  const fetchProjects = async () => {
    try {
     let data;


if ((localUser?.role || "").toLowerCase() === "admin") {
  data = await request("/projects");
} else {
  data = await request("/projects/my");
}


      setProjects(data);
    } catch (err) {
      console.log(err.message);
    }
  };

  const fetchMyQuizzes = async () => {
    try {
      const data = await request("/quiz/user");
      setMyQuizzes(data || []);
    } catch (err) {
      console.log(err.message);
    }
  };

  const fetchMyAttempts = async () => {
    try {
      const data = await request("/quiz/attempts/me");
      setMyAttempts(data || []);
    } catch (err) {
      console.log(err.message);
    }
  };

  const fetchUser = async () => {
    try {
      const data = await request("/users/me");
      setUser(data);
      if (!skillsInput.trim() && Array.isArray(data.skills) && data.skills.length > 0) {
        setSkillsInput(data.skills.join(", "));
      }
    } catch (err) {
      console.log(err.message);
    }
  };

  const loadAiInsights = async (skillsValue = skillsInput) => {
    if (isAdmin) return;
    try {
      setAiLoading(true);
      const data = await request(`/ai/insights?skills=${encodeURIComponent(skillsValue || "")}`);
      setAiFeatures(data.features || null);
      setSuccessChance(data.successProbability ?? null);
    } catch (err) {
      console.log(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      navigate("/admin", { replace: true });
      return;
    }

    fetchTasks();
    fetchUser();
    fetchProjects();
    fetchMyQuizzes();
    fetchMyAttempts();
    loadAiInsights().catch((err) => console.log(err.message));
  }, []);

  const completed = tasks.filter(t => t.status === "completed").length;
  const pending = tasks.length - completed;

  const suggestionList = [];
  if (aiFeatures && aiFeatures.avg_quiz_score < 70) {
    suggestionList.push("Take more quizzes to improve your score consistency.");
  }
  if (aiFeatures && aiFeatures.tasks_completed < 3) {
    suggestionList.push("Complete more assigned tasks to raise your success prediction.");
  }
  if (suggestionList.length === 0) {
    suggestionList.push("Keep practicing weekly and refresh AI insights after each quiz attempt.");
  }


  return (
    <GalaxyLayout>
      <Navbar />
      <div className="mx-auto max-w-6xl space-y-6 p-6">
          <div className="dashboard-glass p-4 md:p-5">
            <h2 className="text-2xl font-bold text-cyan-50">
              Welcome {user?.name || "User"} 👋
            </h2>
            <p className="mt-1 text-sm text-cyan-200/70">
              {user?.email} • Role: {localUser?.role} • Tier: {user?.tier || localUser?.tier || "free"}
            </p>
            <p className="mt-2 text-xs uppercase tracking-[0.2em] text-cyan-300/70">User Dashboard </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-cyan-400/25 bg-cyan-600/35 p-4 text-cyan-50 shadow-lg backdrop-blur-sm">
              <h3 className="text-lg text-cyan-100/95">Total Tasks</h3>
              <p className="text-2xl font-bold">{tasks.length}</p>
            </div>

            <div className="rounded-2xl border border-emerald-400/25 bg-emerald-600/35 p-4 text-emerald-50 shadow-lg backdrop-blur-sm">
              <h3 className="text-lg text-emerald-100/95">Completed</h3>
              <p className="text-2xl font-bold">{completed}</p>
            </div>

            <div className="rounded-2xl border border-amber-400/30 bg-amber-600/35 p-4 text-amber-50 shadow-lg backdrop-blur-sm">
              <h3 className="text-lg text-amber-100/95">Pending</h3>
              <p className="text-2xl font-bold">{pending}</p>
            </div>
          </div>

          <div className="dashboard-glass space-y-5">
            <div className="flex flex-col items-center gap-3 text-center">
              <div>
                <h2 className="text-xl font-semibold text-cyan-50">AI Insights</h2>
                <p className="text-sm text-cyan-200/65">
                  Success Prediction module based on your skills, quiz performance, and activity.
                </p>
              </div>
              <button
                type="button"
                onClick={() => loadAiInsights().catch((err) => alert(err.message))}
                className="self-center rounded-lg border border-cyan-400/25 bg-slate-950/30 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:border-cyan-300/45 hover:text-cyan-50"
              >
                {aiLoading ? "Refreshing..." : "Refresh AI"}
              </button>
            </div>

            <div className="flex justify-center">
              <div className="dashboard-glass-muted w-full max-w-4xl space-y-4 text-center">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/70">Success Prediction</p>
                  <h3 className="mt-2 text-4xl font-semibold text-cyan-50">
                    {successChance != null ? `${successChance}%` : "--"}
                  </h3>
                  <p className="mt-2 text-sm text-cyan-200/65">
                    {successChance != null
                      ? "Predicted from current learning activity."
                      : "Add activity data or refresh to generate a prediction."}
                  </p>
                </div>

                <div className="rounded-xl border border-cyan-500/15 bg-slate-950/35 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">Suggestions</p>
                  <ul className="mt-2 space-y-1 text-sm text-cyan-100/85">
                    {suggestionList.map((item, index) => (
                      <li key={`${item}-${index}`}>• {item}</li>
                    ))}
                  </ul>
                </div>

                {aiFeatures && (
                  <div className="grid gap-3 sm:grid-cols-2 text-left">
                    <div className="rounded-xl border border-cyan-500/15 bg-slate-950/35 p-3">
                      <p className="text-xs text-cyan-300/70">Avg quiz score</p>
                      <p className="mt-1 text-lg font-semibold text-cyan-50">{aiFeatures.avg_quiz_score}%</p>
                    </div>
                    <div className="rounded-xl border border-cyan-500/15 bg-slate-950/35 p-3">
                      <p className="text-xs text-cyan-300/70">Tasks completed</p>
                      <p className="mt-1 text-lg font-semibold text-cyan-50">{aiFeatures.tasks_completed}</p>
                    </div>
                    <div className="rounded-xl border border-cyan-500/15 bg-slate-950/35 p-3">
                      <p className="text-xs text-cyan-300/70">Avg review score</p>
                      <p className="mt-1 text-lg font-semibold text-cyan-50">{aiFeatures.avg_review_score}</p>
                    </div>
                    <div className="rounded-xl border border-cyan-500/15 bg-slate-950/35 p-3">
                      <p className="text-xs text-cyan-300/70">Consistency</p>
                      <p className="mt-1 text-lg font-semibold text-cyan-50">{Math.round((aiFeatures.consistency || 0) * 100)}%</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="dashboard-glass space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-cyan-50">My Quizzes</h2>
                <Link
                  to="/quiz"
                  className="rounded-lg bg-gradient-to-r from-cyan-600 to-teal-600 px-3 py-1.5 text-sm font-medium text-white transition hover:brightness-110"
                >
                  My Quizzes
                </Link>
              </div>

              {myQuizzes.length === 0 ? (
                <p className="text-sm text-cyan-200/60">No quizzes assigned yet.</p>
              ) : (
                <div className="space-y-2">
                  {myQuizzes.slice(0, 4).map((quiz) => (
                    <div key={quiz._id} className="dashboard-glass-muted">
                      <p className="font-medium text-cyan-50">{quiz.title}</p>
                      <p className="text-xs text-cyan-300/70">Tier: {quiz.requiredTier || "free"}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="dashboard-glass space-y-3">
              <h2 className="text-xl font-semibold text-cyan-50">My Attempts</h2>
              {myAttempts.length === 0 ? (
                <p className="text-sm text-cyan-200/60">No attempts yet. Start a quiz to see your scores.</p>
              ) : (
                <div className="space-y-2">
                  {myAttempts.slice(0, 5).map((attempt) => (
                    <div key={attempt._id} className="dashboard-glass-muted">
                      <p className="font-medium text-cyan-50">{attempt.quiz?.title || "Quiz"}</p>
                      <p className="text-xs text-cyan-300/70">
                        Score: {attempt.score}/{attempt.total} ({attempt.total ? Math.round((attempt.score / attempt.total) * 100) : attempt.score}%)
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="dashboard-glass">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-cyan-50">My Learning Modules</h2>
                <p className="text-sm text-cyan-200/65">
                  Open your assigned  study materials from one place.
                </p>
              </div>

              <Link
                to="/study-materials"
                className="rounded-lg border border-cyan-400/25 bg-slate-950/30 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:border-cyan-300/45 hover:text-cyan-50"
              >
                Study Materials
              </Link>
            </div>
          </div>

          <div className="dashboard-glass">
            <h2 className="mb-4 text-xl font-semibold text-cyan-50">
              Projects 🚀
            </h2>

            {projects.length === 0 ? (
              <p className="text-cyan-200/60">No projects available</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {projects.map((proj) => (
                  <div
                    key={proj._id}
                    onClick={() => {
                      if ((localUser?.role || "").toLowerCase() === "admin") {
                        navigate(`/admin/project/${proj._id}`);
                      } else {
                        navigate(`/project/${proj._id}`);
                      }
                    }}
                    className="dashboard-glass-muted cursor-pointer p-4 transition hover:border-cyan-400/35 hover:bg-slate-900/55"
                  >
                    <h3 className="text-lg font-bold text-cyan-50">
                      {proj.title}
                    </h3>
                    <p className="text-sm text-cyan-200/65">
                      {proj.description}
                    </p>
                    <span className="mt-2 inline-block rounded-md border border-cyan-500/30 bg-cyan-500/15 px-2 py-1 text-xs text-cyan-200">
                      {proj.tier}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-violet-400/30 bg-violet-600/40 p-4 text-violet-50 shadow-lg backdrop-blur-sm">
            🚀 Keep going! Complete your tasks to earn certificate
          </div>
        </div>
    </GalaxyLayout>
  );
}
