import { Menu } from "lucide-react";

function Header({
  pageTitle = "TPO Panel",
  showMenuButton = true,
  onMenuClick,
  profileInitials = "TP",
  onLogout,
}) {
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
          <img
            src="/rit_logo.jpeg"
            alt="RIT logo"
            className="h-12 w-20 object-contain"
          />
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">
              Training & Placement Officer
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
          onClick={onLogout}
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          Logout
        </button>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-sky-400 to-blue-500 text-sm font-bold text-white shadow-md">
          {profileInitials}
        </div>
      </div>
    </header>
  );
}

export default Header;
