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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <p className="text-lg">Loading tasks...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-semibold mb-6 text-center">
          FocusFlow Tasks
        </h1>

        {error && (
          <p className="mb-4 text-sm text-red-400 bg-red-950/40 border border-red-700 rounded-md px-3 py-2">
            Error: {error}
          </p>
        )}

        <form
          onSubmit={handleAddTask}
          className="mb-5 flex gap-2 items-center"
        >
          <input
            type="text"
            placeholder="New task title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="flex-1 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          />
          <button
            type="submit"
            className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium hover:bg-violet-500 transition-colors disabled:opacity-50"
            disabled={!newTitle.trim()}
          >
            Add
          </button>
        </form>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl shadow-lg p-3">
          {tasks.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">
              No tasks yet. Add your first one to get started.
            </p>
          ) : (
            <ul className="space-y-2">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 px-3 py-2"
                >
                  <span className="text-sm">{task.title}</span>
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="text-xs text-red-300 hover:text-red-200 hover:underline"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
