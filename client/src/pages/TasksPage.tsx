import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getTasks, updateTask, getSessions } from "../services/apiClient";
import { useTimer } from "../context/TimerContext";

type Task = {
  id: number;
  title: string;
  completed: boolean;
  goalMinutes: number;
};

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

function formatMMSS(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${pad2(m)}:${pad2(s)}`;
}

export default function TimerPage() {
  const {
    mode,
    focusMinutes,
    setFocusMinutes,
    breakMinutes,
    setBreakMinutes,
    secondsLeft,
    isRunning,
    selectedTaskId,
    setSelectedTaskId,
    toggleStartPause,
    resetTimer,
    adjustTime,
    switchMode,
    progress,
    completedTaskId,
    clearCompletedTaskPrompt,
    saveError,
    toastMessage,
  } = useTimer();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const taskIdParam = searchParams.get("taskId");

  useEffect(() => {
  getTasks()
    .then((data) => {
      console.log("Tasks loaded:", data);
      setTasks(data);
    })
    .catch((err) => {
      console.error("Failed to load tasks:", err);
      setError("Failed to load tasks");
    })
    .finally(() => setLoading(false));

  getSessions()
    .then(setSessions)
    .catch((err) => {
      console.error("Failed to load sessions:", err);
    });
}, []);

  async function markSelectedTaskComplete() {
    if (completedTaskId === null) return;
    setCompleteError(null);
    try {
      await updateTask(completedTaskId, { completed: true });
      setTasks((prev) =>
        prev.map((t) =>
          t.id === completedTaskId ? { ...t, completed: true } : t
        )
      );
      clearCompletedTaskPrompt();
    } catch (e: unknown) {
      setCompleteError(e instanceof Error ? e.message : "Failed to complete task");
    }
  }

  return (
  <div className="space-y-6">

    {toastMessage && (
      <div className="fixed top-20 right-4 z-50 rounded-lg border border-emerald-700/60 bg-emerald-950/90 px-4 py-3 text-sm text-emerald-200 shadow-lg backdrop-blur">
        {toastMessage}
      </div>
    )}

    {/* Keep the rest of your TasksPage JSX here */}

  </div>
)}