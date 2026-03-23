import { Eye } from "lucide-react";
import StatusBadge from "./StatusBadge";

export default function StudentTable({ students, onView }) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-lg shadow-slate-200/60">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            <tr>
              <th className="px-6 py-4">PRN</th>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Department</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.length > 0 ? (
              students.map((student) => (
                <tr key={student.prn} className="transition hover:bg-slate-50/80">
                  <td className="px-6 py-4 font-semibold text-slate-900">{student.prn}</td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-slate-900">{student.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{student.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{student.department}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={student.status} />
                  </td>
                  <td className="px-6 py-4">
                    <button
                      type="button"
                      onClick={() => onView(student)}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                  No students matched the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
