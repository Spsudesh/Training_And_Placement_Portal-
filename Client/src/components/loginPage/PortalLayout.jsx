import { useState } from "react";

const navigationItems = [
  { label: "Home", icon: "home" },
  { label: "Job Profiles", icon: "work" },
  { label: "My Profile", icon: "person" },
  { label: "Interviews", icon: "groups" },
  { label: "Assessments", icon: "assignment" },
  { label: "Resume", icon: "description" },
];

function PortalLayout({
  children,
  pageTitle = "Student Panel",
  activePage = "Home",
  showSidebar = true,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-slate-200 bg-white px-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          {showSidebar ? (
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-700 transition hover:bg-slate-50 lg:hidden"
            >
              <span className="material-symbols-outlined text-[22px] leading-none">
                menu
              </span>
            </button>
          ) : null}

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-500 text-base font-bold text-white shadow-lg">
              TP
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">
                Training & Placement
              </p>
              <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
                {pageTitle}
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-lg text-slate-500 transition hover:bg-slate-50"
            aria-label="Settings"
          >
            <span className="material-symbols-outlined text-[22px]">
              settings
            </span>
          </button>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-lg text-slate-500 transition hover:bg-slate-50"
            aria-label="Notifications"
          >
            <span className="material-symbols-outlined text-[22px]">
              notifications
            </span>
          </button>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 text-sm font-bold text-white shadow-md">
            SP
          </div>
        </div>
      </header>

      {showSidebar ? (
        <aside
          className={`fixed left-0 top-20 z-40 flex h-[calc(100vh-5rem)] w-[112px] flex-col border-r border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition-transform duration-300 lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <nav className="flex-1 space-y-2 px-3 py-5">
            {navigationItems.map((item) => {
              const isActive = item.label === activePage;

              return (
                <button
                  key={item.label}
                  type="button"
                  className={`flex w-full flex-col items-center gap-2 rounded-2xl px-2 py-3 text-center text-[11px] font-medium transition ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-semibold ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[22px]">
                      {item.icon}
                    </span>
                  </span>
                  <span>{item.label}</span>
                </button>
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

export default PortalLayout;
