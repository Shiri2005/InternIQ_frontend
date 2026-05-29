import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { request, certificateOpenUrl } from "../services/api";
import Navbar from "../components/Navbar";
import GalaxyLayout from "../components/GalaxyLayout";

export default function AdminSubmissions() {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const [reviewData, setReviewData] = useState({
    score: "",
    feedback: "",
  });

  const fetchSubmissions = async () => {
    try {
      const data = await request("/submissions");
      setSubmissions(data);
    } catch (err) {
      console.log(err.message);
    }
  };

  const handleReview = async () => {
    try {
      if (!reviewData.score || !reviewData.feedback) {
        alert("Enter score and feedback");
        return;
      }
      await request(`/submissions/${selectedId}/review`, "PUT", {
        score: Number(reviewData.score),
        feedback: reviewData.feedback,
      });

      alert("Reviewed ✅");

      setReviewData({ score: "", feedback: "" });
      setSelectedId(null);

      fetchSubmissions();
    } catch (err) {
      alert(err.message);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  return (
    <GalaxyLayout>
      <Navbar />

      <div className="mx-auto max-w-4xl space-y-6 p-6 pb-28">
        <div className="dashboard-glass">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-cyan-50">Admin Submissions 📋</h1>
            <button
              onClick={() => navigate('/admin')}
              className="rounded-md bg-cyan-600/90 px-3 py-1 text-sm font-medium text-white hover:brightness-110"
              type="button"
            >
              Back to Admin Dashboard
            </button>
          </div>
        </div>

        {submissions.length === 0 ? (
          <div className="dashboard-glass text-cyan-200/70">No submissions yet.</div>
        ) : (
          <div className="space-y-4">
            {submissions.map((sub) => (
              <div
                key={sub._id}
                className={`dashboard-glass-muted transition ${
                  selectedId === sub._id
                    ? "border-cyan-400/50 ring-1 ring-cyan-400/30"
                    : ""
                }`}
              >
                <p className="text-cyan-100">
                  <span className="text-cyan-400/90">Project:</span>{" "}
                  {sub.project?.title || "N/A"}
                </p>
                <p className="mt-1 text-cyan-100">
                  <span className="text-cyan-400/90">User:</span>{" "}
                  {sub.user?.name || "N/A"}
                </p>
                <p className="mt-1 text-cyan-100">
                  <span className="text-cyan-400/90">Task:</span>{" "}
                  {sub.task?.title || "N/A"}
                </p>

                <p className="mt-3 text-sm leading-relaxed text-cyan-100/90">
                  <span className="font-medium text-cyan-300/90">Description:</span>{" "}
                  {sub.description}
                </p>

                <a
                  href={sub.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-block text-sm font-medium text-cyan-300 underline decoration-cyan-500/50 underline-offset-2 hover:text-cyan-200"
                >
                  View submitted file →
                </a>

                <p className="mt-3 text-sm text-cyan-200/80">
                  <span className="text-cyan-400/90">Status:</span> {sub.status}
                </p>

                {sub.status === "pending" && (
                  <button
                    onClick={() => {
                      setSelectedId(sub._id);
                      setReviewData({
                        score: "",
                        feedback: "",
                      });
                    }}
                    className="mt-4 rounded-lg bg-gradient-to-r from-cyan-600 to-teal-600 px-4 py-2 text-sm font-medium text-white shadow-md transition hover:brightness-110"
                    type="button"
                  >
                    Review
                  </button>
                )}

                {sub.status === "reviewed" && (
                  <div className="mt-4 rounded-xl border border-cyan-500/20 bg-slate-950/35 p-4">
                    <p className="text-cyan-100">
                      <span className="text-cyan-400/90">Score:</span> {sub.score}
                    </p>
                    <p className="mt-2 text-sm text-cyan-100/90">
                      <span className="text-cyan-400/90">Feedback:</span>{" "}
                      {sub.feedback}
                    </p>

                    {sub.isCertified && sub.certificateUrl && (
                      <a
                        href={certificateOpenUrl(
                          sub.certificateUrl,
                          sub.updatedAt
                        )}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex items-center rounded-lg bg-emerald-600/90 px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-emerald-500"
                      >
                        Generate certificate
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {selectedId && (
          <div className="fixed bottom-5 right-5 z-30 w-[min(100%-2rem,22rem)] rounded-2xl border border-cyan-500/25 bg-slate-950/90 p-5 shadow-2xl backdrop-blur-xl">
            <h3 className="mb-3 font-semibold text-cyan-50">Review submission</h3>

            <input
              type="number"
              placeholder="Score"
              value={reviewData.score}
              onChange={(e) =>
                setReviewData({
                  ...reviewData,
                  score: e.target.value,
                })
              }
              className="auth-input mb-3 text-left"
            />

            <textarea
              placeholder="Feedback"
              value={reviewData.feedback}
              onChange={(e) =>
                setReviewData({
                  ...reviewData,
                  feedback: e.target.value,
                })
              }
              rows={4}
              className="auth-input mb-3 resize-y"
            />

            <button
              onClick={handleReview}
              className="auth-btn-primary"
              type="button"
            >
              Submit review
            </button>

            <button
              onClick={() => setSelectedId(null)}
              className="mt-3 w-full text-center text-sm text-slate-400 transition hover:text-cyan-200"
              type="button"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </GalaxyLayout>
  );
}
