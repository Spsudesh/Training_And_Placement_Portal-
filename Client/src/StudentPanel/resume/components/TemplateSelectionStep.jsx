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
              <div className="h-[360px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                <iframe
                  title={`${template.name} preview`}
                  src={`${template.previewUrl}#view=FitH&toolbar=0&navpanes=0&scrollbar=0`}
                  className="h-full w-full rounded-2xl border-0 bg-white"
                />
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
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open Reference PDF
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
