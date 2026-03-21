function StudentHome() {
  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-[90rem] space-y-6">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-blue-950 via-blue-900 to-cyan-800 px-6 py-8 text-white shadow-[0_20px_50px_rgba(15,23,42,0.18)]">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-100/80">
            Student Panel
          </p>
          <h1 className="mt-3 text-3xl font-bold">Welcome to your dashboard</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-blue-100/90">
            Your initial profile submission is complete. You can now explore the
            full student panel, track opportunities, and continue improving your
            placement profile from here.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
            <p className="text-sm font-semibold text-slate-500">Profile Status</p>
            <p className="mt-3 text-2xl font-bold text-emerald-600">Submitted</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Your onboarding form has been completed successfully.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
            <p className="text-sm font-semibold text-slate-500">Next Step</p>
            <p className="mt-3 text-2xl font-bold text-slate-900">Explore Panel</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Use the sidebar to access interviews, assessments, resume tools,
              and other student features.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
            <p className="text-sm font-semibold text-slate-500">Profile Updates</p>
            <p className="mt-3 text-2xl font-bold text-slate-900">Available Later</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              After onboarding, profile improvements and updates can be managed
              from the full panel experience.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentHome;
