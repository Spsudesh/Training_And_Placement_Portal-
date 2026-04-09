export default function ResumeGenerationStep({
  resumeTitle,
  onResumeTitleChange,
  selectedTemplate,
  selectionSummary,
}) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
        Final Step
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-slate-900">Generate resume</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
        Review your selected template and optional sections, then generate a saved resume file on the server.
      </p>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
          <label className="text-sm font-medium text-slate-700">
            Resume Title
            <input
              value={resumeTitle}
              onChange={(event) => onResumeTitleChange(event.target.value)}
              placeholder="My Resume"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-cyan-500"
            />
          </label>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Selected Template
            </p>
            <p className="mt-2 text-base font-semibold text-slate-900">
              {selectedTemplate?.name || "No template selected"}
            </p>
            <p className="mt-1 text-sm text-slate-500">{selectedTemplate?.description || ""}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Included Sections
          </p>
          <div className="mt-4 space-y-3">
            {selectionSummary.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
              >
                <span className="font-medium text-slate-700">{item.label}</span>
                <span className="font-semibold text-slate-900">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
