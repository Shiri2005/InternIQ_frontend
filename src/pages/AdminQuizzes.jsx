import { useEffect, useState } from "react";
import { request } from "../services/api";
import GalaxyLayout from "../components/GalaxyLayout";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import TopPopup from "../components/TopPopup";

function createQuestion() {
  return {
    question: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
  };
}

export default function AdminQuizzes() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [title, setTitle] = useState("");
  const [sourceType, setSourceType] = useState("manual");
  const [requiredTier, setRequiredTier] = useState("free");
  const [notes, setNotes] = useState("");
  const [assignToAllInterns, setAssignToAllInterns] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [questions, setQuestions] = useState([createQuestion()]);
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState("info");
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    const [userData, quizData] = await Promise.all([
      request("/api/users"),
      request("/api/quizzes"),
    ]);

    setUsers(userData);
    setQuizzes(quizData);
  };

  useEffect(() => {
    loadData().catch((error) => {
      setStatusType("error");
      setStatus(error.message);
    });
  }, []);

  const toggleUser = (userId) => {
    setSelectedUsers((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId]
    );
  };

  const updateQuestion = (index, field, value) => {
    setQuestions((current) =>
      current.map((question, questionIndex) => {
        if (questionIndex !== index) {
          return question;
        }

        return {
          ...question,
          [field]: value,
        };
      })
    );
  };

  const updateOption = (questionIndex, optionIndex, value) => {
    setQuestions((current) =>
      current.map((question, currentIndex) => {
        if (currentIndex !== questionIndex) {
          return question;
        }

        const nextOptions = [...question.options];
        nextOptions[optionIndex] = value;

        return {
          ...question,
          options: nextOptions,
        };
      })
    );
  };

  const addQuestion = () => {
    setQuestions((current) => [...current, createQuestion()]);
  };

  const removeQuestion = (index) => {
    setQuestions((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };

  const resetForm = () => {
    setTitle("");
    setSourceType("manual");
    setRequiredTier("free");
    setNotes("");
    setAssignToAllInterns(false);
    setPdfFile(null);
    setSelectedUsers([]);
    setQuestions([createQuestion()]);
  };

  const submitQuiz = async (event) => {
    event.preventDefault();
    setStatus("");
    setStatusType("info");
    setLoading(true);

    try {
      if (!title.trim()) {
        throw new Error("Quiz title is required");
      }

      if (!assignToAllInterns && selectedUsers.length === 0) {
        throw new Error("Select at least one assigned user");
      }

      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("sourceType", sourceType);
      formData.append("requiredTier", requiredTier);
      formData.append("notes", notes.trim());
      formData.append("assignToAllInterns", String(assignToAllInterns));
      formData.append("assignedUsers", JSON.stringify(selectedUsers));

      if (sourceType === "manual") {
        const normalizedQuestions = questions
          .map((question) => ({
            question: question.question.trim(),
            options: question.options.map((option) => option.trim()),
            correctAnswer: Number(question.correctAnswer),
          }))
          .filter(
            (question) =>
              question.question &&
              question.options.filter(Boolean).length >= 2 &&
              question.options[question.correctAnswer]
          );

        if (normalizedQuestions.length === 0) {
          throw new Error("Add at least one valid manual question");
        }

        formData.append("questions", JSON.stringify(normalizedQuestions));
      } else {
        if (!pdfFile) {
          throw new Error("Choose a PDF file with the questions");
        }

        formData.append("quizPdf", pdfFile);
      }

      await request("/api/quizzes", "POST", formData);
      setStatusType("success");
      setStatus("Quiz created successfully");
      resetForm();
      await loadData();
    } catch (error) {
      setStatusType("error");
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteQuiz = async (quizId) => {
    const confirmed = window.confirm("Delete this quiz and all attempts for it?");
    if (!confirmed) {
      return;
    }

    try {
      setStatus("");
      setStatusType("info");
      await request(`/api/quizzes/${quizId}`, "DELETE");
      setStatusType("success");
      setStatus("Quiz deleted successfully");
      await loadData();
    } catch (error) {
      setStatusType("error");
      setStatus(error.message);
    }
  };

  return (
    <GalaxyLayout>
      <Navbar />
      <TopPopup message={status} type={statusType} onClose={() => setStatus("")} />
      <div className="mx-auto grid max-w-7xl gap-6 p-6 lg:grid-cols-[1.25fr_0.9fr]">
        <div className="dashboard-glass space-y-6 text-left">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/70">Admin Quiz Builder</p>
              <h1 className="mt-2 text-3xl font-semibold text-cyan-50">Create and assign a quiz</h1>
              <p className="mt-2 max-w-2xl text-sm text-cyan-200/70">Build questions manually or upload a PDF. The quiz will only be visible to the users you assign here.</p>
            </div>
            <div className="mt-1">
              <button
                onClick={() => navigate('/admin')}
                className="rounded-md bg-cyan-600/90 px-3 py-1 text-sm font-medium text-white hover:brightness-110"
                type="button"
              >
                Back to Admin Dashboard
              </button>
            </div>
          </div>

          <form onSubmit={submitQuiz} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-cyan-100">
                <span>Quiz title</span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="auth-input mb-0"
                  placeholder="Enter quiz title"
                />
              </label>

              <label className="space-y-2 text-sm text-cyan-100">
                <span>Question source</span>
                <select
                  value={sourceType}
                  onChange={(event) => setSourceType(event.target.value)}
                  className="auth-input mb-0"
                >
                  <option value="manual">Manual entry</option>
                  <option value="pdf">Upload PDF</option>
                </select>
              </label>

              <label className="space-y-2 text-sm text-cyan-100">
                <span>Required tier</span>
                <select
                  value={requiredTier}
                  onChange={(event) => setRequiredTier(event.target.value)}
                  className="auth-input mb-0"
                >
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="premium">Premium</option>
                </select>
              </label>
            </div>

            <label className="block space-y-2 text-sm text-cyan-100">
              <span>Notes / materials</span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="auth-input mb-0 min-h-[96px]"
                placeholder="Optional notes, links, or supporting material"
              />
            </label>

            <div className="dashboard-glass-muted">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-cyan-50">Assign users</h2>
                  <p className="text-xs text-cyan-200/60">Select specific users or assign to all interns.</p>
                </div>
                <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">
                  {selectedUsers.length} selected
                </span>
              </div>

              <label className="mb-4 flex cursor-pointer items-center gap-3 rounded-xl border border-cyan-500/15 bg-slate-950/35 px-3 py-2 text-sm text-cyan-50 transition hover:border-cyan-400/35">
                <input
                  type="checkbox"
                  checked={assignToAllInterns}
                  onChange={(event) => setAssignToAllInterns(event.target.checked)}
                />
                Assign to all interns
              </label>

              {!assignToAllInterns && (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {users.map((user) => (
                    <label
                      key={user._id}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-cyan-500/15 bg-slate-950/35 px-3 py-2 text-sm text-cyan-50 transition hover:border-cyan-400/35"
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user._id)}
                        onChange={() => toggleUser(user._id)}
                      />
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-xs text-cyan-200/60">{user.email}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {sourceType === "manual" ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-cyan-50">Manual questions</h2>
                    <p className="text-xs text-cyan-200/60">Each question needs at least two options and one correct answer.</p>
                  </div>
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="rounded-lg border border-cyan-400/25 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-100 transition hover:bg-cyan-500/20"
                  >
                    Add question
                  </button>
                </div>

                <div className="space-y-4">
                  {questions.map((question, questionIndex) => (
                    <div key={questionIndex} className="rounded-2xl border border-cyan-500/15 bg-slate-950/35 p-4">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold text-cyan-100">Question {questionIndex + 1}</h3>
                        {questions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeQuestion(questionIndex)}
                            className="text-xs text-rose-300 hover:text-rose-200"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <textarea
                        value={question.question}
                        onChange={(event) => updateQuestion(questionIndex, "question", event.target.value)}
                        rows={3}
                        className="auth-input mb-3 min-h-[88px]"
                        placeholder="Type the question"
                      />

                      <div className="grid gap-3 md:grid-cols-2">
                        {question.options.map((option, optionIndex) => (
                          <label key={optionIndex} className="space-y-2 text-sm text-cyan-100">
                            <span>Option {optionIndex + 1}</span>
                            <input
                              value={option}
                              onChange={(event) => updateOption(questionIndex, optionIndex, event.target.value)}
                              className="auth-input mb-0"
                              placeholder={`Option ${optionIndex + 1}`}
                            />
                          </label>
                        ))}
                      </div>

                      <label className="mt-3 block space-y-2 text-sm text-cyan-100">
                        <span>Correct answer</span>
                        <select
                          value={question.correctAnswer}
                          onChange={(event) => updateQuestion(questionIndex, "correctAnswer", Number(event.target.value))}
                          className="auth-input mb-0"
                        >
                          {question.options.map((option, optionIndex) => (
                            <option key={optionIndex} value={optionIndex}>
                              {option || `Option ${optionIndex + 1}`}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-cyan-400/25 bg-slate-950/35 p-5 text-left">
                <h2 className="text-lg font-semibold text-cyan-50">PDF upload</h2>
                <p className="mt-1 text-sm text-cyan-200/65">
                  Upload a PDF where each question is separated by a blank line and uses this pattern:
                </p>
                <pre className="mt-4 overflow-auto rounded-xl bg-slate-950/70 p-4 text-xs leading-6 text-cyan-100">
{`1. What is React?
A. A JavaScript library
B. A database
C. A design tool
D. An operating system
Answer: A`}
                </pre>

                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(event) => setPdfFile(event.target.files?.[0] || null)}
                  className="mt-4 block w-full text-sm text-cyan-100 file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-500/15 file:px-4 file:py-2 file:text-cyan-100 hover:file:bg-cyan-500/25"
                />
                {pdfFile && (
                  <p className="mt-3 text-sm text-cyan-200/80">
                    Selected file: <span className="font-medium text-cyan-50">{pdfFile.name}</span>
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="auth-btn-primary md:w-auto md:px-6"
            >
              {loading ? "Saving quiz..." : "Create quiz"}
            </button>
          </form>
        </div>

        <div className="dashboard-glass space-y-4 text-left">
          <div>
            <h2 className="text-xl font-semibold text-cyan-50">Existing quizzes</h2>
            <p className="mt-1 text-sm text-cyan-200/65">Quick view of currently created quizzes and their assignments.</p>
          </div>

          <div className="space-y-3">
            {quizzes.length === 0 ? (
              <p className="text-sm text-cyan-200/60">No quizzes have been created yet.</p>
            ) : (
              quizzes.map((quiz) => (
                <div key={quiz._id} className="dashboard-glass-muted space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-cyan-50">{quiz.title}</h3>
                      <p className="text-xs text-cyan-200/60">
                        {quiz.sourceType === "pdf" ? `PDF: ${quiz.sourceFileName || "uploaded file"}` : "Manual questions"}
                      </p>
                      <p className="text-xs text-cyan-300/70">
                        Required tier: {quiz.requiredTier || "free"}
                      </p>
                      {quiz.assignToAllInterns && (
                        <p className="text-xs text-emerald-300/80">Assigned to all interns</p>
                      )}
                      {quiz.notes && (
                        <p className="text-xs text-cyan-200/70">{quiz.notes}</p>
                      )}
                    </div>
                    <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-1 text-xs text-cyan-200">
                      {quiz.questions?.length || 0} questions
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-cyan-200/70">
                    <div>
                      Assigned to:{" "}
                      {Array.isArray(quiz.assignedUsers) && quiz.assignedUsers.length > 0
                        ? quiz.assignedUsers.map((user) => user.name).join(", ")
                        : "No users"}
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteQuiz(quiz._id)}
                      className="rounded-lg border border-rose-400/25 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-100 transition hover:bg-rose-500/20"
                    >
                      Delete quiz
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </GalaxyLayout>
  );
}
