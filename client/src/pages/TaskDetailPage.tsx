import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getTasks,
  getSessions,
  updateTask,
} from "../services/apiClient";
import type { FocusSession } from "../services/apiClient";

type Task = {
  id: number;
  title: string;
  completed: boolean;
};

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString();
}

export default function TaskDetailPage() {
  const params = useParams();
  const taskId = Number(params.id);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load tasks + sessions
  useEffect(() => {
    if (!Number.isFinite(taskId)) {
      setError("Invalid task id");
      setLoading(false);
      return;
    }

    Promise.all([getTasks(), getSessions()])
      .then(([t, s]) => {
        setTasks(t);
        setSessions(s);
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : "Failed to load data";
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [taskId]);
