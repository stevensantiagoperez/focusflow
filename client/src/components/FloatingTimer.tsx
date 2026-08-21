import { Link } from "react-router-dom";
import { useTimer } from "../context/TimerContext";


function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

function formatMMSS(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${pad2(minutes)}:${pad2(seconds)}`;
}


export default function FloatingTimer() {
  const {
    mode,
    secondsLeft,
    isRunning,
    toggleStartPause,
    resetTimer,
  } = useTimer();


  return (
    <div className="fixed bottom-5 right-5 z-50 w-56 rounded-2xl border border-slate-700 bg-slate-950/95 p-4 shadow-xl backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            {mode === "focus" ? "Focus" : "Break"}
          </p>

    <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-100">
            {formatMMSS(secondsLeft)}
          </p>
        </div>
    )
}