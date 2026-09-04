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
