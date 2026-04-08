import { useEffect } from "react";

function ProfileActionButton({ label, variant = "update", onClick }) {
  const styles =
    variant === "add"
      ? "bg-blue-700 text-white hover:bg-blue-800"
      : "border border-blue-200 text-blue-700 hover:bg-blue-50";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition ${styles}`}
    >
      <span className="material-symbols-outlined mr-2 text-[18px]">
        {variant === "add" ? "add" : "edit"}
      </span>
      {label}
    </button>
  );
}

function ProfileFieldList({ items, columns = 2 }) {
  const gridClass =
    columns === 3 ? "grid gap-4 md:grid-cols-3" : "grid gap-4 md:grid-cols-2";

  return (
    <div className={gridClass}>
      {items.map((item) => (
        <div key={item.label} className="space-y-1">
          <p className="text-sm font-medium text-slate-500">{item.label}</p>
          <p className="text-base text-slate-900">
            {item.value === null || item.value === undefined || item.value === ""
              ? "-"
              : item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function ProfileChipGroup({ title, items }) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      <div className="flex flex-wrap gap-2">
        {items.length ? (
          items.map((item) => (
            <span
              key={item}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700"
            >
              {item}
            </span>
          ))
        ) : (
          <span className="text-sm text-slate-500">No entries added yet.</span>
        )}
      </div>
    </div>
  );
}

function ProfileItemCard({ title, subtitle, meta, description, links = [] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-slate-900">{title}</h4>
          {subtitle ? <p className="mt-1 text-sm font-medium text-blue-700">{subtitle}</p> : null}
        </div>
        {meta ? (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
            {meta}
          </span>
        ) : null}
      </div>
      {description ? <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p> : null}
      {links.length ? (
        <div className="mt-3 flex flex-wrap gap-4">
          {links.map((link) => (
            <button
              key={link.label}
              type="button"
              onClick={link.onClick}
              disabled={!link.onClick}
              className="text-sm font-semibold text-blue-700 transition hover:text-blue-800"
            >
              {link.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
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

function isPdfFile(fileName, fileType = "") {
  const normalizedType = String(fileType).toLowerCase();
  const normalizedName = String(fileName || "").toLowerCase();

  return normalizedType.includes("pdf") || normalizedName.endsWith(".pdf");
}

function ProfileDocumentPreviewModal({
  fileUrl,
  sourceUrl,
  fileLabel,
  fileType,
  onClose,
}) {
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
  const pdfPreview = isPdfFile(fileLabel, fileType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4">
      <div className="relative flex h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-2xl font-semibold text-slate-700 shadow-lg transition hover:bg-slate-100"
          aria-label="Close preview"
        >
          x
        </button>

        <div className="border-b border-slate-200 px-6 py-4 pr-20">
          <p className="text-sm font-semibold text-slate-900">Document Preview</p>
          <p className="mt-1 truncate text-sm text-slate-500">
            {fileLabel || "Document"}
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                window.open(sourceUrl || fileUrl, "_blank", "noopener,noreferrer")
              }
              className="inline-flex items-center rounded-xl border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
            >
              Open in New Tab
            </button>
            <a
              href={sourceUrl || fileUrl}
              target="_blank"
              rel="noreferrer"
              download
              className="inline-flex items-center rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Download
            </a>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center overflow-auto bg-slate-100 p-4">
          {imagePreview ? (
            <div className="flex h-full w-full items-center justify-center rounded-2xl bg-white p-3">
              <img
                src={fileUrl}
                alt={fileLabel || "Preview"}
                className="rounded-2xl object-contain shadow-sm"
                style={{ maxHeight: "85vh", maxWidth: "100%", height: "auto", width: "auto" }}
              />
            </div>
          ) : pdfPreview ? (
            <object
              data={fileUrl}
              type="application/pdf"
              className="h-full w-full rounded-2xl border border-slate-200 bg-white"
            >
              <div className="flex h-full flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <p className="max-w-md text-sm leading-6 text-slate-600">
                  PDF preview is not available in this browser view. Use the buttons above to open or download the document.
                </p>
              </div>
            </object>
          ) : (
            <iframe
              src={fileUrl}
              title={fileLabel || "Document preview"}
              className="h-full w-full rounded-2xl border border-slate-200 bg-white"
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ProfileSection({
  id,
  title,
  description,
  actionLabel,
  actionVariant = "update",
  onAction,
  statusLabel,
  children,
}) {
  const isVerifiedStatus = String(statusLabel || "").toLowerCase() === "verified";

  return (
    <section id={id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-2xl font-bold text-slate-900">{title}</h3>
            {statusLabel ? (
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${
                  isVerifiedStatus
                    ? "bg-blue-50 text-blue-700"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                {statusLabel}
              </span>
            ) : null}
          </div>
          {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p> : null}
        </div>
        {actionLabel ? (
          <ProfileActionButton label={actionLabel} variant={actionVariant} onClick={onAction} />
        ) : null}
      </div>

      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

export {
  ProfileDocumentPreviewModal,
  ProfileChipGroup,
  ProfileFieldList,
  ProfileItemCard,
  ProfileSection,
};
