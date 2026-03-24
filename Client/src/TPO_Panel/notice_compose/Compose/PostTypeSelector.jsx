const postTypes = [
  {
    value: "announcement",
    label: "Announcement",
    description: "Share circulars, campus updates, and general notices.",
  },
  {
    value: "job",
    label: "Placement Opportunity",
    description: "Publish placement drives and full-time hiring updates.",
  },
  {
    value: "internship",
    label: "Internship Opportunity",
    description: "Post internship openings and seasonal opportunities.",
  },
];

export default function PostTypeSelector({ value, onChange }) {
  return (
    <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
      <div className="relative px-5 py-5 sm:px-6 sm:py-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(15,23,42,0.1),_transparent_26%),radial-gradient(circle_at_left,_rgba(100,116,139,0.08),_transparent_32%),linear-gradient(135deg,_#ffffff_0%,_#f8fafc_50%,_#f1f5f9_100%)]" />

        <div className="relative space-y-4">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-700">
              Post Type
            </p>
            <h3 className="mt-2 text-2xl font-bold text-slate-900">
              Choose what you want to publish
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Click one option and only that form will appear below, so the TPO can work faster without extra sections on screen.
            </p>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            {postTypes.map((type) => {
              const isActive = value === type.value;

              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => onChange(type.value)}
                  className={`rounded-[28px] border p-5 text-left transition duration-200 ${
                    isActive
                      ? "border-slate-900 bg-slate-900 shadow-lg shadow-slate-300/70"
                      : "border-slate-200 bg-white/90 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p
                      className={`text-base font-semibold ${
                        isActive ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {type.label}
                    </p>
                    {isActive ? (
                      <span className="rounded-full bg-emerald-400 px-3 py-1 text-xs font-semibold text-slate-950">
                        Selected
                      </span>
                    ) : null}
                  </div>

                  <p className={`mt-3 text-sm leading-6 ${isActive ? "text-slate-300" : "text-slate-500"}`}>
                    {type.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
