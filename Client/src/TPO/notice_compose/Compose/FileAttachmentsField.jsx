function getFileName(item) {
  if (item?.name) {
    return item.name;
  }

  if (item?.file instanceof File) {
    return item.file.name;
  }

  if (item?.url) {
    try {
      const url = new URL(item.url);
      return decodeURIComponent(url.pathname.split("/").pop() || "Attachment");
    } catch {
      return "Attachment";
    }
  }

  return "Attachment";
}

export default function FileAttachmentsField({
  files = [],
  onFileChange,
  onRemoveFile,
  label = "File Upload",
  hint = "Optional",
}) {
  return (
    <label className="block space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-xs text-slate-400">{hint}</span>
      </div>

      <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 p-4">
        <input
          type="file"
          multiple
          onChange={(event) => onFileChange(Array.from(event.target.files ?? []))}
          className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800"
        />

        {files.length > 0 ? (
          <div className="mt-4 space-y-3">
            {files.map((item, index) => (
              <div
                key={`${getFileName(item)}-${index}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {getFileName(item)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.open(item.url, "_blank", "noopener,noreferrer,width=1100,height=800")}
                    disabled={!item.url}
                    className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-50 disabled:cursor-not-allowed disabled:text-slate-400"
                  >
                    View
                  </button>

                  <button
                    type="button"
                    onClick={() => onRemoveFile(index)}
                    className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-xs text-slate-500">No files selected</p>
        )}
      </div>
    </label>
  );
}
