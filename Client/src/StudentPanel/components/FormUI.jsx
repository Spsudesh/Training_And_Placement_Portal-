import { useEffect, useState } from "react";

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

function isImageFile(fileName, fileType = "") {
  const normalizedType = String(fileType).toLowerCase();
  const normalizedName = String(fileName || "").toLowerCase();

  return (
    normalizedType.startsWith("image/") ||
    [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"].some((extension) =>
      normalizedName.endsWith(extension)
    )
  );
}

function FilePreviewModal({ fileUrl, fileLabel, fileType, onClose }) {
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const imagePreview = isImageFile(fileLabel, fileType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4">
      <div className="relative flex h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-2xl font-semibold text-slate-700 shadow-lg transition hover:bg-slate-100"
          aria-label="Close preview"
        >
          ×
        </button>

        <div className="border-b border-slate-200 px-6 py-4 pr-20">
          <p className="text-sm font-semibold text-slate-900">File Preview</p>
          <p className="mt-1 truncate text-sm text-slate-500">
            {fileLabel || "Uploaded file"}
          </p>
        </div>

        <div className="flex flex-1 items-center justify-center overflow-auto bg-slate-100 p-4">
          {imagePreview ? (
            <div className="flex h-full w-full items-center justify-center rounded-2xl bg-white p-3">
              <img
                src={fileUrl}
                alt={fileLabel || "Preview"}
                className="block max-h-full max-w-full rounded-2xl object-contain shadow-sm"
              />
            </div>
          ) : (
            <iframe
              src={fileUrl}
              title={fileLabel || "File preview"}
              className="h-full w-full rounded-2xl border border-slate-200 bg-white"
            />
          )}
        </div>
      </div>
    </div>
  );
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

function UploadRow({ label, name, fileName, onChange, accept, helperText, required = false }) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const fileLabel =
    typeof fileName === "object" && fileName !== null
      ? fileName.name
      : fileName;
  const fileUrl =
    typeof fileName === "object" && fileName !== null ? fileName.url : "";
  const fileType =
    typeof fileName === "object" && fileName !== null ? fileName.type : "";

  return (
    <>
      <div className="grid gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 md:grid-cols-[1.2fr_1.6fr_auto_auto] md:items-center">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <span>{label}</span>
            {required ? <span className="text-red-600">*</span> : null}
          </div>
          {helperText ? (
            <p className="mt-1 text-xs text-slate-500">{helperText}</p>
          ) : null}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
          {fileLabel || "No file chosen"}
        </div>
        {fileUrl ? (
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
          >
            View
          </button>
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

      {isPreviewOpen ? (
        <FilePreviewModal
          fileUrl={fileUrl}
          fileLabel={fileLabel}
          fileType={fileType}
          onClose={() => setIsPreviewOpen(false)}
        />
      ) : null}
    </>
  );
}

function EntryCard({ title, subtitle, children, headerActions, onRemove, disableRemove }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
      <div className="mb-4 flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {headerActions}
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
      disabled={saved}
      className={`inline-flex min-w-[170px] items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition ${
        saved
          ? "bg-emerald-600 text-white hover:bg-emerald-700"
          : "bg-blue-900 text-white hover:bg-blue-800"
      } ${saved ? "cursor-not-allowed opacity-80" : ""}`}
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
