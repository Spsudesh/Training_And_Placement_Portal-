import { Bell, Menu, Search } from "lucide-react";

export default function Topbar({ onMenuClick, onLogout }) {
  return (
    <header className="sticky top-0 z-20 mb-6 flex flex-col gap-4 rounded-[28px] border border-white/60 bg-white/80 px-5 py-4 shadow-lg shadow-slate-200/60 backdrop-blur sm:px-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-2xl border border-slate-200 p-2 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-600">
            Coordinator Overview
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">
            Training & Placement Coordinator
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Monitor drive readiness, student coordination, and execution updates.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-400">
          <Search className="h-4 w-4" />
          <span>Search students, tasks, schedules</span>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        >
          Logout
        </button>

        <button
          type="button"
          className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-3 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
