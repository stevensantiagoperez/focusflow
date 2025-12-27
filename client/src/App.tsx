import Navbar from "../components/Navbar";
import TasksPage from "./pages/TasksPage";

function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <TasksPage />
      </main>
    </div>
  );
}

export default App;
