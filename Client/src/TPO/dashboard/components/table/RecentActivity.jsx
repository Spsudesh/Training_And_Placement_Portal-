const statusClasses = {
  Scheduled: "bg-amber-100 text-amber-700",
  "In Review": "bg-sky-100 text-sky-700",
  Completed: "bg-emerald-100 text-emerald-700",
  Updated: "bg-slate-200 text-slate-700",
};

export default function RecentActivity({ data }) {
  return (
    <section className="rounded-[28px] border border-slate-200/70 bg-white p-6 shadow-lg shadow-slate-200/60">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">Recent Activity</p>
          <p className="mt-1 text-sm text-slate-500">
            Latest drive and placement updates for the TPO team
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left">
          <thead>
            <tr className="text-xs uppercase tracking-[0.2em] text-slate-400">
              <th className="pb-4 font-semibold">Company</th>
              <th className="pb-4 font-semibold">Activity</th>
              <th className="pb-4 font-semibold">Department</th>
              <th className="pb-4 font-semibold">Status</th>
              <th className="pb-4 font-semibold">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
            {data.map((item) => (
              <tr key={item.id} className="transition hover:bg-slate-50/80">
                <td className="py-4 font-semibold text-slate-900">{item.company}</td>
                <td className="py-4">{item.event}</td>
                <td className="py-4">{item.department}</td>
                <td className="py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      statusClasses[item.status] ?? "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="py-4 text-slate-500">{item.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

