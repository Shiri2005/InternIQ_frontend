import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { request } from "../services/api";
import GalaxyLayout from "../components/GalaxyLayout";
import Navbar from "../components/Navbar";
import TopPopup from "../components/TopPopup";

export default function QuizPage() {
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    async function fetchQuiz() {
      try {
        const data = await request(`/api/quizzes/${id}`);
        setQuiz(data);
        setAnswers(new Array(data.questions.length).fill(null));
      } catch (err) {
        setLoadError(err.message);
      }
    }
    fetchQuiz();
  }, [id]);

  function handleOptionSelect(qIndex, optionIndex) {
    const updated = [...answers];
    updated[qIndex] = optionIndex;
    setAnswers(updated);
  }

  async function handleSubmit() {
    try {
      setSubmitError("");
      const res = await request(`/api/quizzes/${id}/submit`, "POST", {
        answers
      });
      setResult(res);
      setSuccessMessage("Quiz submitted successfully");
    } catch (err) {
      setSubmitError(err.message);
    }
  }

  if (!quiz && !loadError) {
    return (
      <GalaxyLayout>
        <Navbar />
        <div className="mx-auto max-w-4xl p-6 text-left">
          <p className="text-cyan-100">Loading...</p>
        </div>
      </GalaxyLayout>
    );
  }

  if (result) {
    return (
      <GalaxyLayout>
        <Navbar />
        <TopPopup message={successMessage} type="success" onClose={() => setSuccessMessage("")} />

        <div className="mx-auto max-w-4xl p-6 text-left">
          <div className="dashboard-glass">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/70">Completed</p>
            <h2 className="mt-2 text-3xl font-semibold text-cyan-50">Result</h2>
            <p className="mt-3 text-lg text-cyan-100">
              Score: {result.score} / {result.total}
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to="/quiz"
                className="inline-flex rounded-lg bg-gradient-to-r from-cyan-600 to-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:brightness-110"
              >
                Back to Quizzes
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex rounded-lg border border-cyan-400/25 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/20"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </GalaxyLayout>
    );
  }

  return (
    <GalaxyLayout>
      <Navbar />
      <TopPopup message={loadError || submitError} type="error" onClose={() => {
        setLoadError("");
        setSubmitError("");
      }} />

      <div className="mx-auto max-w-4xl p-6 text-left">
        <div className="dashboard-glass mb-6">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/70">Quiz</p>
          <h2 className="mt-2 text-3xl font-semibold text-cyan-50">{quiz?.title || "Quiz"}</h2>
          <p className="mt-2 text-sm text-cyan-200/65">
            Answer each question once. Your submission will be rejected if the quiz was not assigned to you.
          </p>
          {quiz?.requiredTier && (
            <p className="mt-2 text-xs uppercase tracking-[0.2em] text-cyan-300/70">
              Required tier: {quiz.requiredTier}
            </p>
          )}
          {quiz?.assignToAllInterns && (
            <p className="mt-2 text-xs uppercase tracking-[0.2em] text-emerald-300/80">
              Assigned to all interns
            </p>
          )}
          {quiz?.notes && (
            <p className="mt-3 rounded-xl border border-cyan-500/15 bg-slate-950/35 p-3 text-sm text-cyan-100/80">
              {quiz.notes}
            </p>
          )}
        </div>

        <div className="space-y-4">
          {quiz?.questions?.map((q, qIndex) => (
            <div key={qIndex} className="dashboard-glass space-y-4">
              <p className="text-lg font-medium text-cyan-50">
                {qIndex + 1}. {q.question}
              </p>

              <div className="grid gap-3 md:grid-cols-2">
                {q.options.map((opt, optIndex) => (
                  <label
                    key={optIndex}
                    className={`cursor-pointer rounded-xl border px-4 py-3 transition ${
                      answers[qIndex] === optIndex
                        ? "border-cyan-400/50 bg-cyan-500/15 text-cyan-50"
                        : "border-cyan-500/15 bg-slate-950/35 text-cyan-100 hover:border-cyan-400/30"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${qIndex}`}
                      value={optIndex}
                      checked={answers[qIndex] === optIndex}
                      onChange={() => handleOptionSelect(qIndex, optIndex)}
                      className="mr-3 accent-cyan-400"
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          className="auth-btn-primary mt-6 md:w-auto md:px-6"
          type="button"
        >
          Submit Quiz
        </button>
      </div>
    </GalaxyLayout>
  );
}