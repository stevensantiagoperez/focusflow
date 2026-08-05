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

function startOfWeek(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() - result.getDay());
  return result;
}

function addDays(date: Date, amount: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

function heatmapClass(minutes: number, isFuture: boolean) {
  if (isFuture) {
    return "bg-slate-950/40 border-slate-900";
  }

  if (minutes === 0) {
    return "bg-slate-800 border-slate-700";
  }

  if (minutes < 30) {
    return "bg-violet-950 border-violet-900";
  }

  if (minutes < 60) {
    return "bg-violet-800 border-violet-700";
  }

  if (minutes < 120) {
    return "bg-violet-600 border-violet-500";
  }

  return "bg-violet-400 border-violet-300";
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

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const hasToday = focusDays.has(dayKey(today));
  const hasYesterday = focusDays.has(dayKey(yesterday));


  // Allow streak to continue if user hasn't focused yet today
  const cursor = new Date(
    hasToday ? today : hasYesterday ? yesterday : today
  );
  let currentStreak = 0;
  while (focusDays.has(dayKey(cursor))) {
    currentStreak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  const sortedDays = [...focusDays]
    .map((d) => new Date(d))
    .sort((a, b) => a.getTime() - b.getTime());


  let longestStreak = 0;
  let running = 0;

  
  const today = new Date();

  for (let i = 0; i < sortedDays.length; i++) {
    if (i === 0) {
      running = 1;
    } else {
      const diff =
        (sortedDays[i].getTime() - sortedDays[i - 1].getTime()) /
        (1000 * 60 * 60 * 24);

      running = diff === 1 ? running + 1 : 1;
    }

    longestStreak = Math.max(longestStreak, running);
  }
  return {
    currentStreak,
    longestStreak,
    hasToday,
  };
}, [sessions]);

  const maxMinutes = Math.max(...focusByDay.map((d) => d.minutes), 1);

  const heatmapData = useMemo(() => {
    const minutesByDay = new Map<string, number>();

    for (const session of sessions) {
      if (session.mode !== "focus") continue;

        const key = dayKey(new Date(session.endedAt));
        const minutes = session.durationSeconds / 60;

      minutesByDay.set(key, (minutesByDay.get(key) ?? 0) + minutes);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentWeekStart = startOfWeek(today);
  const firstWeekStart = addDays(currentWeekStart, -(11 * 7));

   return Array.from({ length: 12 }, (_, weekIndex) => {
    return Array.from({ length: 7 }, (_, dayIndex) => {
      const date = addDays(firstWeekStart, weekIndex * 7 + dayIndex);
      const key = dayKey(date);
      const minutes = Math.round(minutesByDay.get(key) ?? 0);

      return {
        key,
        date,
        minutes,
        isFuture: date.getTime() > today.getTime(),
      };
    });
  });
}, [sessions]);

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

<div className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
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

  <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3">
  <p className="text-xs uppercase tracking-wide text-slate-400">
    🔥 Current streak
  </p>
  <p className="mt-1 text-2xl font-semibold">
    {streakInfo.currentStreak} day
    {streakInfo.currentStreak !== 1 ? "s" : ""}
  </p>
</div>
<div className="rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3">
  <p className="text-xs uppercase tracking-wide text-slate-400">
    🏆 Longest streak
  </p>
  <p className="mt-1 text-2xl font-semibold">
    {streakInfo.longestStreak} day
    {streakInfo.longestStreak !== 1 ? "s" : ""}
  </p>
</div>
</div>
<div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
  <div className="mb-4">
    <h2 className="text-lg font-semibold">Focus consistency</h2>
    <p className="mt-1 text-sm text-slate-400">
      Your focus activity over the last 12 weeks.
    </p>
  </div>

  <div className="flex gap-3">
    {/* Day labels */}
    <div className="grid grid-rows-7 gap-1 pt-1 text-[10px] text-slate-500">
      <span>Sun</span>
      <span>Mon</span>
      <span>Tue</span>
      <span>Wed</span>
      <span>Thu</span>
      <span>Fri</span>
      <span>Sat</span>
    </div>
    {/* Heatmap */}
    <div className="overflow-x-auto pb-2">
      <div className="grid grid-flow-col grid-rows-7 gap-1">
        {heatmapData.flatMap((week) =>
          week.map((day) => (
            <div
              key={day.key}
              title={`${day.date.toLocaleDateString()}: ${
                day.minutes
              } focus minute${day.minutes === 1 ? "" : "s"}`}
              className={`h-3 w-3 rounded-sm border transition-transform hover:scale-125 ${heatmapClass(
                day.minutes,
                day.isFuture
              )}`}
            />
          ))
        )}
      </div>
    </div>
  </div>

  {/* Legend */}
  <div className="mt-4 flex items-center justify-end gap-2 text-xs text-slate-500">
    <span>Less</span>

    <div className="h-3 w-3 rounded-sm border border-slate-700 bg-slate-800" />
    <div className="h-3 w-3 rounded-sm border border-violet-900 bg-violet-950" />
    <div className="h-3 w-3 rounded-sm border border-violet-700 bg-violet-800" />
    <div className="h-3 w-3 rounded-sm border border-violet-500 bg-violet-600" />
    <div className="h-3 w-3 rounded-sm border border-violet-300 bg-violet-400" />

    <span>More</span>
  </div>
<div className="rounded-2xl border border-violet-700/40 bg-violet-950/20 p-5">
  <h2 className="text-lg font-semibold mb-2">
    🔥 Streak Status
  </h2>

  {streakInfo.currentStreak === 0 ? (
    <p className="text-slate-300">
      Start a focus session today to begin a new streak.
    </p>
  ) : streakInfo.hasToday ? (
    <p className="text-slate-300">
      Nice work! You've maintained your streak for{" "}
      <span className="font-semibold text-violet-300">
        {streakInfo.currentStreak} day
        {streakInfo.currentStreak !== 1 ? "s" : ""}
      </span>.
    </p>
  ) : (
    <p className="text-slate-300">
      You're on a{" "}
      <span className="font-semibold text-violet-300">
        {streakInfo.currentStreak}-day streak
      </span>
      . Complete one focus session today to keep it alive!
    </p>
  )}
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