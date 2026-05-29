import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isAdmin = user?.role === "admin";

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="sticky top-0 z-40 flex justify-between border-b border-cyan-500/20 bg-slate-950/70 px-4 py-3 text-cyan-50 backdrop-blur-md">
      <div className="flex gap-6">
        {isAdmin ? (
          <>
            <Link to="/admin" className="text-cyan-100/95 transition hover:text-cyan-300">
              Admin Dashboard
            </Link>
            <Link to="/admin/quizzes" className="text-cyan-100/95 transition hover:text-cyan-300">
              Create Quiz
            </Link>
            <Link to="/admin/submissions" className="text-cyan-100/95 transition hover:text-cyan-300">
              View Attempts
            </Link>
            <Link to="/admin/analytics" className="text-cyan-100/95 transition hover:text-cyan-300">
              Analytics
            </Link>
            <Link to="/study-materials" className="text-cyan-100/95 transition hover:text-cyan-300">
              Study Materials
            </Link>
          </>
        ) : (
          <>
            <Link to="/dashboard" className="text-cyan-100/95 transition hover:text-cyan-300">
              My Dashboard
            </Link>
            <Link to="/quiz" className="text-cyan-100/95 transition hover:text-cyan-300">
              My Quizzes
            </Link>
            <Link to="/study-materials" className="text-cyan-100/95 transition hover:text-cyan-300">
              Study Materials
            </Link>
          </>
        )}
      </div>

      <button
        onClick={logout}
        className="rounded-lg bg-rose-600/90 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-rose-500"
        type="button"
      >
        Logout
      </button>
    </div>
  );
}

export default Navbar;
