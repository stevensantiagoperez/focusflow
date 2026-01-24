import { Router } from "express";

const router = Router();

export type FocusSession = {
  id: string;
  taskId: number | null;
  mode: "focus" | "break";
  durationSeconds: number;
  endedAt: string; // ISO
};

// In-memory for now (next step later: DB)
let sessions: FocusSession[] = [];

// GET /api/sessions
router.get("/", (req, res) => {
  res.json(sessions);
});

// POST /api/sessions
router.post("/", (req, res) => {
  const { id, taskId, mode, durationSeconds, endedAt } = req.body ?? {};

  if (!id || typeof id !== "string") {
    return res.status(400).json({ message: "id is required" });
  }
  if (mode !== "focus" && mode !== "break") {
    return res.status(400).json({ message: "mode must be 'focus' or 'break'" });
  }
  if (typeof durationSeconds !== "number" || durationSeconds <= 0) {
    return res.status(400).json({ message: "durationSeconds must be a positive number" });
  }
  if (!endedAt || typeof endedAt !== "string") {
    return res.status(400).json({ message: "endedAt is required" });
  }
  if (taskId !== null && taskId !== undefined && typeof taskId !== "number") {
    return res.status(400).json({ message: "taskId must be a number or null" });
  }

  const newSession: FocusSession = {
    id,
    taskId: taskId ?? null,
    mode,
    durationSeconds,
    endedAt,
  };

  sessions.push(newSession);
  res.status(201).json(newSession);
});

// Optional: DELETE all sessions (debug)
router.delete("/", (req, res) => {
  sessions = [];
  res.status(204).send();
});

export default router;
