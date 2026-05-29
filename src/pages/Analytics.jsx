import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { request } from "../services/api";
import Galaxy from "../components/Galaxy";
import Navbar from "../components/Navbar";

const MATCH_BUCKETS = ["0-19", "20-39", "40-59", "60-79", "80-100"];

function toDayKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function formatDayLabel(dayKey) {
  if (!dayKey) return "—";
  const date = new Date(`${dayKey}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dayKey;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function AdminAnalytics() {
  const [overview, setOverview] = useState({
    totalUsers: 0,
    totalQuizzes: 0,
    totalAttempts: 0,
    averageScore: 0,
  });
  const [analytics, setAnalytics] = useState({
    averageSuccessRate: 0,
    topPerformingUsers: [],
    commonMissingSkills: [],
    skillDemandTrends: [],
  });
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [projectReadiness, setProjectReadiness] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [overviewData, analyticsData, projectData, taskData, submissionData, attemptData] = await Promise.all([
        request("/users/admin-overview"),
        request("/ai/admin-analytics"),
        request("/projects"),
        request("/tasks"),
        request("/submissions"),
        request("/quiz/attempts"),
      ]);

      setOverview({
        totalUsers: overviewData.totalUsers || 0,
        totalQuizzes: overviewData.totalQuizzes || 0,
        totalAttempts: overviewData.totalAttempts || 0,
        averageScore: overviewData.averageScore || 0,
      });
      setAnalytics({
        averageSuccessRate: analyticsData.averageSuccessRate || 0,
        topPerformingUsers: analyticsData.topPerformingUsers || [],
        commonMissingSkills: analyticsData.commonMissingSkills || [],
        skillDemandTrends: analyticsData.skillDemandTrends || [],
      });
      setProjects(projectData || []);
      setTasks(taskData || []);
      setSubmissions(submissionData || []);
      setAttempts(attemptData || []);

      const readinessPairs = await Promise.all(
        (projectData || []).map(async (project) => {
          try {
            const readiness = await request(`/projects/${project._id}/readiness`);
            return [project._id, readiness];
          } catch {
            return [project._id, null];
          }
        })
      );

      setProjectReadiness(Object.fromEntries(readinessPairs.filter(Boolean)));
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const readinessEntries = useMemo(
    () => Object.values(projectReadiness).flatMap((entry) => entry?.assignedUsers || []),
    [projectReadiness]
  );

  const pendingSubmissions = submissions.filter((submission) => submission.status !== "reviewed").length;
  const reviewedSubmissions = submissions.length - pendingSubmissions;
  const completedTasks = tasks.filter((task) => task.status === "completed").length;

  const averageMatch = readinessEntries.length
    ? Math.round(
        readinessEntries.reduce((sum, user) => sum + (user.resumeMatchPercentage || 0), 0) /
          readinessEntries.length
      )
    : 0;

  const projectCompletionRate = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const submissionReviewRate = submissions.length ? Math.round((reviewedSubmissions / submissions.length) * 100) : 0;

  const readinessCounts = useMemo(() => {
    return readinessEntries.reduce(
      (accumulator, user) => {
        const status = user.readinessStatus || "Not analyzed";
        accumulator[status] = (accumulator[status] || 0) + 1;
        return accumulator;
      },
      { Ready: 0, "Improvement recommended": 0, "Not analyzed": 0, "Not ready": 0 }
    );
  }, [readinessEntries]);

  const matchDistribution = useMemo(() => {
    const buckets = MATCH_BUCKETS.reduce((accumulator, bucket) => {
      accumulator[bucket] = 0;
      return accumulator;
    }, {});

    readinessEntries.forEach((user) => {
      const match = Math.max(0, Math.min(100, Number(user.resumeMatchPercentage) || 0));
      if (match < 20) buckets["0-19"] += 1;
      else if (match < 40) buckets["20-39"] += 1;
      else if (match < 60) buckets["40-59"] += 1;
      else if (match < 80) buckets["60-79"] += 1;
      else buckets["80-100"] += 1;
    });

    return buckets;
  }, [readinessEntries]);

  const submissionTimeline = useMemo(() => {
    const days = [];
    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = new Date();
      date.setDate(date.getDate() - offset);
      const key = date.toISOString().slice(0, 10);
      days.push({ key, label: formatDayLabel(key), count: 0 });
    }

    const countsByDay = submissions.reduce((accumulator, submission) => {
      const key = toDayKey(submission.createdAt);
      if (!key) return accumulator;
      accumulator[key] = (accumulator[key] || 0) + 1;
      return accumulator;
    }, {});

    return days.map((day) => ({
      ...day,
      count: countsByDay[day.key] || 0,
    }));
  }, [submissions]);

  const projectCompletionRows = useMemo(() => {
    return projects
      .map((project) => {
        const completed = tasks.filter((task) => String(task.project?._id || task.project) === String(project._id) && task.status === "completed").length;
        const total = tasks.filter((task) => String(task.project?._id || task.project) === String(project._id)).length;
        const rate = total ? Math.round((completed / total) * 100) : 0;
        return { project, completed, total, rate };
      })
      .sort((left, right) => right.rate - left.rate);
  }, [projects, tasks]);

  const topMissingSkills = analytics.commonMissingSkills || [];
  const skillDemandTrends = analytics.skillDemandTrends || [];
  const topPerformers = analytics.topPerformingUsers || [];

  const maxTimeline = Math.max(1, ...submissionTimeline.map((item) => item.count));
  const maxProjectRate = Math.max(1, ...projectCompletionRows.map((item) => item.rate));
  const maxDemand = Math.max(1, ...skillDemandTrends.map((item) => item.count));

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-950">
      <Navbar />
      <div className="galaxy-backdrop-layer absolute inset-0 z-0 min-h-0">
        <Galaxy
          mouseRepulsion
          mouseInteraction
          density={0.9}
          glowIntensity={0.22}
          saturation={0}
          hueShift={185}
          twinkleIntensity={0.45}
          rotationSpeed={0.08}
          repulsionStrength={1.5}
          autoCenterRepulsion={0}
          starSpeed={0.4}
          speed={0.9}
          transparent={false}
          className="h-full w-full min-h-0"
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 p-6 pt-10">
        <div className="dashboard-glass space-y-4 border-cyan-500/15">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl space-y-2">
              <p className="text-xs uppercase tracking-[0.32em] text-cyan-300/70">Analytics & Reports</p>
              <h1 className="text-3xl font-semibold text-cyan-50">Platform Insights</h1>
              <p className="text-sm text-cyan-200/65">
                Visual reporting for readiness, completion, submissions, and skill demand trends across the platform.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={loadData}
                className="rounded-lg border border-cyan-400/25 bg-slate-950/30 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:border-cyan-300/45 hover:text-cyan-50"
              >
                Refresh data
              </button>
              <Link
                to="/admin"
                className="rounded-lg border border-cyan-400/25 bg-slate-950/30 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:border-cyan-300/45 hover:text-cyan-50"
              >
                Back to Admin
              </Link>
            </div>
          </div>

          {message && !loading && (
            <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
              {message}
            </div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="dashboard-glass-muted border-cyan-500/15 p-4 text-center">
            <p className="text-[11px] uppercase tracking-[0.26em] text-cyan-300/70">Average success rate</p>
            <p className="mt-3 text-4xl font-semibold text-cyan-50">{analytics.averageSuccessRate}%</p>
          </div>
          <div className="dashboard-glass-muted border-cyan-500/15 p-4 text-center">
            <p className="text-[11px] uppercase tracking-[0.26em] text-cyan-300/70">Project completion rate</p>
            <p className="mt-3 text-4xl font-semibold text-cyan-50">{projectCompletionRate}%</p>
          </div>
          <div className="dashboard-glass-muted border-cyan-500/15 p-4 text-center">
            <p className="text-[11px] uppercase tracking-[0.26em] text-cyan-300/70">Submission review rate</p>
            <p className="mt-3 text-4xl font-semibold text-cyan-50">{submissionReviewRate}%</p>
          </div>
          <div className="dashboard-glass-muted border-cyan-500/15 p-4 text-center">
            <p className="text-[11px] uppercase tracking-[0.26em] text-cyan-300/70">Average resume match</p>
            <p className="mt-3 text-4xl font-semibold text-cyan-50">{averageMatch}%</p>
          </div>
        </div>

        {loading ? (
          <div className="dashboard-glass text-cyan-100">Loading analytics...</div>
        ) : (
          <>
            <div className="grid gap-6 xl:grid-cols-2">
              <div className="dashboard-glass space-y-4">
                <div>
                  <h2 className="text-xl font-semibold text-cyan-50">Resume Match % Distribution</h2>
                  <p className="text-sm text-cyan-200/65">How assigned users are distributed across match bands.</p>
                </div>

                <div className="space-y-3">
                  {MATCH_BUCKETS.map((bucket) => {
                    const count = matchDistribution[bucket] || 0;
                    const width = readinessEntries.length ? Math.round((count / readinessEntries.length) * 100) : 0;
                    return (
                      <div key={bucket} className="space-y-1">
                        <div className="flex items-center justify-between text-sm text-cyan-100/80">
                          <span>{bucket}%</span>
                          <span>{count}</span>
                        </div>
                        <div className="h-3 rounded-full bg-slate-950/45">
                          <div
                            className="h-3 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="dashboard-glass space-y-4">
                <div>
                  <h2 className="text-xl font-semibold text-cyan-50">User Readiness Breakdown</h2>
                  <p className="text-sm text-cyan-200/65">Readiness distribution across all analyzed assignments.</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ["Ready", readinessCounts.Ready || 0],
                    ["Improvement recommended", readinessCounts["Improvement recommended"] || 0],
                    ["Not analyzed", readinessCounts["Not analyzed"] || 0],
                    ["Not ready", readinessCounts["Not ready"] || 0],
                  ].map(([label, count]) => (
                    <div key={label} className="rounded-xl border border-cyan-500/15 bg-slate-950/35 p-4 text-center">
                      <p className="text-xs uppercase tracking-[0.24em] text-cyan-300/70">{label}</p>
                      <p className="mt-2 text-3xl font-semibold text-cyan-50">{count}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <div className="dashboard-glass space-y-4">
                <div>
                  <h2 className="text-xl font-semibold text-cyan-50">Submission Activity Timeline</h2>
                  <p className="text-sm text-cyan-200/65">Submissions created over the last seven days.</p>
                </div>

                <div className="space-y-3">
                  {submissionTimeline.map((day) => {
                    const width = Math.round((day.count / maxTimeline) * 100);
                    return (
                      <div key={day.key} className="space-y-1">
                        <div className="flex items-center justify-between text-sm text-cyan-100/80">
                          <span>{day.label}</span>
                          <span>{day.count}</span>
                        </div>
                        <div className="h-3 rounded-full bg-slate-950/45">
                          <div
                            className="h-3 rounded-full bg-gradient-to-r from-teal-500 to-cyan-400"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="dashboard-glass space-y-4">
                <div>
                  <h2 className="text-xl font-semibold text-cyan-50">Task Completion Analytics</h2>
                  <p className="text-sm text-cyan-200/65">Completion rate by project based on current tasks.</p>
                </div>

                {projectCompletionRows.length === 0 ? (
                  <p className="text-sm text-cyan-200/60">No project data available yet.</p>
                ) : (
                  <div className="space-y-3">
                    {projectCompletionRows.slice(0, 6).map((row) => (
                      <div key={row.project._id} className="space-y-1">
                        <div className="flex items-center justify-between text-sm text-cyan-100/80">
                          <span>{row.project.title}</span>
                          <span>{row.rate}%</span>
                        </div>
                        <div className="h-3 rounded-full bg-slate-950/45">
                          <div
                            className="h-3 rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
                            style={{ width: `${Math.round((row.rate / maxProjectRate) * 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-cyan-300/70">
                          {row.completed}/{row.total} tasks completed
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
              <div className="dashboard-glass space-y-4">
                <div>
                  <h2 className="text-xl font-semibold text-cyan-50">Skills Gap Overview</h2>
                  <p className="text-sm text-cyan-200/65">Skills that are most frequently missing across users.</p>
                </div>

                {topMissingSkills.length === 0 ? (
                  <p className="text-sm text-cyan-200/60">No skill-gap data yet.</p>
                ) : (
                  <div className="space-y-3">
                    {topMissingSkills.slice(0, 6).map((item) => {
                      const width = Math.round((item.missingUsers / Math.max(1, item.demand)) * 100);
                      return (
                        <div key={item.skill} className="rounded-xl border border-cyan-500/15 bg-slate-950/35 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-medium text-cyan-50">{item.skill}</span>
                            <span className="text-xs text-cyan-300/70">
                              {item.missingUsers} missing · {item.demand} demanded
                            </span>
                          </div>
                          <div className="mt-2 h-2 rounded-full bg-slate-950/45">
                            <div
                              className="h-2 rounded-full bg-gradient-to-r from-amber-500 to-rose-400"
                              style={{ width: `${width}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="dashboard-glass space-y-4">
                <div>
                  <h2 className="text-xl font-semibold text-cyan-50">Most Common Missing Skills</h2>
                  <p className="text-sm text-cyan-200/65">Backed by the AI analytics summary endpoint.</p>
                </div>

                <div className="space-y-3">
                  {skillDemandTrends.length === 0 ? (
                    <p className="text-sm text-cyan-200/60">No demand trend data yet.</p>
                  ) : (
                    skillDemandTrends.map((item) => {
                      const width = Math.round((item.count / maxDemand) * 100);
                      return (
                        <div key={item.skill} className="space-y-1">
                          <div className="flex items-center justify-between text-sm text-cyan-100/80">
                            <span>{item.skill}</span>
                            <span>{item.count}</span>
                          </div>
                          <div className="h-3 rounded-full bg-slate-950/45">
                            <div
                              className="h-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-400"
                              style={{ width: `${width}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <div className="dashboard-glass space-y-4">
                <div>
                  <h2 className="text-xl font-semibold text-cyan-50">Top Performing Users</h2>
                  <p className="text-sm text-cyan-200/65">AI success-rate ranking by user.</p>
                </div>

                {topPerformers.length === 0 ? (
                  <p className="text-sm text-cyan-200/60">No user ranking data yet.</p>
                ) : (
                  <div className="space-y-3">
                    {topPerformers.map((user, index) => (
                      <div key={user.userId} className="rounded-xl border border-cyan-500/15 bg-slate-950/35 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-medium text-cyan-50">#{index + 1} {user.name}</p>
                            <p className="text-xs text-cyan-300/70">{user.email}</p>
                          </div>
                          <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-1 text-xs text-cyan-200">
                            {user.successRate}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="dashboard-glass space-y-4">
                <div>
                  <h2 className="text-xl font-semibold text-cyan-50">Submission Review Summary</h2>
                  <p className="text-sm text-cyan-200/65">Review progress across the full submission pool.</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-cyan-500/15 bg-slate-950/35 p-4 text-center">
                    <p className="text-xs uppercase tracking-[0.24em] text-cyan-300/70">Reviewed</p>
                    <p className="mt-2 text-3xl font-semibold text-cyan-50">{reviewedSubmissions}</p>
                  </div>
                  <div className="rounded-xl border border-cyan-500/15 bg-slate-950/35 p-4 text-center">
                    <p className="text-xs uppercase tracking-[0.24em] text-cyan-300/70">Pending</p>
                    <p className="mt-2 text-3xl font-semibold text-cyan-50">{pendingSubmissions}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-cyan-500/15 bg-slate-950/35 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-cyan-300/70">Recent quiz attempts</p>
                  <div className="mt-3 space-y-2">
                    {attempts.slice(0, 5).map((attempt) => (
                      <div key={attempt._id} className="flex items-center justify-between gap-3 text-sm text-cyan-100/80">
                        <span>{attempt.quiz?.title || "Quiz"}</span>
                        <span>{attempt.total ? Math.round((attempt.score / attempt.total) * 100) : attempt.score}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
