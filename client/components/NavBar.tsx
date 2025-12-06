// client/src/components/Navbar.tsx
export default function Navbar() {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
        <span className="text-lg font-semibold tracking-tight">
          FocusFlow<span className="text-violet-400">.dev</span>
        </span>

        <nav className="flex items-center gap-4 text-sm text-slate-400">
          <button className="hover:text-slate-100 transition-colors">
            Tasks
          </button>
          <button className="hover:text-slate-100 transition-colors">
            Timer
          </button>
          <button className="hover:text-slate-100 transition-colors">
            Dashboard
          </button>
        </nav>
      </div>
    </header>
  );
}
