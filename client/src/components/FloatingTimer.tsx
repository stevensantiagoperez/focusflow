import { Link } from "react-router-dom";
import { useTimer } from "../context/TimerContext";


function pad2(n: number) {
  return n.toString().padStart(2, "0");
}