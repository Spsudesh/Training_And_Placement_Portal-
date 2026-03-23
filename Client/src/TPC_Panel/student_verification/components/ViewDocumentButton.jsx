import { ExternalLink, X } from "lucide-react";
import { useState } from "react";

export default function ViewDocumentButton({ documentUrl }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!documentUrl) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
      >
        View Document
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
          <div className="flex h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl shadow-slate-950/25">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Document Preview</p>
                <p className="text-xs text-slate-500">
                  Review the uploaded document inside this page.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={documentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open New Tab
                </a>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                  aria-label="Close document preview"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-100">
              <iframe
                src={documentUrl}
                title="Document Preview"
                className="h-full w-full border-0"
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
