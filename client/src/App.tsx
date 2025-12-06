// client/src/App.tsx
import TasksPage from "./pages/TasksPage";
import Navbar from "../components/NavBar";

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
