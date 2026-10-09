import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { createSession } from "../services/apiClient";

type Mode = "focus" | "break";

type TimerContextType = {
  mode: Mode;
  focusMinutes: number;
  setFocusMinutes: (minutes: number) => void;
  breakMinutes: number;
  setBreakMinutes: (minutes: number) => void;
  secondsLeft: number;
  isRunning: boolean;
  selectedTaskId: number | null;
  setSelectedTaskId: (id: number | null) => void;
  toggleStartPause: () => void;
  resetTimer: () => void;
  switchMode: (mode: Mode) => void;
  progress: number;
  completedTaskId: number | null;
  clearCompletedTaskPrompt: () => void;
  saveError: string | null;
  toastMessage: string | null;
};

const TimerContext = createContext<TimerContextType | null>(null);
const SETTINGS_KEY = "focusflow:timer-settings";

type SavedSettings = {
  focusMinutes?: number;
  breakMinutes?: number;
  selectedTaskId?: number | null;
};

function readSettings(): SavedSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? (JSON.parse(raw) as SavedSettings) : {};
  } catch {
    return {};
  }
}

function validMinutes(value: number | undefined, fallback: number, max: number) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(1, Math.min(max, Math.round(value)))
    : fallback;
}

export function TimerProvider({ children }: { children: ReactNode }) {
  const initialSettings = useRef<SavedSettings | null>(null);
  if (initialSettings.current === null) initialSettings.current = readSettings();
  const initial = initialSettings.current;

  const [mode, setMode] = useState<Mode>("focus");
  const [focusMinutes, setFocusMinutes] = useState(() =>
    validMinutes(initial.focusMinutes, 25, 180)
  );
  const [breakMinutes, setBreakMinutes] = useState(() =>
    validMinutes(initial.breakMinutes, 5, 60)
  );
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(
    initial.selectedTaskId ?? null
  );
  const [secondsLeft, setSecondsLeft] = useState(() =>
    validMinutes(initial.focusMinutes, 25, 180) * 60
  );
  const [isRunning, setIsRunning] = useState(false);
  const [completedTaskId, setCompletedTaskId] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const completionHandled = useRef(false);

  const totalSeconds = (mode === "focus" ? focusMinutes : breakMinutes) * 60;
  const progress = totalSeconds > 0
    ? Math.min(1, Math.max(0, secondsLeft / totalSeconds))
    : 0;

  useEffect(() => {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ focusMinutes, breakMinutes, selectedTaskId })
    );
  }, [focusMinutes, breakMinutes, selectedTaskId]);

  // Duration edits reset the displayed countdown. Pausing does not.
  useEffect(() => {
    if (!isRunning) {
      setSecondsLeft((mode === "focus" ? focusMinutes : breakMinutes) * 60);
    }
    // Only react to duration edits, not start/pause.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusMinutes, breakMinutes]);

  // This interval lives above the router, so navigation doesn't stop it.
  useEffect(() => {
    if (!isRunning) return;
    const interval = window.setInterval(() => {
      setSecondsLeft((previous) => Math.max(0, previous - 1));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isRunning]);

  // Completion is handled globally, even when TimerPage isn't mounted.
  useEffect(() => {
    if (!isRunning || secondsLeft !== 0 || completionHandled.current) return;
    completionHandled.current = true;
    setIsRunning(false);

    const finishedMode = mode;
    const finishedTaskId = selectedTaskId;
    const finishedFocusMinutes = focusMinutes;
    const nextMode: Mode = finishedMode === "focus" ? "break" : "focus";
    setMode(nextMode);
    setSecondsLeft((nextMode === "focus" ? focusMinutes : breakMinutes) * 60);

    if (finishedMode === "focus") {
      setSaveError(null);
      const session = {
        id: crypto.randomUUID(),
        taskId: finishedTaskId,
        mode: "focus" as const,
        durationSeconds: finishedFocusMinutes * 60,
        endedAt: new Date().toISOString(),
      };
      void createSession(session)
        .then(() => {
          setToastMessage("🎉 Focus session saved");
          if (finishedTaskId !== null) setCompletedTaskId(finishedTaskId);
        })
        .catch((e: unknown) => {
          setSaveError(e instanceof Error ? e.message : "Failed to save session");
        });
    }
  }, [secondsLeft, isRunning, mode, focusMinutes, breakMinutes, selectedTaskId]);

  useEffect(() => {
    if (!toastMessage) return;
    const timeout = window.setTimeout(() => setToastMessage(null), 3000);
    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  function toggleStartPause() {
    if (!isRunning) completionHandled.current = false;
    if (!isRunning && secondsLeft === 0) setSecondsLeft(totalSeconds);
    setIsRunning((running) => !running);
  }

  function resetTimer() {
    completionHandled.current = false;
    setIsRunning(false);
    setSecondsLeft(totalSeconds);
  }

  function switchMode(nextMode: Mode) {
    completionHandled.current = false;
    setIsRunning(false);
    setMode(nextMode);
    setSecondsLeft((nextMode === "focus" ? focusMinutes : breakMinutes) * 60);
  }

  return (
    <TimerContext.Provider value={{
      mode,
      focusMinutes, setFocusMinutes,
      breakMinutes, setBreakMinutes,
      secondsLeft, isRunning,
      selectedTaskId, setSelectedTaskId,
      toggleStartPause, resetTimer, switchMode, progress,
      completedTaskId,
      clearCompletedTaskPrompt: () => setCompletedTaskId(null),
      saveError, toastMessage,
    }}>
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (!context) throw new Error("useTimer must be used inside TimerProvider");
  return context;
}
