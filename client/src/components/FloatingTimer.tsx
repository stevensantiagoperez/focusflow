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

}