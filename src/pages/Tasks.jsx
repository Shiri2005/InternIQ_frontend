import { useEffect, useState } from "react";
import { request } from "../services/api";
import Navbar from "../components/Navbar";
import GalaxyLayout from "../components/GalaxyLayout";

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");

  const fetchTasks = async () => {
    try {
      const data = await request("/tasks");
      setTasks(data);
    } catch (err) {
      alert(err.message);
    }
  };

  const createTask = async () => {
    if (!title.trim()) {
      alert("Task cannot be empty");
      return;
    }
    try {
      await request("/tasks", "POST", { title });
      setTitle("");
      fetchTasks();
    } catch (err) {
      alert(err.message);
    }
  };

  const markDone = async (id) => {
    try {
      await request(`/tasks/${id}`, "PUT", { status: "completed" });
      fetchTasks();
    } catch (err) {
      alert(err.message);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const inputClass =
    "flex-1 rounded-lg border border-cyan-500/25 bg-slate-950/40 p-2.5 text-cyan-50 placeholder:text-slate-500 outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30";

  return (
    <GalaxyLayout>
      <Navbar />

      <div className="mx-auto max-w-3xl space-y-6 p-6">
        <div className="dashboard-glass">
          <h2 className="text-xl font-semibold text-cyan-50">Tasks</h2>
          <p className="mt-1 text-sm text-cyan-200/65">
            Quick list for admins — mark items done when finished.
          </p>
        </div>

        <div className="dashboard-glass flex flex-col gap-3 sm:flex-row">
          <input
            className={inputClass}
            placeholder="Enter task title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <button
            onClick={createTask}
            className="shrink-0 rounded-lg bg-emerald-600 px-5 py-2.5 font-medium text-white shadow-md transition hover:bg-emerald-500"
            type="button"
          >
            Add
          </button>
        </div>

        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task._id}
              className="dashboard-glass-muted flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center"
            >
              <div>
                <p className="font-semibold text-cyan-50">{task.title}</p>
                <p className="text-sm text-cyan-200/65">{task.status}</p>
              </div>

              <button
                onClick={() => markDone(task._id)}
                disabled={task.status === "completed"}
                className="shrink-0 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-45"
                type="button"
              >
                Done
              </button>
            </div>
          ))}
        </div>
      </div>
    </GalaxyLayout>
  );
}
