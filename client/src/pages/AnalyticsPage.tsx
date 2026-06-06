import { useEffect, useMemo, useState } from "react";
import { getSessions } from "../services/apiClient";
import type { FocusSession } from "../services/apiClient";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}


export default function AnalyticsPage() {
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [loading, setLoading] = useState(true);

}