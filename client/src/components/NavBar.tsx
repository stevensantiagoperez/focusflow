import { NavLink } from "react-router-dom";

const linkBase =
  "text-sm text-slate-400 hover:text-slate-100 transition-colors";
const linkActive = "text-sm text-slate-100 font-medium";

export default function NavBar() {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
        <span className="text-lg font-semibold tracking-tight">
          FocusFlow<span className="text-violet-400">.dev</span>
        </span>

        <nav className="flex items-center gap-4">
          <NavLink
            to="/tasks"
            className={({ isActive }) => (isActive ? linkActive : linkBase)}
          >
            Tasks
          </NavLink>

          <NavLink
            to="/timer"
            className={({ isActive }) => (isActive ? linkActive : linkBase)}
          >
            Timer
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
