function formatDate(value) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const badgeClasses = {
  announcement: "bg-slate-100 text-slate-700",
  job: "bg-emerald-100 text-emerald-700",
  internship: "bg-amber-100 text-amber-700",
};

const typeLabels = {
  announcement: "Announcement",
  job: "Job Opportunity",
  internship: "Internship",
};

export default function PostTable({ posts, onView, onEdit, onDelete }) {
  if (!posts.length) {
    return (
      <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
        <p className="text-base font-semibold text-slate-800">No matching posts</p>
        <p className="mt-2 text-sm text-slate-500">
          Adjust filters or create a new post to populate the table.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Title
              </th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Type
              </th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Date
              </th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {posts.map((post) => (
              <tr key={post.id} className="transition hover:bg-slate-50/80">
                <td className="px-5 py-4">
                  <div>
                    <p className="font-semibold text-slate-900">{post.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{post.department}</p>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      badgeClasses[post.type]
                    }`}
                  >
                    {typeLabels[post.type]}
                  </span>
                </td>
                <td className="px-5 py-4 text-sm text-slate-600">
                  {formatDate(post.updatedAt || post.createdAt)}
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onView(post)}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit(post)}
                      className="rounded-xl border border-cyan-200 px-3 py-2 text-sm font-medium text-cyan-700 transition hover:bg-cyan-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(post.id)}
                      className="rounded-xl border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
