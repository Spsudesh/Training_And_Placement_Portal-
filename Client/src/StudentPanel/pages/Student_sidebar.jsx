import { useEffect, useState } from "react";
import {
  CircleHelp,
  ClipboardCheck,
  FileText,
  Home,
  Layers3,
  UserRound,
  Users,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import Header from "./student_header";
import {
  STUDENT_PROFILE_VERIFICATION_EVENT,
  STUDENT_PROFILE_VERIFIED_STORAGE_KEY,
} from "../profile/services/studentProfileApi";

const navigationItems = [
  { label: "Home", icon: Home, to: "/student-panel" },
  { label: "Job Profiles", icon: Layers3, to: "/student-panel/jobs" },
  { label: "My Profile", icon: UserRound, to: "/student-panel/profile" },
  { label: "ATS Resume", icon: FileText, to: "/student-panel/ats-resume" },
  { label: "Interviews", icon: Users, to: "/student-panel", fallback: true, requiresVerified: true },
  { label: "Assessments", icon: ClipboardCheck, to: "/student-panel", fallback: true, requiresVerified: true },
];

function StudentSidebar({
  children,
  pageTitle = "Student Panel",
  showSidebar = true,
  onLogout,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isProfileVerified, setIsProfileVerified] = useState(
    () => window.localStorage.getItem(STUDENT_PROFILE_VERIFIED_STORAGE_KEY) === "true",
  );

  useEffect(() => {
    const handleStorageSync = () => {
      setIsProfileVerified(
        window.localStorage.getItem(STUDENT_PROFILE_VERIFIED_STORAGE_KEY) === "true",
      );
    };

    window.addEventListener("storage", handleStorageSync);
    window.addEventListener(STUDENT_PROFILE_VERIFICATION_EVENT, handleStorageSync);
    handleStorageSync();

    return () => {
      window.removeEventListener("storage", handleStorageSync);
      window.removeEventListener(STUDENT_PROFILE_VERIFICATION_EVENT, handleStorageSync);
    };
  }, []);

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
              const Icon = item.icon;
              const isDisabled = item.requiresVerified && !isProfileVerified;
              const itemContent = (isActive = false) => (
                <>
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-semibold ${
                      item.fallback || isDisabled
                        ? "bg-slate-100 text-slate-300"
                        : isActive
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    <Icon className="h-[22px] w-[22px]" />
                  </span>
                  <span>{item.label}</span>
                  {item.fallback || isDisabled ? (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] text-slate-400">
                      {isDisabled ? "Locked" : "Soon"}
                    </span>
                  ) : null}
                </>
              );

              return (
                <NavLink
                  key={item.label}
                  to={isDisabled ? "/student-panel/profile" : item.to}
                  end={item.to === "/student-panel"}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex w-full flex-col items-center gap-2 rounded-2xl px-2 py-3 text-center text-[11px] font-medium transition ${
                      item.fallback || isDisabled
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

export default StudentSidebar;
