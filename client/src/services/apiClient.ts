const API_URL = "http://localhost:4000";

export async function getTasks() {
  const res = await fetch(`${API_URL}/api/tasks`);
  return res.json();
}
