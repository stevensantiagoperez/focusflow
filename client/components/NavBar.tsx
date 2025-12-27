type Page = "tasks" | "timer" | "dashboard";

export default function Navbar({
  activePage,
  onNavigate,
}: {
  activePage: Page;
  onNavigate: (page: Page) => void;
}) {
  const linkClass = (page: Page) =>
    `text-sm transition-colors ${
      activePage === page
        ? "text-slate-100"
        : "text-slate-400 hover:text-slate-100"
    }`;

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
        <span className="text-lg font-semibold tracking-tight">
          FocusFlow<span className="text-violet-400">.dev</span>
        </span>

        <nav className="flex items-center gap-4">
          <button className={linkClass("tasks")} onClick={() => onNavigate("tasks")}>
            Tasks
          </button>
          <button className={linkClass("timer")} onClick={() => onNavigate("timer")}>
            Timer
          </button>
          <button
            className={linkClass("dashboard")}
            onClick={() => onNavigate("dashboard")}
          >
            Dashboard
          </button>
        </nav>
      </div>
    </header>
  );
}
