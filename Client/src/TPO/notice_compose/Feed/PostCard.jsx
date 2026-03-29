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

export default function PostCard({ post }) {
  return (
    <article className="group rounded-[30px] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/60 transition duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-300/50">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            badgeClasses[post.type]
          }`}
        >
          {typeLabels[post.type]}
        </span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          {post.department}{post.year ? ` | Year ${post.year}` : ""}
        </span>
        {post.status === "draft" ? (
          <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
            Draft
          </span>
        ) : null}
      </div>

      <h3 className="mt-4 text-xl font-semibold text-slate-900">{post.title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{post.description}</p>

      {post.type !== "announcement" ? (
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Company</p>
            <p className="mt-2 text-sm font-semibold text-slate-800">
              {post.companyName || "Not specified"}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Role</p>
            <p className="mt-2 text-sm font-semibold text-slate-800">
              {post.role || "Not specified"}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Eligibility
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-800">
              CGPA: {post.minCgpa || "-"} | Backlogs: {post.maxBacklogs || "-"}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Deadline</p>
            <p className="mt-2 text-sm font-semibold text-slate-800">
              {post.deadline || "Open until filled"}
            </p>
          </div>
        </div>
      ) : null}

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
          {new Date(post.updatedAt || post.createdAt).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </p>
        {post.attachmentUrl ? (
          <a
            href={post.attachmentUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            View Attachment
          </a>
        ) : (
          <span className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-400">
            No Attachment
          </span>
        )}
      </div>
    </article>
  );
}
