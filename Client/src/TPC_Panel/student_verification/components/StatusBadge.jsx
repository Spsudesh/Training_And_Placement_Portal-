const badgeStyles = {
  Verified: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  Pending: "bg-amber-100 text-amber-700 ring-amber-200",
};

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
        badgeStyles[status] ?? badgeStyles.Pending
      }`}
    >
      {status}
    </span>
  );
}
