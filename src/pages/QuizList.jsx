import { useEffect, useState } from "react";
import { request } from "../services/api";
import { Link, useNavigate } from "react-router-dom";
import GalaxyLayout from "../components/GalaxyLayout";
import Navbar from "../components/Navbar";
import TopPopup from "../components/TopPopup";

export default function QuizList() {
  const [quizzes, setQuizzes] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchQuizzes() {
      try {
        const data = await request("/quizzes/user");
        setQuizzes(data);
      } catch (err) {
        setError(err.message);
      }
    }
    fetchQuizzes();
  }, []);

  return (
    <GalaxyLayout>
      <Navbar />
      <TopPopup message={error} type="error" onClose={() => setError("")} />

      <div className="mx-auto min-h-screen max-w-5xl p-6 text-left">
        <div className="dashboard-glass mb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl space-y-2">
              <span className="inline-flex w-fit rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-200">
                Assigned quizzes
              </span>
              <h2 className="text-3xl font-semibold text-cyan-50 md:text-4xl">
                Your quiz workspace
              </h2>
              
            </div>

            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="inline-flex items-center justify-center rounded-lg border border-cyan-400/25 bg-slate-950/30 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:border-cyan-300/45 hover:text-cyan-50"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {quizzes.length === 0 ? (
            <div className="dashboard-glass md:col-span-2">
              <p className="text-cyan-200/70">No quizzes have been assigned yet.</p>
            </div>
          ) : (
            quizzes.map((quiz) => (
              <div key={quiz._id} className="dashboard-glass space-y-3 text-left">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold text-cyan-50">{quiz.title}</h3>
                    <p className="text-sm text-cyan-200/60">
                      {quiz.sourceType === "pdf" ? "Uploaded PDF quiz" : "Manually created quiz"}
                    </p>
                    <p className="text-xs text-cyan-300/70">
                      Required tier: {quiz.requiredTier || "free"}
                    </p>
                    {quiz.assignToAllInterns && (
                      <p className="text-xs text-emerald-300/80">Assigned to all interns</p>
                    )}
                    {quiz.notes && (
                      <p className="mt-2 text-sm text-cyan-100/80">{quiz.notes}</p>
                    )}
                  </div>
                  <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">
                    Ready
                  </span>
                </div>

                <Link
                  to={`/quiz/${quiz._id}`}
                  className="inline-flex rounded-lg bg-gradient-to-r from-cyan-600 to-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:brightness-110"
                >
                  Start quiz
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </GalaxyLayout>
  );
}