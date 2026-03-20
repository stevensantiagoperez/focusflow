import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  getTasks,
  getSessions,
  updateTask,
} from "../services/apiClient";
import type { FocusSession } from "../services/apiClient";

type Task = {
  id: number;
  title: string;
  completed: boolean;
  goalMinutes: number;
};

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString();
}

export default function TaskDetailPage() {
  const params = useParams();
  const taskId = Number(params.id);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [goalInput, setGoalInput] = useState("");

  // Load tasks + sessions
  useEffect(() => {
    if (!Number.isFinite(taskId)) {
      setError("Invalid task id");
      setLoading(false);
      return;
    }

    Promise.all([getTasks(), getSessions()])
      .then(([t, s]) => {
        setTasks(t);
        setSessions(s);
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : "Failed to load data";
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [taskId]);
const task = useMemo(() => tasks.find((t) => t.id === taskId), [tasks, taskId]);

useEffect(() => {
  if (task) {
    setGoalInput(String(task.goalMinutes));
  }
}, [task]);

  const taskSessions = useMemo(() => {
    return sessions
      .filter((s) => s.mode === "focus" && s.taskId === taskId)
      .sort((a, b) => new Date(b.endedAt).getTime() - new Date(a.endedAt).getTime());
  }, [sessions, taskId]);

  const totalFocusMinutes = useMemo(() => {
    const seconds = taskSessions.reduce((sum, s) => sum + s.durationSeconds, 0);
    return Math.round((seconds / 60) * 10) / 10;
  }, [taskSessions]);

  async function toggleCompleted() {
    if (!task) return;
    try {
      const updated = await updateTask(task.id, { completed: !task.completed });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to update task";
      setError(msg);
    }
  }

  async function saveGoalMinutes() {
  if (!task) return;

  const parsed = Number(goalInput);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    setError("Goal minutes must be a positive number");
    return;
  }

  try {
    const updated = await updateTask(task.id, { goalMinutes: parsed });
    setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    setError(null);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to save goal";
    setError(msg);
  }
}

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-lg text-slate-200">Loading task…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Task</h1>
        <p className="text-red-300">Error: {error}</p>
        <Link to="/tasks" className="text-violet-300 hover:underline">
          Back to Tasks
        </Link>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Task not found</h1>
        <Link to="/tasks" className="text-violet-300 hover:underline">
          Back to Tasks
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold tracking-tight truncate">
            {task.title}
          </h1>
          <p className="text-slate-400 mt-1">
            Task #{task.id} • {task.completed ? "Completed" : "Open"}
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            to="/tasks"
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 transition-colors"
          >
            Back
          </Link>

          <Link
            to={`/timer?taskId=${task.id}`}
            className="rounded-md bg-violet-600 px-3 py-2 text-sm font-medium hover:bg-violet-500 transition-colors"
          >
            Start timer
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Focus minutes (total)
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-50">
            {totalFocusMinutes}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Sessions
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-50">
            {taskSessions.length}
          </p>
        </div>

        <button
          onClick={toggleCompleted}
          className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-left hover:bg-slate-800 transition-colors"
          type="button"
        >
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Status
          </p>
          <p className="mt-1 text-lg font-semibold">
            {task.completed ? "Mark as Open" : "Mark as Completed"}
          </p>
        </button>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
        <h2 className="text-lg font-semibold mb-3">Session history</h2>

        {taskSessions.length === 0 ? (
          <p className="text-sm text-slate-400">
            No focus sessions recorded for this task yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {taskSessions.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 px-3 py-2"
              >
                <span className="text-sm text-slate-200">{fmtDate(s.endedAt)}</span>
                <span className="text-sm tabular-nums text-slate-100">
                  {Math.round((s.durationSeconds / 60) * 10) / 10} min
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}