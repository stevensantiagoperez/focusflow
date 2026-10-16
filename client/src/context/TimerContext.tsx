
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
  adjustTime: (deltaSeconds: number) => void;
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
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [completedTaskId, setCompletedTaskId] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const completionHandled = useRef(false);

  const totalSeconds = (mode === "focus" ? focusMinutes : breakMinutes) * 60;
  // The ring adapts when time is added or subtracted mid-session.
  const adjustedTotalSeconds = secondsLeft + elapsedSeconds;
  const progress = adjustedTotalSeconds > 0
    ? Math.min(1, Math.max(0, secondsLeft / adjustedTotalSeconds))
    : 0;

  useEffect(() => {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ focusMinutes, breakMinutes, selectedTaskId })
    );
  }, [focusMinutes, breakMinutes, selectedTaskId]);

    // Reset the countdown when duration settings change
  useEffect(() => {
    if (!isRunning) {
      setSecondsLeft(
        (mode === "focus" ? focusMinutes : breakMinutes) * 60
      );
      setElapsedSeconds(0);
    }
    // Only react to duration edits, not start/pause
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusMinutes, breakMinutes]);

  // Keep countdown running across pages
  useEffect(() => {
    if (!isRunning) return;

    const interval = window.setInterval(() => {
      setSecondsLeft((previous) => Math.max(0, previous - 1));
      setElapsedSeconds((previous) => previous + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isRunning]);

  // Handle completed sessions globally
  useEffect(() => {
    if (!isRunning || secondsLeft !== 0 || completionHandled.current) {
      return;
    }

    completionHandled.current = true;
    setIsRunning(false);

    const finishedMode = mode;
    const finishedTaskId = selectedTaskId;
    const finishedElapsedSeconds = elapsedSeconds;

    const nextMode: Mode =
      finishedMode === "focus" ? "break" : "focus";

    setMode(nextMode);
    setSecondsLeft(
      (nextMode === "focus" ? focusMinutes : breakMinutes) * 60
    );
    setElapsedSeconds(0);

    if (finishedMode === "focus") {
      setSaveError(null);

      const session = {
        id: crypto.randomUUID(),
        taskId: finishedTaskId,
        mode: "focus" as const,
        durationSeconds: finishedElapsedSeconds,
        endedAt: new Date().toISOString(),
      };

      void createSession(session)
        .then(() => {
          window.dispatchEvent(
            new Event("focusflow:session-saved")
          );

          setToastMessage("🎉 Focus session saved");

          if (finishedTaskId !== null) {
            setCompletedTaskId(finishedTaskId);
          }
        })
        .catch((e: unknown) => {
          setSaveError(
            e instanceof Error ? e.message : "Failed to save session"
          );
        });
    }
  }, [
    secondsLeft,
    isRunning,
    mode,
    focusMinutes,
    breakMinutes,
    selectedTaskId,
    elapsedSeconds,
  ]);

  useEffect(() => {
    if (!toastMessage) return;

    const timeout = window.setTimeout(() => {
      setToastMessage(null);
    }, 3000);

    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  function toggleStartPause() {
    if (!isRunning) {
      completionHandled.current = false;
    }

    if (!isRunning && secondsLeft === 0) {
      setSecondsLeft(totalSeconds);
    }

    setIsRunning((running) => !running);
  }

  function resetTimer() {
    completionHandled.current = false;
    setIsRunning(false);
    setSecondsLeft(totalSeconds);
    setElapsedSeconds(0);
  }

  function adjustTime(deltaSeconds: number) {
    if (!Number.isFinite(deltaSeconds)) return;

    setSecondsLeft((previous) =>
      Math.max(1, previous + Math.round(deltaSeconds))
    );
  }

  function switchMode(nextMode: Mode) {
    completionHandled.current = false;
    setIsRunning(false);
    setMode(nextMode);

    setSecondsLeft(
      (nextMode === "focus" ? focusMinutes : breakMinutes) * 60
    );

    setElapsedSeconds(0);
  }

  return (
    <TimerContext.Provider
      value={{
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
        clearCompletedTaskPrompt: () => setCompletedTaskId(null),
        saveError,
        toastMessage,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}

// IMPORTANT: This must be OUTSIDE TimerProvider
export function useTimer() {
  const context = useContext(TimerContext);

  if (!context) {
    throw new Error("useTimer must be used inside TimerProvider");
  }

  return context;
}