import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  getTasks,
  createTask,
  deleteTask,
  updateTask,
  getSessions,
} from "../services/apiClient";
import type { FocusSession } from "../services/apiClient";

type Task = {
  id: number;
  title: string;
  completed: boolean;
  goalMinutes: number;
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [prevGoalReachedMap, setPrevGoalReachedMap] = useState<Record<number, boolean>>({});
  const [filter, setFilter] = useState<"all" | "active" | "completed" | "goalReached">("all");
  const [sortBy, setSortBy] = useState<"newest" | "mostProgress">("newest");

  // Load tasks on mount
  useEffect(() => {
  Promise.all([getTasks(), getSessions()])
    .then(([taskData, sessionData]) => {
      setTasks(taskData);
      setSessions(sessionData);
    })
    .catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to load tasks";
      setError(msg);
    })
    .finally(() => setLoading(false));
}, []);

  async function handleAddTask(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const title = newTitle.trim();
    if (!title) return;

    try {
      const created = await createTask(title);
      setTasks((prev) => [...prev, created]);
      setNewTitle("");
    } catch (err: any) {
      console.error("createTask error:", err);
      setError(err?.message || "Failed to add task");
    }
  }

  async function handleDelete(id: number) {
    setError(null);
    try {
      await deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err: any) {
      console.error("deleteTask error:", err);
      setError(err?.message || "Failed to delete task");
    }
  }

  async function handleToggle(task: Task) {
    setError(null);
    try {
      const updated = await updateTask(task.id, { completed: !task.completed });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    } catch (err: any) {
      console.error("updateTask error:", err);
      setError(err?.message || "Failed to update task");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-lg text-slate-200">Loading tasks...</p>
      </div>
    );
  }

  const totalTasks = tasks.length;
  const completedCount = tasks.filter((t) => t.completed).length;

  const focusMinutesByTask = useMemo(() => {
  const map = new Map<number, number>();

  for (const s of sessions) {
    if (s.mode !== "focus") continue;
    if (s.taskId == null) continue;

    const mins = s.durationSeconds / 60;
    map.set(s.taskId, (map.get(s.taskId) ?? 0) + mins);
  }

  return map;
}, [sessions]);

useEffect(() => {
  const nextMap: Record<number, boolean> = {};

  for (const task of tasks) {
    const minutes = focusMinutesByTask.get(task.id) ?? 0;
    const isGoalReached = task.goalMinutes > 0 && minutes >= task.goalMinutes;
    nextMap[task.id] = isGoalReached;

    const wasGoalReached = prevGoalReachedMap[task.id] ?? false;

    if (!wasGoalReached && isGoalReached) {
      setToastMessage(`🎉 Goal reached for "${task.title}"`);
    }
  }

  setPrevGoalReachedMap(nextMap);
}, [tasks, focusMinutesByTask, prevGoalReachedMap]);

useEffect(() => {
  if (!toastMessage) return;

  const timeout = window.setTimeout(() => {
    setToastMessage(null);
  }, 3000);

  return () => window.clearTimeout(timeout);
}, [toastMessage]);

const visibleTasks = useMemo(() => {
  return [...tasks]
    .filter((task) => {
      const minutes = focusMinutesByTask.get(task.id) ?? 0;
      const isGoalReached = task.goalMinutes > 0 && minutes >= task.goalMinutes;

      if (filter === "active") return !task.completed;
      if (filter === "completed") return task.completed;
      if (filter === "goalReached") return isGoalReached;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "mostProgress") {
        const aMinutes = focusMinutesByTask.get(a.id) ?? 0;
        const bMinutes = focusMinutesByTask.get(b.id) ?? 0;

        const aProgress = a.goalMinutes > 0 ? aMinutes / a.goalMinutes : 0;
        const bProgress = b.goalMinutes > 0 ? bMinutes / b.goalMinutes : 0;

        return bProgress - aProgress;
      }

      return b.id - a.id;
    });
}, [tasks, filter, sortBy, focusMinutesByTask]);

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-semibold tracking-tight">Tasks</h1>

      {/* Stats card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-slate-400">Total</p>
          <p className="mt-1 text-2xl font-semibold text-slate-50">{totalTasks}</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-slate-400">Completed</p>
          <p className="mt-1 text-2xl font-semibold text-slate-50">{completedCount}</p>
        </div>

        <div className="rounded-xl border border-dashed border-slate-800/60 bg-slate-900/30 px-4 py-3 text-sm text-slate-500 flex items-center justify-center">
          Future: focus minutes
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-950/40 border border-red-700 rounded-md px-3 py-2">
          Error: {error}
        </p>
      )}

      {toastMessage && (
  <div className="fixed top-20 right-4 z-50 rounded-lg border border-emerald-700/60 bg-emerald-950/90 px-4 py-3 text-sm text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.25)] backdrop-blur">
    {toastMessage}
  </div>
)}

      <form onSubmit={handleAddTask} className="mt-2 mb-4 flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          placeholder="New task title"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="flex-1 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
        />
        <button
          type="submit"
          className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium hover:bg-violet-500 transition-colors disabled:opacity-50"
          disabled={!newTitle.trim()}
        >
          Add Task
        </button>
      </form>
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
  <div className="flex flex-wrap gap-2">
    {(["all", "active", "completed", "goalReached"] as const).map((value) => (
      <button
        key={value}
        type="button"
        onClick={() => setFilter(value)}
        className={`rounded-md px-3 py-1.5 text-sm border transition-colors ${
          filter === value
            ? "border-violet-500 bg-violet-600/20 text-slate-100"
            : "border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-100"
        }`}
      >
        {value === "goalReached" ? "Goal reached" : value[0].toUpperCase() + value.slice(1)}
      </button>
    ))}
  </div>

  <select
    value={sortBy}
    onChange={(e) => setSortBy(e.target.value as "newest" | "mostProgress")}
    className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
  >
    <option value="newest">Newest first</option>
    <option value="mostProgress">Most progress</option>
  </select>
</div>
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl shadow-lg p-3">
        {visibleTasks.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">
            No tasks yet. Add your first one to get started.
          </p>
        ) : (
          <ul className="space-y-2">
            {tasks.map((task) => {
              const minutes = focusMinutesByTask.get(task.id) ?? 0;
              const isGoalReached = task.goalMinutes > 0 && minutes >= task.goalMinutes;
              return (
              <li
  key={task.id}
  className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-3 transition-all
    ${
      isGoalReached
        ? "border-emerald-600/60 bg-emerald-950/20 shadow-[0_0_10px_rgba(16,185,129,0.25)]"
        : "border-slate-800 bg-slate-900"
    }
  `}
>
                <div className="flex items-center gap-3 flex-1 min-w-0">
  <input
    type="checkbox"
    checked={!!task.completed}
    onChange={() => handleToggle(task)}
    className="h-4 w-4 appearance-auto accent-violet-500"
  />

  <div className="flex flex-col min-w-0 flex-1">
   <div className="flex items-center gap-2 min-w-0">
  <Link
    to={`/tasks/${task.id}`}
    className={`text-sm hover:underline truncate ${
      task.completed ? "line-through text-slate-500" : ""
    }`}
  >
    {task.title}
  </Link>

  {(focusMinutesByTask.get(task.id) ?? 0) >= task.goalMinutes && (
    <span className="shrink-0 rounded-full border border-emerald-700/60 bg-emerald-950/30 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-300">
      Goal reached
    </span>
  )}
</div>

    <div className="mt-1 flex items-center justify-between gap-2">
      <span className="text-xs text-slate-500">
        {Math.round((focusMinutesByTask.get(task.id) ?? 0) * 10) / 10} / {task.goalMinutes} min
      </span>

      <span className="text-xs text-slate-500">
        {task.goalMinutes > 0
          ? Math.min(
              100,
              Math.round(
                (((focusMinutesByTask.get(task.id) ?? 0) / task.goalMinutes) * 100)
              )
            )
          : 0}
        %
      </span>
    </div>

    <div className="mt-1 h-2 w-full rounded-full bg-slate-800 overflow-hidden">
      <div
        className={`h-full rounded-full ${
          task.completed ? "bg-emerald-500" : "bg-violet-500"
        }`}
        style={{
          width: `${
            task.goalMinutes > 0
              ? Math.min(
                  100,
                  ((focusMinutesByTask.get(task.id) ?? 0) / task.goalMinutes) * 100
                )
              : 0
          }%`,
        }}
      />
    </div>
  </div>
</div>

                {/* RIGHT SIDE = delete */}
                <button
                  onClick={() => handleDelete(task.id)}
                  className="text-xs text-red-300 hover:text-red-200 hover:underline"
                >
                  Delete
                </button>
              </li>
)})}
          </ul>
        )}
      </div>
    </div>
  );
}
