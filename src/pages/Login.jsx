import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { request } from "../services/api";
import Galaxy from "../components/Galaxy";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Always open from login with a fresh session when app is launched at root.
  useEffect(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }, []);

  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await request("/users/login", "POST", {
        email,
        password,
      });

      // Save token
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      alert("Login successful ✅");

      navigate("/dashboard");
    } catch (error) {
      alert(error.message || "Login failed ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-950">
      <div className="galaxy-backdrop-layer absolute inset-0 z-0 min-h-0">
        <Galaxy
          mouseRepulsion
          mouseInteraction
          density={1}
          glowIntensity={0.3}
          saturation={0}
          hueShift={140}
          twinkleIntensity={0.3}
          rotationSpeed={0.1}
          repulsionStrength={2}
          autoCenterRepulsion={0}
          starSpeed={0.5}
          speed={1}
          transparent={false}
          className="h-full w-full min-h-0"
        />
      </div>
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className="auth-glass-panel">
          <h2 className="mb-6 text-2xl font-semibold tracking-tight text-cyan-50">
            Login
          </h2>

          <form onSubmit={submitHandler}>
            <input
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="auth-input"
            />

            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="auth-input"
            />

            <button type="submit" className="auth-btn-primary" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
            <p
              className="mt-4 cursor-pointer text-sm text-cyan-300/90 transition hover:text-cyan-200"
              onClick={() => navigate("/register")}
            >
              Don&apos;t have account? Register
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
