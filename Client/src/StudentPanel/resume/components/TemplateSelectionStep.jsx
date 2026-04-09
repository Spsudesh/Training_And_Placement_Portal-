function TemplateMiniPreview({ template }) {
  const isSecond = template.id === "resume_02";

  if (isSecond) {
    return (
      <div className="h-full overflow-hidden rounded-2xl border border-slate-200 bg-white px-5 py-5">
        <div className="rounded-2xl bg-slate-900 px-4 py-5 text-white">
          <div className="mx-auto h-4 w-44 rounded-full bg-white/90" />
          <div className="mx-auto mt-3 h-2 w-28 rounded-full bg-cyan-200/70" />
          <div className="mx-auto mt-4 h-2 w-5/6 rounded-full bg-white/30" />
          <div className="mx-auto mt-1 h-2 w-2/3 rounded-full bg-white/25" />
        </div>
        <div className="mt-5 grid grid-cols-[1.05fr_0.95fr] gap-3">
          <div className="space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
              <div className="h-2 w-28 rounded-full bg-slate-700/80" />
              <div className="mt-2 h-2 rounded-full bg-slate-200" />
              <div className="mt-1 h-2 w-5/6 rounded-full bg-slate-200" />
              <div className="mt-1 h-2 w-3/4 rounded-full bg-slate-200" />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
              <div className="h-2 w-24 rounded-full bg-slate-700/80" />
              <div className="mt-2 h-10 rounded-2xl bg-slate-200" />
              <div className="mt-2 h-2 rounded-full bg-slate-200" />
            </div>
          </div>
          <div className="space-y-3">
            {(template.sections || []).slice(2, 6).map((section) => (
              <div key={section} className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
                <div className="h-2 w-24 rounded-full bg-cyan-300" />
                <div className="mt-2 h-2 rounded-full bg-slate-200" />
                <div className="mt-1 h-2 w-4/5 rounded-full bg-slate-200" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden rounded-2xl border border-slate-200 bg-white px-5 py-5">
      <div className="border-b-2 border-slate-900 pb-4">
        <div className="h-4 w-48 rounded-full bg-slate-800" />
        <div className="mt-2 h-2 w-40 rounded-full bg-slate-300" />
        <div className="mt-4 h-2 rounded-full bg-slate-200" />
        <div className="mt-1 h-2 w-5/6 rounded-full bg-slate-200" />
      </div>
      <div className="mt-5 space-y-3">
        {(template.sections || []).slice(0, 6).map((section) => (
          <div key={section}>
            <div className="h-2 w-32 rounded-full bg-slate-700/80" />
            <div className="mt-2 h-2 rounded-full bg-slate-200" />
            <div className="mt-1 h-2 w-11/12 rounded-full bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TemplateSelectionStep({
  templates = [],
  selectedTemplateCode = "",
  onSelectTemplate,
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {templates.map((template) => {
        const isSelected = selectedTemplateCode === template.id;

        return (
          <article
            key={template.id}
            className={`overflow-hidden rounded-[28px] border bg-white shadow-[0_14px_34px_rgba(15,23,42,0.06)] transition ${
              isSelected
                ? "border-cyan-400 ring-2 ring-cyan-100"
                : "border-slate-200 hover:border-cyan-200"
            }`}
          >
            <div className="border-b border-slate-200 bg-slate-50/70 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                Template Choice
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">{template.name}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{template.description}</p>
            </div>

            <div className="p-5">
              <div className="h-[360px] rounded-2xl bg-slate-100">
                <TemplateMiniPreview template={template} />
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Template Structure
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(template.sections || []).map((section) => (
                    <span
                      key={section}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600"
                    >
                      {section}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href={template.previewUrl}
                  className="inline-flex rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Open Reference File
                </a>
                <button
                  type="button"
                  onClick={() => onSelectTemplate(template.id)}
                  className={`inline-flex rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                    isSelected
                      ? "bg-cyan-600 text-white hover:bg-cyan-700"
                      : "border border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"
                  }`}
                >
                  {isSelected ? "Selected" : "Choose Template"}
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
