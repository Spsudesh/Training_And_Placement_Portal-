import {
  BriefcaseBusiness,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  Users,
  X,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/tpc-dashboard" },
  { label: "Students", icon: Users, to: "/tpc-dashboard/student-verification" },
  { label: "Drive Tasks", icon: ClipboardList, to: "/tpc-dashboard/tasks", disabled: true },
  { label: "Schedules", icon: CalendarDays, to: "/tpc-dashboard/schedules", disabled: true },
  { label: "Companies", icon: BriefcaseBusiness, to: "/tpc-dashboard/companies", disabled: true },
];

const linkBaseClass =
  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200";

export default function Sidebar({ mobileOpen, onClose }) {
  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-slate-950/45 transition lg:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200/70 bg-white/95 px-5 py-6 shadow-2xl shadow-slate-900/10 backdrop-blur transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-600">
              Coordination Desk
            </p>
            <h1 className="mt-2 flex items-center gap-3 text-xl font-semibold text-slate-900">
              <span className="rounded-2xl bg-slate-950 px-3 py-2 text-white">
                <GraduationCap className="h-5 w-5" />
              </span>
              TPC Panel
            </h1>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="space-y-2">
          {navItems.map(({ label, icon, to, disabled }) => {
            const Icon = icon;

            return (
              <NavLink
                key={label}
                to={to}
                onClick={(event) => {
                  if (disabled) {
                    event.preventDefault();
                    return;
                  }

                  onClose();
                }}
                className={({ isActive }) =>
                  `${linkBaseClass} ${
                    disabled
                      ? "cursor-not-allowed bg-slate-50 text-slate-400"
                      : isActive
                        ? "bg-slate-950 text-white shadow-lg shadow-slate-900/15"
                        : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
                {disabled && (
                  <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Soon
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-auto rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-blue-700 p-5 text-white">
          <p className="text-xs uppercase tracking-[0.3em] text-blue-100/80">
            Coordinator cycle
          </p>
          <h2 className="mt-2 text-lg font-semibold">Drive Operations 2026</h2>
          <p className="mt-2 text-sm leading-6 text-blue-50/85">
            Track student coordination, interview logistics, and drive follow-up
            from one panel.
          </p>
        </div>
      </aside>
    </>
  );
}
