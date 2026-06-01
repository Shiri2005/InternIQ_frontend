import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { request } from "../services/api";
import Galaxy from "../components/Galaxy";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    inviteCode: "",
  });

  const [loading, setLoading] = useState(false);

  const changeHandler = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submitHandler = async (e) => {
    e.preventDefault();

    if (!form.inviteCode.trim()) {
      alert("Invite code required ⚠️");
      return;
    }

    setLoading(true);

    try {
      await request("/api/users/register", "POST", form);

      alert("Registered successfully ✅");

      navigate("/");
    } catch (err) {
      alert(err.message);
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
        <div className="auth-glass-panel !max-w-md">
          <h2 className="mb-6 text-2xl font-semibold tracking-tight text-cyan-50">
            Register
          </h2>

          <form onSubmit={submitHandler}>
            <input
              name="name"
              placeholder="Name"
              value={form.name}
              onChange={changeHandler}
              className="auth-input"
              required
            />

            <input
              name="email"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={changeHandler}
              className="auth-input"
              required
            />

            <input
              name="password"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={changeHandler}
              className="auth-input"
              required
            />

            <input
              name="inviteCode"
              placeholder="Invite code"
              value={form.inviteCode}
              onChange={changeHandler}
              className="auth-input"
              required
            />

            <button
              type="submit"
              className="auth-btn-primary"
              disabled={loading}
            >
              {loading ? "Registering..." : "Register"}
            </button>
          </form>

          <p className="mt-4 text-sm text-cyan-200/80">
            Already have an account?{" "}
            <button
              type="button"
              className="cursor-pointer font-medium text-cyan-300/90 hover:text-cyan-200"
              onClick={() => navigate("/")}
            >
              Login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
