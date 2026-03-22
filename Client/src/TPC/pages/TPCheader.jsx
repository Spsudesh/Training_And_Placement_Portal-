function Header({
  pageTitle = "TPC Panel",
  showMenuButton = true,
  onMenuClick,
  profileInitials = "TC",
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
            <span className="material-symbols-outlined text-[22px] leading-none">
              menu
            </span>
          </button>
        ) : null}

        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-500 text-base font-bold text-white shadow-lg">
            TC
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">
              Training & Placement Coordinator
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
        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-lg text-slate-500 transition hover:bg-slate-50"
          aria-label="Search"
        >
          <span className="material-symbols-outlined text-[22px]">search</span>
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
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400 via-indigo-400 to-violet-500 text-sm font-bold text-white shadow-md">
          {profileInitials}
        </div>
      </div>
    </header>
  );
}

export default Header;
