import { useEffect, useMemo, useRef, useState } from "react";
import { addSession } from "../utils/sessions";
import { createSession, getTasks } from "../services/apiClient";

type Task = { id: number; title: string; completed: boolean };

type Mode = "focus" | "break";

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

function formatMMSS(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${pad2(m)}:${pad2(s)}`;
}

export default function TimerPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [mode, setMode] = useState<Mode>("focus");
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);

  const [isRunning, setIsRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(() => focusMinutes * 60);

  const intervalRef = useRef<number | null>(null);

  const totalSecondsForMode = useMemo(() => {
    return (mode === "focus" ? focusMinutes : breakMinutes) * 60;
  }, [mode, focusMinutes, breakMinutes]);

  const progress = useMemo(() => {
    const total = totalSecondsForMode;
    if (total <= 0) return 0;
    return Math.min(1, Math.max(0, secondsLeft / total));
  }, [secondsLeft, totalSecondsForMode]);

  useEffect(() => {
    getTasks()
      .then((data) => {
        setTasks(data);
        // default to first incomplete task if available
        const firstOpen = data.find((t: Task) => !t.completed);
        if (firstOpen) setSelectedTaskId(firstOpen.id);
      })
      .catch(() => {
        // timer can still work without tasks
      });
  }, []);

  // When mode/durations change AND timer isn't running, reset secondsLeft to match
  useEffect(() => {
    if (!isRunning) {
      setSecondsLeft(totalSecondsForMode);
    }
  }, [totalSecondsForMode, isRunning]);

  // Ticking logic
  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = window.setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [isRunning]);

  // When timer hits 0, auto switch modes
  useEffect(() => {
    if (!isRunning) return;
    if (secondsLeft > 0) return;

    async function finalize() {
      setIsRunning(false);

      // Save only focus sessions
      if (mode === "focus") {
        setSaveError(null);
        const session = {
          id: crypto.randomUUID(),
          taskId: selectedTaskId,
          mode: "focus" as const,
          durationSeconds: focusMinutes * 60,
          endedAt: new Date().toISOString(),
        };
        try {
          await createSession(session);
        } catch (e: any) {
          setSaveError(e?.message || "Failed to save session");
        } finally {
          // Always add to local sessions store
          addSession(session);
        }
      }

      setMode((prev) => (prev === "focus" ? "break" : "focus"));
    }

    finalize();
  }, [secondsLeft, isRunning, mode, focusMinutes, selectedTaskId]);

  function toggleStartPause() {
    setIsRunning((r) => !r);
  }

  function resetTimer() {
    setIsRunning(false);
    setSecondsLeft(totalSecondsForMode);
  }

  function switchMode(next: Mode) {
    setIsRunning(false);
    setMode(next);
  }

  return (
    <div className="space-y-6">

    {saveError && (
      <p className="text-sm text-red-400 bg-red-950/40 border border-red-700 rounded-md px-3 py-2">
        Error: {saveError}
      </p>
    )}

    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
      <h2 className="text-lg font-semibold mb-3">Working on</h2>

      <select
        value={selectedTaskId ?? ""}
        onChange={(e) =>
          setSelectedTaskId(e.target.value ? Number(e.target.value) : null)
        }
        disabled={isRunning}
        className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
      >
        <option value="">No task selected</option>
        {tasks.map((t) => (
          <option key={t.id} value={t.id}>
            {t.completed ? "✅ " : ""}
            {t.title}
          </option>
        ))}
      </select>

      <p className="mt-2 text-xs text-slate-500">
        Tip: pick a task before starting. (Disabled while running.)
      </p>
    </div>

    <div className="flex items-center justify-between gap-3">
      <h1 className="text-3xl font-semibold tracking-tight">Timer</h1>
        <div className="flex gap-2">
          <button
            onClick={() => switchMode("focus")}
            className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
              mode === "focus"
                ? "border-violet-500 bg-violet-600/20 text-slate-100"
                : "border-slate-800 bg-slate-900 text-slate-300 hover:text-slate-100"
            }`}
          >
            Focus
          </button>
          <button
            onClick={() => switchMode("break")}
            className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
              mode === "break"
                ? "border-emerald-500 bg-emerald-600/20 text-slate-100"
                : "border-slate-800 bg-slate-900 text-slate-300 hover:text-slate-100"
            }`}
          >
            Break
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
        <p className="text-sm text-slate-400 mb-2">
          Mode:{" "}
          <span className="text-slate-100 font-medium">
            {mode === "focus" ? "Focus Session" : "Break"}
          </span>
        </p>

        <div className="flex items-center justify-center">
          <div className="relative w-56 h-56">
            <div className="absolute inset-0 rounded-full border border-slate-800 bg-slate-950/30" />
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: `conic-gradient(rgba(139,92,246,0.9) ${
                  progress * 360
                }deg, rgba(30,41,59,0.7) 0deg)`,
              }}
            />
            <div className="absolute inset-3 rounded-full bg-slate-950 flex items-center justify-center border border-slate-800">
              <span className="text-5xl font-semibold tabular-nums">
                {formatMMSS(Math.max(0, secondsLeft))}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={toggleStartPause}
            className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium hover:bg-violet-500 transition-colors"
          >
            {isRunning ? "Pause" : "Start"}
          </button>
          <button
            onClick={resetTimer}
            className="rounded-md border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
        <h2 className="text-lg font-semibold mb-4">Settings</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="text-sm text-slate-300">Focus minutes</span>
            <input
              type="number"
              min={1}
              max={180}
              value={focusMinutes}
              disabled={isRunning}
              onChange={(e) => setFocusMinutes(Number(e.target.value))}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm text-slate-300">Break minutes</span>
            <input
              type="number"
              min={1}
              max={60}
              value={breakMinutes}
              disabled={isRunning}
              onChange={(e) => setBreakMinutes(Number(e.target.value))}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </label>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          Tip: Changing settings resets the timer only when it’s not running.
        </p>
      </div>
    </div>
  );
}
