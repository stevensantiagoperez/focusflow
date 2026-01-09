export type FocusSession = {
  id: string;
  mode: "focus" | "break";
  durationSeconds: number;
  endedAt: string;   // ISO string
};

const KEY = "focusflow:sessions";

export function loadSessions(): FocusSession[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function saveSessions(sessions: FocusSession[]) {
  localStorage.setItem(KEY, JSON.stringify(sessions));
}

export function addSession(session: FocusSession) {
  const sessions = loadSessions();
  sessions.push(session);
  saveSessions(sessions);
}

export function clearSessions() {
  localStorage.removeItem(KEY);
}
