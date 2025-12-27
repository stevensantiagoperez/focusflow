import { Outlet } from "react-router-dom";
import NavBar from "../components/NavBar"

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <NavBar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
