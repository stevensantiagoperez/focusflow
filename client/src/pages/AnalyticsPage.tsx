import { useEffect, useMemo, useState } from "react";
import { getSessions } from "../services/apiClient";
import type { FocusSession } from "../services/apiClient";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function dayKey(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function labelDay(d: Date) {
  return d.toLocaleDateString(undefined, { weekday: "short" });
}

export default function AnalyticsPage() {
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSessions()
      .then(setSessions)
      .finally(() => setLoading(false));
  }, []);


  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d;
    });
  }, []);

  const focusByDay = useMemo(() => {
    return last7Days.map((day) => {
      const key = dayKey(day);
      const minutes = sessions
        .filter((s) => s.mode === "focus" && dayKey(new Date(s.endedAt)) === key)
        .reduce((sum, s) => sum + s.durationSeconds / 60, 0);

      return {
        key,
        label: labelDay(day),
        minutes: Math.round(minutes),
      };
    });
  }, [sessions, last7Days]);

  const totalWeekMinutes = focusByDay.reduce((sum, d) => sum + d.minutes, 0);
  const sessionsThisWeek = sessions.filter((s) =>
    focusByDay.some((d) => d.key === dayKey(new Date(s.endedAt)))
  ).length;

  const bestDay = focusByDay.reduce(
    (best, day) => (day.minutes > best.minutes ? day : best),
    focusByDay[0]
  );

  const streakInfo = useMemo(() => {
  const focusDays = new Set(
    sessions
      .filter((s) => s.mode === "focus")
      .map((s) => dayKey(new Date(s.endedAt)))
  );

  let currentStreak = 0;
  const today = new Date();

  while (true) {
    const key = dayKey(today);

    if (focusDays.has(key)) {
      currentStreak++;
      today.setDate(today.getDate() - 1);
    } else {
      break;
    }
  }

  const maxMinutes = Math.max(...focusByDay.map((d) => d.minutes), 1);

  if (loading) {
    return <p className="text-slate-300">Loading analytics...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-slate-400 mt-1">
          Your focus activity over the last 7 days.
        </p>
      </div>

<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
  <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3">
    <p className="text-xs uppercase tracking-wide text-slate-400">
      Focus minutes
    </p>
    <p className="mt-1 text-2xl font-semibold">{totalWeekMinutes}</p>
  </div>

  <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3">
    <p className="text-xs uppercase tracking-wide text-slate-400">
      Sessions
    </p>
    <p className="mt-1 text-2xl font-semibold">{sessionsThisWeek}</p>
  </div>

  <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3">
    <p className="text-xs uppercase tracking-wide text-slate-400">
      Best day
    </p>
    <p className="mt-1 text-2xl font-semibold">
      {bestDay.minutes > 0 ? bestDay.label : "—"}
    </p>
  </div>
</div>

  <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
        <h2 className="text-lg font-semibold mb-4">7-day focus chart</h2>

        <div className="flex items-end gap-3 h-56">
          {focusByDay.map((day) => {
            const height = Math.max(8, (day.minutes / maxMinutes) * 180);

            return (
              <div key={day.key} className="flex flex-1 flex-col items-center gap-2">
                <div className="text-xs text-slate-400">{day.minutes}m</div>
                <div className="flex h-44 w-full items-end rounded-md bg-slate-950/60 overflow-hidden">
                  <div
                    className="w-full rounded-t-md bg-violet-500 transition-all"
                    style={{ height }}
                  />
                </div>
                <div className="text-xs text-slate-400">{day.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  )
}