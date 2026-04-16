import { useState } from "react";
import {
  BriefcaseBusiness,
  CalendarDays,
  CircleHelp,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  Megaphone,
  Users,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import Header from "./TPCheader";

const navigationItems = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/tpc-dashboard" },
  { label: "Students", icon: Users, to: "/tpc-dashboard/student-verification" },
  { label: "Opportunities", icon: BriefcaseBusiness, to: "/tpc-dashboard/placements" },
  { label: "Notice", icon: Megaphone, to: "/tpc-dashboard/notice-board" },
  { label: "Drive Tasks", icon: ClipboardCheck, to: "/tpc-dashboard", disabled: true },
  { label: "Schedules", icon: CalendarDays, to: "/tpc-dashboard", disabled: true },
  { label: "Reports", icon: FileText, to: "/tpc-dashboard", disabled: true },
];

function TpcSidebar({
  children,
  pageTitle = "TPC Dashboard",
  showSidebar = true,
  onLogout,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <Header
        pageTitle={pageTitle}
        showMenuButton={showSidebar}
        onMenuClick={() => setSidebarOpen(true)}
        profileInitials="TC"
        onLogout={onLogout}
      />

      {showSidebar ? (
        <aside
          className={`fixed left-0 top-20 z-40 flex h-[calc(100vh-5rem)] w-[112px] flex-col border-r border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition-transform duration-300 lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <nav className="flex-1 space-y-2 px-3 py-5">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.label}
                  to={item.disabled ? "/tpc-dashboard" : item.to}
                  end={item.to === "/tpc-dashboard"}
                  onClick={() => {
                    setSidebarOpen(false);
                  }}
                >
                  {({ isActive }) => (
                    <div
                      className={`flex w-full flex-col items-center gap-2 rounded-2xl px-2 py-3 text-center text-[11px] font-medium transition ${
                        item.disabled
                          ? "text-slate-300 hover:bg-slate-50 hover:text-slate-400"
                          : isActive
                          ? "bg-blue-50 text-blue-700"
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <span
                        className={`flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-semibold ${
                          item.disabled
                            ? "bg-slate-100 text-slate-300"
                            : isActive
                            ? "bg-blue-600 text-white shadow-[0_12px_24px_rgba(37,99,235,0.26)]"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        <Icon className="h-[22px] w-[22px]" />
                      </span>
                      <span>{item.label}</span>
                      {item.disabled ? (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] text-slate-400">
                          Soon
                        </span>
                      ) : null}
                    </div>
                  )}
                </NavLink>
              );
            })}
          </nav>

          <div className="border-t border-slate-200 px-3 py-4">
            <button
              type="button"
              className="flex w-full flex-col items-center gap-2 rounded-2xl px-2 py-3 text-[11px] font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <CircleHelp className="h-[22px] w-[22px]" />
              </span>
              <span>Help</span>
            </button>
          </div>
        </aside>
      ) : null}

      {showSidebar && sidebarOpen ? (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-30 bg-slate-900/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <div className={showSidebar ? "lg:pl-[112px]" : ""}>
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

export default TpcSidebar;
