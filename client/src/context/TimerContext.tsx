import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";


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
};

const TimerContext = createContext<TimerContextType | null>(null);

export function TimerProvider({ children }: { children: ReactNode }) {

  const [mode, setMode] = useState<Mode>("focus");
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  const [isRunning, setIsRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);


  const intervalRef = useRef<number | null>(null);

  const totalSeconds =
    (mode === "focus" ? focusMinutes : breakMinutes) * 60;

}