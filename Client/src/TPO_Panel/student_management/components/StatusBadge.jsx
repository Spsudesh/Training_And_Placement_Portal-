const statusStyles = {
  Verified: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  Pending: "border border-amber-200 bg-amber-50 text-amber-700",
  Blacklisted: "border border-rose-200 bg-rose-50 text-rose-700",
};

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
        statusStyles[status] || "border border-slate-200 bg-slate-50 text-slate-600"
      }`}
    >
      {status}
    </span>
  );
}
