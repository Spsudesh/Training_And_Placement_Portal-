export default function BlacklistModal({
  student,
  isOpen,
  onClose,
  onConfirm,
}) {
  if (!isOpen || !student) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
      <button
        type="button"
        aria-label="Close blacklist modal"
        onClick={onClose}
        className="absolute inset-0"
      />

      <div className="relative z-10 w-full max-w-lg rounded-[28px] border border-rose-200 bg-white p-6 shadow-2xl shadow-slate-900/20">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-600">
          Confirm Blacklist
        </p>
        <h3 className="mt-3 text-2xl font-semibold text-slate-900">
          Blacklist this student?
        </h3>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          This will mark <span className="font-semibold text-slate-900">{student.name}</span>{" "}
          ({student.prn}) as blacklisted in the local UI state and update the badge
          across the student management panel.
        </p>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700"
          >
            Confirm Blacklist
          </button>
        </div>
      </div>
    </div>
  );
}
