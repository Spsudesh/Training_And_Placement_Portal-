import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

function TpoLayout({
  children,
  pageTitle = "TPO Dashboard",
  activePage = "Dashboard",
  showSidebar = true,
  onNavigate,
  onLogout,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <Topbar
        pageTitle={pageTitle}
        showMenuButton={showSidebar}
        onMenuClick={() => setSidebarOpen(true)}
        profileInitials="TP"
        onLogout={onLogout}
      />

      {showSidebar ? (
        <Sidebar
          activePage={activePage}
          mobileOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onNavigate={onNavigate}
        />
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

export default TpoLayout;
