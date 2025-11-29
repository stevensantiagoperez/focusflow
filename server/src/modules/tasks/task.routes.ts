import { Router } from "express";

const router = Router();

// Simple in-memory task list for now
type Task = {
  id: number;
  title: string;
};

let tasks: Task[] = [
  { id: 1, title: "Test task from server" },
];

// GET /api/tasks - list all tasks
router.get("/", (req, res) => {
  res.json(tasks);
});

// POST /api/tasks - create a new task
router.post("/", (req, res) => {
  const { title } = req.body;

  if (!title || typeof title !== "string") {
    return res.status(400).json({ message: "Title is required" });
  }

  const newTask: Task = {
    id: Date.now(), // simple id generator for now
    title,
  };

  tasks.push(newTask);
  res.status(201).json(newTask);
});

// DELETE /api/tasks/:id - delete task by id
router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);

  const beforeLength = tasks.length;
  tasks = tasks.filter((t) => t.id !== id);

  if (tasks.length === beforeLength) {
    return res.status(404).json({ message: "Task not found" });
  }

  res.status(204).send(); // no content
});

export default router;
