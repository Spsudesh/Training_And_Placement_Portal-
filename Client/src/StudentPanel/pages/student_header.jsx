import { Bell, KeyRound, LogOut, Menu, Settings, UserRound } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchNotices } from "../../TPO/services/noticeApi";
import { getAuthenticatedUser } from "../../shared/authSession";

function formatRelativeTime(value) {
  if (!value) {
    return "Recently";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);

  if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

function buildProfileInitials(user, fallback = "SP") {
  const rawLabel = String(
    user?.fullName || user?.name || user?.email || user?.PRN || user?.prn || fallback,
  ).trim();

  if (!rawLabel) {
    return fallback;
  }

  const parts = rawLabel.split(/[\s@._-]+/).filter(Boolean);

  if (!parts.length) {
    return fallback;
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0] || "")
    .join("")
    .toUpperCase();
}

function getNoticeLabel(item) {
  return item.companyName || item.title || "Notice";
}

function Header({
  pageTitle = "Student Panel",
  showMenuButton = false,
  onMenuClick,
  profileInitials = "SP",
  onLogout,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const authenticatedUser = getAuthenticatedUser();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [latestNotices, setLatestNotices] = useState([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [notificationError, setNotificationError] = useState("");
  const settingsMenuRef = useRef(null);
  const notificationsMenuRef = useRef(null);

  const resolvedInitials = useMemo(
    () => buildProfileInitials(authenticatedUser, profileInitials),
    [authenticatedUser, profileInitials],
  );

  useEffect(() => {
    setIsSettingsOpen(false);
    setIsNotificationsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        settingsMenuRef.current &&
        !settingsMenuRef.current.contains(event.target)
      ) {
        setIsSettingsOpen(false);
      }

      if (
        notificationsMenuRef.current &&
        !notificationsMenuRef.current.contains(event.target)
      ) {
        setIsNotificationsOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsSettingsOpen(false);
        setIsNotificationsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadNotifications() {
      if (!isNotificationsOpen) {
        return;
      }

      setIsLoadingNotifications(true);
      setNotificationError("");

      try {
        const records = await fetchNotices("student", { status: "published" });

        if (!isMounted) {
          return;
        }

        const sortedRecords = [...records]
          .sort((firstItem, secondItem) => {
            const firstDate = new Date(firstItem.updatedAt || firstItem.createdAt || 0).getTime();
            const secondDate = new Date(secondItem.updatedAt || secondItem.createdAt || 0).getTime();
            return secondDate - firstDate;
          })
          .slice(0, 5);

        setLatestNotices(sortedRecords);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setLatestNotices([]);
        setNotificationError(
          error?.response?.data?.message || "Unable to load notifications right now.",
        );
      } finally {
        if (isMounted) {
          setIsLoadingNotifications(false);
        }
      }
    }

    loadNotifications();

    return () => {
      isMounted = false;
    };
  }, [isNotificationsOpen]);

  function openStudentDashboard() {
    navigate("/student-panel#notice-section");
    setIsNotificationsOpen(false);
  }

  function openStudentProfile() {
    navigate("/student-panel/profile");
    setIsSettingsOpen(false);
  }

  function openChangePasswordPage() {
    navigate("/student-panel/change-password");
    setIsSettingsOpen(false);
  }

  return (
    <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-slate-200 bg-white px-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:px-6 lg:px-8">
      <div className="flex items-center gap-4">
        {showMenuButton ? (
          <button
            type="button"
            onClick={onMenuClick}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-700 transition hover:bg-slate-50 lg:hidden"
          >
            <Menu className="h-[22px] w-[22px]" />
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
        <div className="relative" ref={settingsMenuRef}>
          <button
            type="button"
            onClick={() => {
              setIsSettingsOpen((currentValue) => !currentValue);
              setIsNotificationsOpen(false);
            }}
            className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border text-lg transition ${
              isSettingsOpen
                ? "border-slate-900 bg-slate-50 text-slate-900"
                : "border-slate-200 text-slate-500 hover:bg-slate-50"
            }`}
            aria-label="Settings"
            aria-expanded={isSettingsOpen}
          >
            <Settings className="h-[22px] w-[22px]" />
          </button>

          {isSettingsOpen ? (
            <div className="fixed right-0 top-20 z-40 w-72 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.16)]">
              <div className="border-b border-slate-100 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Account Settings
                </p>
              </div>

              <div className="p-2">
                <button
                  type="button"
                  onClick={openChangePasswordPage}
                  className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition hover:bg-slate-50"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                      <KeyRound className="h-5 w-5" />
                    </span>
                    <span className="block text-sm font-semibold text-slate-900">Forgot Password</span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={openStudentProfile}
                  className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition hover:bg-slate-50"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                      <UserRound className="h-5 w-5" />
                    </span>
                    <span className="block text-sm font-semibold text-slate-900">Edit Profile</span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsSettingsOpen(false);
                    onLogout?.();
                  }}
                  className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition hover:bg-rose-50"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                      <LogOut className="h-5 w-5" />
                    </span>
                    <span className="block text-sm font-semibold text-slate-900">Logout</span>
                  </span>
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="relative" ref={notificationsMenuRef}>
          <button
            type="button"
            onClick={() => {
              setIsNotificationsOpen((currentValue) => !currentValue);
              setIsSettingsOpen(false);
            }}
            className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border text-lg transition ${
              isNotificationsOpen
                ? "border-slate-900 bg-slate-50 text-slate-900"
                : "border-slate-200 text-slate-500 hover:bg-slate-50"
            }`}
            aria-label="Notifications"
            aria-expanded={isNotificationsOpen}
          >
            <Bell className="h-[22px] w-[22px]" />
          </button>

          {isNotificationsOpen ? (
            <div className="fixed right-0 top-20 z-40 w-[22rem] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.16)]">
              <div className="border-b border-slate-100 px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Notifications
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      Latest 5 published notices
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={openStudentDashboard}
                    className="text-sm font-semibold text-blue-600 transition hover:text-blue-700"
                  >
                    Read more
                  </button>
                </div>
              </div>

              <div className="max-h-[24rem] overflow-y-auto p-2">
                {isLoadingNotifications ? (
                  <div className="px-4 py-6 text-sm text-slate-500">
                    Loading notifications...
                  </div>
                ) : notificationError ? (
                  <div className="px-4 py-6 text-sm text-rose-600">
                    {notificationError}
                  </div>
                ) : latestNotices.length ? (
                  latestNotices.map((notice) => (
                    <button
                      key={notice.id}
                      type="button"
                      onClick={openStudentDashboard}
                      className="block w-full rounded-2xl px-4 py-3 text-left transition hover:bg-slate-50"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="min-w-0 truncate text-sm font-semibold text-slate-900">
                          {getNoticeLabel(notice)}
                        </p>
                        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                          {notice.type || "notice"}
                        </span>
                      </div>
                      <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
                        {formatRelativeTime(notice.updatedAt || notice.createdAt)}
                      </p>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-6 text-sm text-slate-500">
                    No new notices are available right now.
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 text-sm font-bold text-white shadow-md">
          {resolvedInitials}
        </div>
      </div>
    </header>
  );
}

export default Header;
