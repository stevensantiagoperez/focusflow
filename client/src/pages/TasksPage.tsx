
import { Link } from "react-router-dom";

import { useEffect, useMemo, useState } from "react";

import type { FormEvent } from "react";

import {

  getTasks,

  createTask,

  deleteTask,

  updateTask,

  getSessions,

} from "../services/apiClient";

import type { FocusSession } from "../services/apiClient";

type Task = {

  id: number;

  title: string;

  completed: boolean;

  goalMinutes: number;

};

export default function TasksPage() {

  const [tasks, setTasks] = useState<Task[]>([]);

  const [newTitle, setNewTitle] = useState("");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [sessions, setSessions] = useState<FocusSession[]>([]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [prevGoalReachedMap, setPrevGoalReachedMap] = useState<Record<number, boolean>>({});

  const [filter, setFilter] = useState<"all" | "active" | "completed" | "goalReached">("all");

  const [sortBy, setSortBy] = useState<"newest" | "mostProgress">("newest");

  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);

  const [editTitle, setEditTitle] = useState("");

  const [editGoalMinutes, setEditGoalMinutes] = useState("");

  // Load tasks independently so a session API failure cannot hide tasks.
  useEffect(() => {
    getTasks()
      .then(setTasks)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load tasks");
      })
      .finally(() => setLoading(false));

    getSessions()
      .then(setSessions)
      .catch((err: unknown) => {
        console.error("Failed to load focus sessions:", err);
      });
  }, []);

  // Refresh saved focus totals if a session completes while this page is open.
  useEffect(() => {
    let active = true;
    const refreshSessions = () => {
      getSessions()
        .then((data) => {
          if (active) setSessions(data);
        })
        .catch((err: unknown) => {
          if (active) setError(err instanceof Error ? err.message : "Failed to refresh focus sessions");
        });
    };

    window.addEventListener("focusflow:session-saved", refreshSessions);
    return () => {
      active = false;
      window.removeEventListener("focusflow:session-saved", refreshSessions);
    };
  }, []);

