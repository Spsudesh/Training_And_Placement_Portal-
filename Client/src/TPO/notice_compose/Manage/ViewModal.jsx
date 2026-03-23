const badgeClasses = {
  announcement: "bg-slate-100 text-slate-700",
  job: "bg-slate-900 text-white",
  internship: "bg-emerald-100 text-emerald-800",
};

const typeLabels = {
  announcement: "Announcement",
  job: "Job Opportunity",
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
                {post.department}
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
            {post.type === "job" ? <InfoBlock label="CTC" value={post.ctc} /> : null}
            <InfoBlock label="CGPA" value={post.cgpa} />
            <InfoBlock label="Backlogs" value={post.backlogs} />
            <InfoBlock label="Deadline" value={post.deadline} />
          </div>
        ) : null}

        {post.hiringProcess?.length && post.type !== "announcement" ? (
          <div className="mt-6 rounded-[28px] border border-slate-200 p-5">
            <p className="text-sm font-semibold text-slate-900">Hiring Process</p>
            <div className="mt-4 space-y-3">
              {post.hiringProcess.map((stage, index) => (
                <div
                  key={`${stage}-${index}`}
                  className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                    {index + 1}
                  </span>
                  <span className="text-sm text-slate-700">{stage}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {post.attachmentName ? (
          <div className="mt-6 rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-5 py-4">
            <p className="text-sm font-semibold text-slate-900">Attachment</p>
            <p className="mt-2 text-sm text-slate-600">{post.attachmentName}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
