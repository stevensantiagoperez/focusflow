import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getTasks } from "../services/apiClient";
import { clearSessions, loadSessions } from "../utils/sessions";

type Task = {
  id: number;
  title: string;
  completed: boolean;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function dayKey(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}


export default function DashboardPage() {

    const [sessionRefresh, setSessionRefresh] = useState(0);

const focusSessions = useMemo(() => {
  const all = loadSessions();
  return all.filter((s) => s.mode === "focus");
}, [sessionRefresh]);

const todayKey = dayKey(new Date());

const minutesToday = useMemo(() => {
  return Math.round(
    focusSessions
      .filter((s) => dayKey(new Date(s.endedAt)) === todayKey)
      .reduce((sum, s) => sum + s.durationSeconds, 0) / 60
  );
}, [focusSessions, todayKey]);

const sessionsToday = useMemo(() => {
  return focusSessions.filter((s) => dayKey(new Date(s.endedAt)) === todayKey).length;
}, [focusSessions, todayKey]);

const streakDays = useMemo(() => {
  // streak = consecutive days (including today) with at least 1 focus session
  const byDay = new Map<string, number>();
  for (const s of focusSessions) {
    const k = dayKey(new Date(s.endedAt));
    byDay.set(k, (byDay.get(k) ?? 0) + 1);
  }

  let streak = 0;
  const d = new Date();
  while (true) {
    const k = dayKey(d);
    if ((byDay.get(k) ?? 0) > 0) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}, [focusSessions]);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTasks()
      .then((data) => setTasks(data))
      .catch((err) => setError(err.message || "Failed to load tasks"))
      .finally(() => setLoading(false));
  }, []);

  const totalTasks = tasks.length;
  const completedCount = useMemo(
    () => tasks.filter((t) => t.completed).length,
    [tasks]
  );
  const incompleteCount = totalTasks - completedCount;

  const recentTasks = useMemo(() => {
    // If you later add createdAt, we’ll sort properly.
    // For now, show the last 5 tasks in the array.
    return tasks.slice(-5).reverse();
  }, [tasks]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-lg text-slate-200">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-slate-400 mt-1">
            Quick snapshot of your tasks (focus stats coming next).
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            to="/tasks"
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 transition-colors"
          >
            Go to Tasks
          </Link>
          <Link
            to="/timer"
            className="rounded-md bg-violet-600 px-3 py-2 text-sm font-medium hover:bg-violet-500 transition-colors"
          >
            Start Timer
          </Link>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-950/40 border border-red-700 rounded-md px-3 py-2">
          Error: {error}
        </p>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
  <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3">
    <p className="text-xs uppercase tracking-wide text-slate-400">Focus minutes (today)</p>
    <p className="mt-1 text-2xl font-semibold text-slate-50">{minutesToday}</p>
  </div>

  <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3">
    <p className="text-xs uppercase tracking-wide text-slate-400">Focus sessions (today)</p>
    <p className="mt-1 text-2xl font-semibold text-slate-50">{sessionsToday}</p>
  </div>

  <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3">
    <p className="text-xs uppercase tracking-wide text-slate-400">Streak (days)</p>
    <p className="mt-1 text-2xl font-semibold text-slate-50">{streakDays}</p>
  </div>
</div>


      {/* Recent tasks */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Recent tasks</h2>
          <Link to="/tasks" className="text-sm text-violet-300 hover:underline">
            View all
          </Link>
        </div>

        {recentTasks.length === 0 ? (
          <p className="text-sm text-slate-400">
            No tasks yet — add one on the Tasks page.
          </p>
        ) : (
          <ul className="space-y-2">
            {recentTasks.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 px-3 py-2"
              >
                <span
                  className={`text-sm ${
                    t.completed ? "line-through text-slate-500" : ""
                  }`}
                >
                  {t.title}
                </span>
                <span
                  className={`text-xs px-2 py-1 rounded-md border ${
                    t.completed
                      ? "border-emerald-700/60 text-emerald-300 bg-emerald-950/30"
                      : "border-slate-700 text-slate-300 bg-slate-950/30"
                  }`}
                >
                  {t.completed ? "Done" : "Open"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Coming next */}
      <div className="rounded-2xl border border-dashed border-slate-800/60 bg-slate-900/30 p-5">
        <h2 className="text-lg font-semibold">Focus stats (next)</h2>
        <p className="text-sm text-slate-400 mt-1">
          Next upgrade: store focus sessions from the Timer page and show focus
          minutes per day + streaks here.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
  <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3">
    <p className="text-xs uppercase tracking-wide text-slate-400">Focus minutes (today)</p>
    <p className="mt-1 text-2xl font-semibold text-slate-50">{minutesToday}</p>
  </div>

  <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3">
    <p className="text-xs uppercase tracking-wide text-slate-400">Focus sessions (today)</p>
    <p className="mt-1 text-2xl font-semibold text-slate-50">{sessionsToday}</p>
  </div>

  <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3">
    <p className="text-xs uppercase tracking-wide text-slate-400">Streak (days)</p>
    <p className="mt-1 text-2xl font-semibold text-slate-50">{streakDays}</p>
  </div>
</div>

<button
  onClick={() => {
    clearSessions();
    setSessionRefresh((n) => n + 1);
  }}
  className="text-xs text-slate-400 hover:text-slate-100 underline"
>
  Clear focus sessions (debug)
</button>


    </div>
  );
}
