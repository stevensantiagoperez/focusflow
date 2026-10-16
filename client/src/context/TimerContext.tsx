
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
}