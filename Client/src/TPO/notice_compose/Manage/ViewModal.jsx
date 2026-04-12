const badgeClasses = {
  announcement: "bg-slate-100 text-slate-700",
  placement: "bg-slate-900 text-white",
  internship: "bg-emerald-100 text-emerald-800",
};

const typeLabels = {
  announcement: "Announcement",
  placement: "Placement Opportunity",
  internship: "Internship",
};

function InfoBlock({ label, value }) {
  if (!value) {
    return null;
  }

  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}

function formatTargets(post) {
  const departments = post.departments?.length ? post.departments.join(", ") : post.department;
  const batches = post.years?.length ? post.years.join(", ") : post.year;

  return `${departments || "All Departments"}${batches ? ` | Batch ${batches}` : ""}`;
}

export default function ViewModal({ post, onClose }) {
  if (!post) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[32px] bg-white p-6 shadow-2xl shadow-slate-950/20 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  badgeClasses[post.type]
                }`}
              >
                {typeLabels[post.type]}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {formatTargets(post)}
              </span>
            </div>
            <h3 className="mt-4 text-2xl font-bold text-slate-900">{post.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">{post.description}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        {post.type !== "announcement" ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <InfoBlock label="Company" value={post.companyName} />
            <InfoBlock label="Role" value={post.role} />
            <InfoBlock label="Location" value={post.location} />
            {post.type === "placement" ? <InfoBlock label="CTC" value={post.ctc} /> : null}
            {post.type === "internship" ? <InfoBlock label="Stipend" value={post.stipend} /> : null}
            {post.type === "internship" ? <InfoBlock label="Duration" value={post.duration} /> : null}
            <InfoBlock label="Min CGPA" value={post.minCgpa} />
            <InfoBlock label="Max Backlogs" value={post.maxBacklogs} />
            <InfoBlock label="Deadline" value={post.deadline} />
          </div>
        ) : null}

        {post.attachmentUrl ? (
          <div className="mt-6 rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-5 py-4">
            <p className="text-sm font-semibold text-slate-900">Attachment</p>
            <a
              href={post.attachmentUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex text-sm font-medium text-cyan-700 hover:text-cyan-800"
            >
              Open attached file
            </a>
          </div>
        ) : null}
      </div>
    </div>
  );
}
