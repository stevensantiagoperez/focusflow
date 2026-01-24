const API_URL = "http://127.0.0.1:4000"; // keep this if localhost was flaky

export async function getTasks() {
  const res = await fetch(`${API_URL}/api/tasks`);
  if (!res.ok) throw new Error("Failed to fetch tasks");
  return res.json();
}

export async function createTask(title: string) {
  const res = await fetch(`${API_URL}/api/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error("Failed to create task");
  return res.json();
}

export async function deleteTask(id: number) {
  const res = await fetch(`${API_URL}/api/tasks/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) throw new Error("Failed to delete task");
}

export async function updateTask(
  id: number,
  updates: Partial<{ title: string; completed: boolean }>
) {
  const res = await fetch(`${API_URL}/api/tasks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error("Failed to update task");
  return res.json();
}

// -------- Sessions --------
export type FocusSession = {
  id: string;
  taskId: number | null;
  mode: "focus" | "break";
  durationSeconds: number;
  endedAt: string;
};

export async function getSessions(): Promise<FocusSession[]> {
  const res = await fetch(`${API_URL}/api/sessions`);
  if (!res.ok) throw new Error("Failed to fetch sessions");
  return res.json();
}

export async function createSession(session: FocusSession): Promise<FocusSession> {
  const res = await fetch(`${API_URL}/api/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(session),
  });
  if (!res.ok) throw new Error("Failed to create session");
  return res.json();
}

export async function clearSessions(): Promise<void> {
  const res = await fetch(`${API_URL}/api/sessions`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) throw new Error("Failed to clear sessions");
}
