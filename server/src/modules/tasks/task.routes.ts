import { Router } from "express";
import { prisma } from "../../db";

const router = Router();

// GET /api/tasks
router.get("/", async (req, res) => {
  const tasks = await prisma.task.findMany({
    orderBy: { createdAt: "asc" },
  });
  res.json(tasks);
});

// POST /api/tasks
router.post("/", async (req, res) => {
  const { title } = req.body;

  if (!title || typeof title !== "string") {
    return res.status(400).json({ message: "Title is required" });
  }

  const task = await prisma.task.create({
    data: { title, completed: false },
  });

  res.status(201).json(task);
});

// DELETE /api/tasks/:id
router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id" });

  try {
    await prisma.task.delete({ where: { id } });
    res.status(204).send();
  } catch {
    res.status(404).json({ message: "Task not found" });
  }
});

// PATCH /api/tasks/:id
router.patch("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id" });

  const { completed, title } = req.body as {
    completed?: unknown;
    title?: unknown;
  };

  const data: { completed?: boolean; title?: string } = {};
  if (typeof completed === "boolean") data.completed = completed;
  if (typeof title === "string") data.title = title;

  try {
    const updated = await prisma.task.update({
      where: { id },
      data,
    });
    res.json(updated);
  } catch {
    res.status(404).json({ message: "Task not found" });
  }
});

export default router;
