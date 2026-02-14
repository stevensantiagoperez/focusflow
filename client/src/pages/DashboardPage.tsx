import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getTasks, getSessions, clearSessions } from "../services/apiClient";
import type { FocusSession } from "../services/apiClient";



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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load tasks + sessions
  useEffect(() => {
    Promise.all([getTasks(), getSessions()])
      .then(([tasksData, sessionsData]) => {
        setTasks(tasksData);
        setSessions(sessionsData);
      })
      .catch((err) => setError(err.message || "Failed to load dashboard data"))
      .finally(() => setLoading(false));
  }, []);

  // ---- Task stats ----
  const totalTasks = tasks.length;
  const completedCount = useMemo(
    () => tasks.filter((t) => t.completed).length,
    [tasks]
  );
  const incompleteCount = totalTasks - completedCount;

  const recentTasks = useMemo(() => {
    return tasks.slice(-5).reverse();
  }, [tasks]);

  // ---- Focus stats (STEP 3) ----
  const focusSessions = useMemo(
    () => sessions.filter((s) => s.mode === "focus"),
    [sessions]
  );

  const today = dayKey(new Date());

  const minutesToday = useMemo(() => {
    return Math.round(
      focusSessions
        .filter((s) => dayKey(new Date(s.endedAt)) === today)
        .reduce((sum, s) => sum + s.durationSeconds, 0) / 60
    );
  }, [focusSessions, today]);

  const sessionsToday = useMemo(() => {
    return focusSessions.filter((s) => dayKey(new Date(s.endedAt)) === today)
      .length;
  }, [focusSessions, today]);

  const streakDays = useMemo(() => {
    const daysWith = new Set(
      focusSessions.map((s) => dayKey(new Date(s.endedAt)))
    );

    let streak = 0;
    const d = new Date();
    while (daysWith.has(dayKey(d))) {
      streak++;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  }, [focusSessions]);

  const focusMinutesByTask = useMemo(() => {
  const map = new Map<number, number>(); // taskId -> minutes

  for (const s of sessions) {
    if (s.mode !== "focus") continue;
    if (s.taskId == null) continue;

    const mins = s.durationSeconds / 60;
    map.set(s.taskId, (map.get(s.taskId) ?? 0) + mins);
  }

  return map;
}, [sessions]);

const topTasks = useMemo(() => {
  const items = tasks
    .map((t) => ({
      id: t.id,
      title: t.title,
      completed: t.completed,
      minutes: Math.round((focusMinutesByTask.get(t.id) ?? 0) * 10) / 10, // 1 decimal
    }))
    .filter((x) => x.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 5);

  return items;
}, [tasks, focusMinutesByTask]);


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
            Tasks + focus stats (saved sessions).
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

      {/* Focus Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Focus minutes (today)
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-50">
            {minutesToday}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Focus sessions (today)
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-50">
            {sessionsToday}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Streak (days)
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-50">
            {streakDays}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
  <div className="flex items-center justify-between mb-3">
    <h2 className="text-lg font-semibold">Top tasks by focus minutes</h2>
    <Link to="/tasks" className="text-sm text-violet-300 hover:underline">
      View tasks
    </Link>
  </div>

  {topTasks.length === 0 ? (
    <p className="text-sm text-slate-400">
      No focus time logged yet. Start the timer with a selected task.
    </p>
  ) : (
    <ul className="space-y-2">
      {topTasks.map((t) => (
        <li
          key={t.id}
          className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 px-3 py-2"
        >
          <div className="min-w-0">
            <p
              className={`text-sm truncate ${
                t.completed ? "line-through text-slate-500" : "text-slate-100"
              }`}
              title={t.title}
            >
              {t.title}
            </p>
            <p className="text-xs text-slate-500">Task #{t.id}</p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-200 tabular-nums">
              {t.minutes} min
            </span>
            <Link
              to="/tasks"
              className="text-xs text-violet-300 hover:text-violet-200 hover:underline"
            >
              Open
            </Link>
          </div>
        </li>
      ))}
    </ul>
  )}
</div>


      {/* Task Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Total tasks
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-50">
            {totalTasks}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Completed
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-50">
            {completedCount}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Remaining
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-50">
            {incompleteCount}
          </p>
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

      <button
        onClick={async () => {
          await clearSessions();
          setSessions([]);
        }}
        className="text-xs text-slate-400 hover:text-slate-100 underline"
      >
        Clear focus sessions (debug)
      </button>
    </div>
  );
}
