function SectionCard({ title, description, children, actions }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
      <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-blue-50 to-cyan-50 px-6 py-5">
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        ) : null}
      </div>
      <div className="space-y-8 px-6 py-6">{children}</div>
      {actions ? (
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
          {actions}
        </div>
      ) : null}
    </div>
  );
}

function FieldGrid({ columns = 1, children }) {
  const gridClass =
    columns === 4
      ? "grid gap-4 md:grid-cols-2 xl:grid-cols-4"
      : columns === 3
      ? "grid gap-4 md:grid-cols-3"
      : columns === 2
      ? "grid gap-4 md:grid-cols-2"
      : "grid gap-4";

  return <div className={gridClass}>{children}</div>;
}

function FieldShell({ label, required = false, hint, children }) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
        <span>{label}</span>
        {required ? <span className="text-red-600">*</span> : null}
      </div>
      {children}
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </label>
  );
}

function inputClasses() {
  return "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100";
}

function TextInput({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
  disabled = false,
  hint,
}) {
  return (
    <FieldShell label={label} required={required} hint={hint}>
      <input
        className={`${inputClasses()} ${disabled ? "cursor-not-allowed bg-slate-100" : ""}`}
        type={type}
        name={name}
        value={value ?? ""}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
      />
    </FieldShell>
  );
}

function SelectInput({
  label,
  name,
  value,
  onChange,
  options,
  required = false,
  disabled = false,
  placeholder = "Select",
}) {
  return (
    <FieldShell label={label} required={required}>
      <select
        className={`${inputClasses()} ${disabled ? "cursor-not-allowed bg-slate-100" : ""}`}
        name={name}
        value={value ?? ""}
        onChange={onChange}
        disabled={disabled}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option
            key={typeof option === "object" ? option.value : option}
            value={typeof option === "object" ? option.value : option}
          >
            {typeof option === "object" ? option.label : option}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

function TextArea({ label, name, value, onChange, placeholder, rows = 4 }) {
  return (
    <FieldShell label={label}>
      <textarea
        className={inputClasses()}
        name={name}
        value={value ?? ""}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
      />
    </FieldShell>
  );
}

function UploadRow({ label, name, fileName, onChange, accept, helperText }) {
  const fileLabel =
    typeof fileName === "object" && fileName !== null
      ? fileName.name
      : fileName;
  const fileUrl =
    typeof fileName === "object" && fileName !== null ? fileName.url : "";

  return (
    <div className="grid gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 md:grid-cols-[1.2fr_1.6fr_auto_auto] md:items-center">
      <div>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        {helperText ? (
          <p className="mt-1 text-xs text-slate-500">{helperText}</p>
        ) : null}
      </div>
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
        {fileLabel || "No file chosen"}
      </div>
      {fileUrl ? (
        <a
          href={fileUrl}
          target="_self"
          className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
        >
          View
        </a>
      ) : (
        <div className="hidden md:block" />
      )}
      <label className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-blue-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800">
        Upload
        <input
          className="hidden"
          type="file"
          name={name}
          accept={accept}
          onChange={onChange}
        />
      </label>
    </div>
  );
}

function EntryCard({ title, subtitle, children, onRemove, disableRemove }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
      <div className="mb-4 flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
        </div>
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            disabled={disableRemove}
            className="inline-flex items-center justify-center rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Remove
          </button>
        ) : null}
      </div>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

function SaveButton({ onClick, saved, label = "Save & Continue" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-w-[170px] items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition ${
        saved
          ? "bg-emerald-600 text-white hover:bg-emerald-700"
          : "bg-blue-900 text-white hover:bg-blue-800"
      }`}
    >
      {saved ? "Saved" : label}
    </button>
  );
}

export {
  EntryCard,
  FieldGrid,
  SaveButton,
  SectionCard,
  SelectInput,
  TextArea,
  TextInput,
  UploadRow,
};
