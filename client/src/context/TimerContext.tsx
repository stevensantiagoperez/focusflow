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
}
