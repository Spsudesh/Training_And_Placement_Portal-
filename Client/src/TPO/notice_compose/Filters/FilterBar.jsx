import { noticeDepartmentOptions } from "../Compose/noticeTargetOptions";

const typeOptions = [
  { label: "All Types", value: "all" },
  { label: "Announcement", value: "announcement" },
  { label: "Placement Opportunity", value: "placement" },
  { label: "Internship", value: "internship" },
];

function inputClassName() {
  return "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200";
}

export default function FilterBar({ filters, onChange, onReset }) {
  return (
    <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-700">
            Smart Filters
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">Filter Section</h2>
          <p className="mt-2 text-sm text-slate-500">
            Narrow the manage table and feed by search, type, department, and date.
          </p>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Reset
        </button>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-4">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Search</span>
          <input
            type="text"
            value={filters.search}
            onChange={(event) => onChange("search", event.target.value)}
            placeholder="Search by title or description"
            className={inputClassName()}
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Filter by Type</span>
          <select
            value={filters.type}
            onChange={(event) => onChange("type", event.target.value)}
            className={inputClassName()}
          >
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">
            Filter by Department
          </span>
          <select
            value={filters.department}
            onChange={(event) => onChange("department", event.target.value)}
            className={inputClassName()}
          >
            {noticeDepartmentOptions.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Sort by Date</span>
          <select
            value={filters.sort}
            onChange={(event) => onChange("sort", event.target.value)}
            className={inputClassName()}
          >
            <option value="latest">Latest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </label>
      </div>
    </section>
  );
}
