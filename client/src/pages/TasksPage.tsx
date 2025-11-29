import { useEffect, useState, FormEvent } from "react";
import { getTasks, createTask, deleteTask } from "../services/apiClient";

type Task = {
  id: number;
  title: string;
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load tasks on mount
  useEffect(() => {
    getTasks()
      .then((data) => setTasks(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleAddTask(e: FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const created = await createTask(newTitle.trim());
      setTasks((prev) => [...prev, created]);
      setNewTitle("");
    } catch (err: any) {
      setError(err.message || "Failed to add task");
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err: any) {
      setError(err.message || "Failed to delete task");
    }
  }

  if (loading) return <div style={{ padding: 20 }}>Loading tasks...</div>;

  return (
    <div style={{ padding: 20, maxWidth: 500, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, fontWeight: "bold", marginBottom: 12 }}>
        Tasks
      </h1>

      {error && (
        <p style={{ color: "red", marginBottom: 12 }}>
          Error: {error}
        </p>
      )}

      <form onSubmit={handleAddTask} style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="New task title"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          style={{ padding: 8, width: "70%", marginRight: 8 }}
        />
        <button type="submit" style={{ padding: "8px 16px" }}>
          Add Task
        </button>
      </form>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {tasks.map((task) => (
          <li
            key={task.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
              padding: 8,
              border: "1px solid #ddd",
              borderRadius: 4,
            }}
          >
            <span>{task.title}</span>
            <button onClick={() => handleDelete(task.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
