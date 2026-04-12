function SelectionCard({
  itemId,
  selected,
  disabled,
  onToggle,
  title,
  subtitle,
  description,
}) {
  return (
    <label
      htmlFor={`resume-selection-${itemId}`}
      className={`block rounded-2xl border p-4 text-left transition ${
        selected
          ? "border-cyan-300 bg-cyan-50"
          : disabled
          ? "border-slate-200 bg-slate-50 opacity-70"
          : "border-slate-200 bg-white hover:border-cyan-200 hover:bg-slate-50"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <input
            id={`resume-selection-${itemId}`}
            type="checkbox"
            checked={selected}
            disabled={disabled}
            onChange={onToggle}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
          />
          <div>
            <p className="text-base font-semibold text-slate-900">{title}</p>
            {subtitle ? (
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">{subtitle}</p>
            ) : null}
            {description ? (
              <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
            ) : null}
          </div>
        </div>

        <span
          className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
            selected
              ? "bg-cyan-600 text-white"
              : disabled
              ? "bg-slate-200 text-slate-500"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {selected ? "Selected" : disabled ? "Limit" : "Select"}
        </span>
      </div>
    </label>
  );
}

export default function SectionSelectionStep({
  title,
  description,
  items = [],
  selectedIds = [],
  limit,
  onToggle,
  emptyText,
  getTitle,
  getSubtitle,
  getDescription,
}) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            Resume Builder
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
        </div>
        <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-semibold text-cyan-700">
          {selectedIds.length} / {limit} selected
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {items.length ? (
          items.map((item, index) => {
            const itemId = Number(item.id ?? index + 1);
            const isSelected = selectedIds.includes(itemId);
            const isDisabled = !isSelected && selectedIds.length >= limit;

            return (
              <SelectionCard
                key={`${itemId}-${getTitle(item)}`}
                itemId={itemId}
                selected={isSelected}
                disabled={isDisabled}
                onToggle={() => onToggle(itemId)}
                title={getTitle(item)}
                subtitle={getSubtitle?.(item) || ""}
                description={getDescription?.(item) || ""}
              />
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            {emptyText}
          </div>
        )}
      </div>
    </section>
  );
}
