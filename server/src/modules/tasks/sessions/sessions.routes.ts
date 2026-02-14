import { Router } from "express";
import { prisma } from "../../../db";

const router = Router();

// GET /api/sessions
router.get("/", async (req, res) => {
  const sessions = await prisma.session.findMany({
    orderBy: { endedAt: "desc" },
  });
  res.json(
    sessions.map((s) => ({
      ...s,
      endedAt: s.endedAt.toISOString(),
    }))
  );
});

// POST /api/sessions
router.post("/", async (req, res) => {
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

  // Validate endedAt parses
  const ended = new Date(endedAt);
  if (Number.isNaN(ended.getTime())) {
    return res.status(400).json({ message: "endedAt must be a valid ISO date string" });
  }

  const created = await prisma.session.create({
    data: {
      id,
      taskId: taskId ?? null,
      mode,
      durationSeconds,
      endedAt: ended,
    },
  });

  res.status(201).json({
    ...created,
    endedAt: created.endedAt.toISOString(),
  });
});

// DELETE /api/sessions (debug)
router.delete("/", async (_req, res) => {
  await prisma.session.deleteMany();
  res.status(204).send();
});

export default router;
