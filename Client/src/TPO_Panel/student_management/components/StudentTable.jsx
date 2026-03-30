import StatusBadge from "./StatusBadge";

export default function StudentTable({
  students,
  isLoading,
  errorMessage,
  onView,
  onBlacklist,
}) {
  return (
    <section className="overflow-hidden rounded-[30px] border border-slate-200/80 bg-white shadow-lg shadow-slate-200/60">
      <div className="border-b border-slate-100 px-6 py-5">
        <h3 className="text-xl font-semibold text-slate-900">Student Directory</h3>
        <p className="mt-1 text-sm text-slate-500">
          Review students, open complete profiles, and manage blacklist status.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50/80">
            <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              <th className="px-6 py-4">PRN</th>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Department</th>
              <th className="px-6 py-4">Year</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan="6" className="px-6 py-10 text-center text-sm text-slate-500">
                  Loading students from the database...
                </td>
              </tr>
            ) : errorMessage ? (
              <tr>
                <td colSpan="6" className="px-6 py-10 text-center text-sm text-rose-600">
                  {errorMessage}
                </td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-10 text-center text-sm text-slate-500">
                  No students match the selected filters.
                </td>
              </tr>
            ) : (
              students.map((student) => {
                const isBlacklisted = student.status === "Blacklisted";

                return (
                  <tr key={student.prn} className="transition hover:bg-slate-50/80">
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">{student.prn}</td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{student.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{student.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{student.department}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{student.year}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={student.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => onView(student)}
                          className="rounded-xl bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => onBlacklist(student)}
                          disabled={isBlacklisted}
                          className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                            isBlacklisted
                              ? "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400"
                              : "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                          }`}
                        >
                          Blacklist
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
