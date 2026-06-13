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

  
}