import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { request, studyMaterialOpenUrl } from "../services/api";
import GalaxyLayout from "../components/GalaxyLayout";
import Navbar from "../components/Navbar";
import TopPopup from "../components/TopPopup";

export default function StudyMaterials() {
  const localUser = JSON.parse(localStorage.getItem("user") || "null") || {};
  const navigate = useNavigate();
  const isAdmin = localUser?.role === "admin";

  const [users, setUsers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [requiredTier, setRequiredTier] = useState("free");
  const [assignToAllInterns, setAssignToAllInterns] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [pdfFile, setPdfFile] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    const requestList = [request("/study-materials")];
    if (isAdmin) {
      requestList.unshift(request("/users"));
    }

    const results = await Promise.all(requestList);
    if (isAdmin) {
      setUsers(results[0]);
      setMaterials(results[1]);
    } else {
      setMaterials(results[0]);
    }
  };

  useEffect(() => {
    loadData().catch((error) => {
      setMessageType("error");
      setMessage(error.message);
    });
  }, []);

  const toggleUser = (userId) => {
    setSelectedUsers((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId]
    );
  };

  const resetForm = () => {
    setTitle("");
    setNotes("");
    setRequiredTier("free");
    setAssignToAllInterns(false);
    setSelectedUsers([]);
    setPdfFile(null);
  };

  const submitMaterial = async (event) => {
    event.preventDefault();
    if (!isAdmin) return;

    try {
      setLoading(true);
      setMessage("");

      if (!title.trim()) {
        throw new Error("Study material title is required");
      }

      if (!pdfFile) {
        throw new Error("Please select a PDF file");
      }

      if (!assignToAllInterns && selectedUsers.length === 0) {
        throw new Error("Select at least one assigned user");
      }

      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("notes", notes.trim());
      formData.append("requiredTier", requiredTier);
      formData.append("assignToAllInterns", String(assignToAllInterns));
      formData.append("assignedUsers", JSON.stringify(selectedUsers));
      formData.append("studyPdf", pdfFile);

      await request("/study-materials", "POST", formData);
      setMessageType("success");
      setMessage("Study material uploaded successfully");
      resetForm();
      await loadData();
    } catch (error) {
      setMessageType("error");
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteMaterial = async (id) => {
    try {
      await request(`/study-materials/${id}`, "DELETE");
      setMessageType("success");
      setMessage("Study material deleted");
      await loadData();
    } catch (error) {
      setMessageType("error");
      setMessage(error.message);
    }
  };

  return (
    <GalaxyLayout>
      <Navbar />
      <TopPopup message={message} type={messageType} onClose={() => setMessage("")} />

      <div className="mx-auto max-w-6xl space-y-6 p-6 text-left">
        <div className="dashboard-glass">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/70">Study materials</p>
              <h1 className="mt-2 text-3xl font-semibold text-cyan-50">{isAdmin ? "Upload study PDFs" : "Your assigned study PDFs"}</h1>
            </div>
            <div>
              <button
                onClick={() => navigate('/dashboard')}
                className="rounded-md bg-cyan-600/90 px-3 py-1 text-sm font-medium text-white hover:brightness-110"
                type="button"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>

        {isAdmin && (
          <form onSubmit={submitMaterial} className="dashboard-glass space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-cyan-100">
                <span>Title</span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="auth-input mb-0"
                  placeholder="Enter material title"
                />
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
              <span>Notes / description</span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="auth-input mb-0 min-h-[96px]"
                placeholder="Optional notes or summary"
              />
            </label>

            <div className="dashboard-glass-muted">
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

            <div className="rounded-2xl border border-dashed border-cyan-400/25 bg-slate-950/35 p-5">
              <h2 className="text-lg font-semibold text-cyan-50">Upload PDF</h2>
              <p className="mt-1 text-sm text-cyan-200/65">
                Upload study notes or material as PDF. Assigned users can view it only.
              </p>
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

            <button type="submit" disabled={loading} className="auth-btn-primary md:w-auto md:px-6">
              {loading ? "Uploading..." : "Upload study material"}
            </button>
          </form>
        )}

        <div className="dashboard-glass space-y-4">
          <h2 className="text-xl font-semibold text-cyan-50">Materials</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {materials.length === 0 ? (
              <div className="dashboard-glass-muted md:col-span-2">
                <p className="text-cyan-200/70">No study materials available.</p>
              </div>
            ) : (
              materials.map((material) => (
                <div key={material._id} className="dashboard-glass-muted space-y-3">
                  <div>
                    <h3 className="text-lg font-semibold text-cyan-50">{material.title}</h3>
                    {material.notes && <p className="mt-1 text-sm text-cyan-200/75">{material.notes}</p>}
                    <p className="mt-2 text-xs text-cyan-300/70">Required tier: {material.requiredTier || "free"}</p>
                    {material.assignToAllInterns && (
                      <p className="text-xs text-emerald-300/80">Assigned to all interns</p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <a
                      href={studyMaterialOpenUrl(material.fileUrl, material.updatedAt)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex rounded-lg bg-gradient-to-r from-cyan-600 to-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:brightness-110"
                    >
                      View PDF
                    </a>

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => deleteMaterial(material._id)}
                        className="inline-flex rounded-lg border border-rose-400/25 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-100 transition hover:bg-rose-500/20"
                      >
                        Delete
                      </button>
                    )}
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
