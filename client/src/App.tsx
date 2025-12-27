import { useState } from "react";
import Navbar from "../components/Navbar";
import TasksPage from "./pages/TasksPage";
import TimerPage from "./pages/TimerPage";

type Page = "tasks" | "timer" | "dashboard";

function App() {
  const [page, setPage] = useState<Page>("tasks");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar activePage={page} onNavigate={setPage} />
      <main className="max-w-3xl mx-auto px-4 py-8">
        {page === "tasks" && <TasksPage />}
        {page === "timer" && <TimerPage />}
        {page === "dashboard" && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <p className="text-slate-400 mt-2">Coming next 👀</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
