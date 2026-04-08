import { Search } from "lucide-react";

export default function FilterBar({
  filters,
  years,
  departments,
  onChange,
  onReset,
}) {
  return (
    <section className="rounded-[30px] border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-200/60">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-600">
            Student Filters
          </p>
         
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Filter by year, department, or search directly by student name and PRN.
          </p>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          Reset Filters
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="text-sm font-medium text-slate-700">
          Year
          <select
            value={filters.year}
            onChange={(event) => onChange("year", event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-cyan-500"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-slate-700">
          Department
          <select
            value={filters.department}
            onChange={(event) => onChange("department", event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-cyan-500"
          >
            {departments.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-slate-700">
          Search
          <div className="relative mt-2">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={filters.search}
              onChange={(event) => onChange("search", event.target.value)}
              placeholder="Search by name or PRN"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-cyan-500"
            />
          </div>
        </label>
      </div>
    </section>
  );
}
