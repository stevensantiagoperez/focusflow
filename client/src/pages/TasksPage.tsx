import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getTasks, updateTask } from "../services/apiClient";
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
    let active = true;
    getTasks()
      .then((data: Task[]) => {
        if (!active) return;
        setTasks(data);
        const fromUrl = taskIdParam !== null ? Number(taskIdParam) : null;
        if (fromUrl !== null && data.some((t) => t.id === fromUrl)) {
          setSelectedTaskId(fromUrl);
        } else if (selectedTaskId === null) {
          const firstOpen = data.find((t) => !t.completed);
          if (firstOpen) setSelectedTaskId(firstOpen.id);
        }
      })
      .catch(() => {
        // Timer remains usable even if tasks cannot load.
      });
    return () => { active = false; };
    // Only reload when the taskId URL parameter changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskIdParam, setSelectedTaskId]);

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