import { useState } from "react";
import { NavLink } from "react-router-dom";
import Header from "./student_header";

const navigationItems = [
  { label: "Home", icon: "home", to: "/student-panel" },
  { label: "Job Profiles", icon: "work", to: "/student-panel/jobs" },
  { label: "My Profile", icon: "person", to: "/student-panel/profile" },
  { label: "Interviews", icon: "groups", to: "/student-panel", fallback: true },
  { label: "Assessments", icon: "assignment", to: "/student-panel", fallback: true },
  { label: "Resume", icon: "description", to: "/student-panel", fallback: true },
];

function StudentSidebar({
  children,
  pageTitle = "Student Panel",
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
        profileInitials="SP"
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
              const itemContent = (isActive = false) => (
                <>
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-semibold ${
                      item.fallback
                        ? "bg-slate-100 text-slate-300"
                        : isActive
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[22px]">
                      {item.icon}
                    </span>
                  </span>
                  <span>{item.label}</span>
                  {item.fallback ? (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] text-slate-400">
                      Soon
                    </span>
                  ) : null}
                </>
              );

              return (
                <NavLink
                  key={item.label}
                  to={item.to}
                  end={item.to === "/student-panel"}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex w-full flex-col items-center gap-2 rounded-2xl px-2 py-3 text-center text-[11px] font-medium transition ${
                      item.fallback
                        ? "text-slate-400 hover:bg-slate-50 hover:text-slate-500"
                        : isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`
                  }
                >
                  {({ isActive }) => itemContent(isActive)}
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
                <span className="material-symbols-outlined text-[22px]">
                  help
                </span>
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

export default StudentSidebar;
