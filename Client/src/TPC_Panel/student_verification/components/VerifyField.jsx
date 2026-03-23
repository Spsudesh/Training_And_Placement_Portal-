import { CheckCircle2 } from "lucide-react";
import ViewDocumentButton from "./ViewDocumentButton";

export default function VerifyField({
  field,
  isVerified,
  isProfileVerified,
  onVerify,
}) {
  const isVerifiable = Boolean(field.verifiable);
  const wrapperClass = isVerifiable
    ? isVerified || isProfileVerified
      ? "border-emerald-200 bg-emerald-50/90"
      : "border-amber-200 bg-amber-50/70"
    : "border-slate-200 bg-slate-50/80";

  return (
    <div className={`rounded-2xl border p-4 shadow-sm transition ${wrapperClass}`}>
      {isVerifiable ? (
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              {field.label}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <p className="font-medium text-slate-900">{field.value}</p>
              {field.meta ? (
                <p className="text-slate-500">{field.meta}</p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 xl:flex-nowrap">
            <ViewDocumentButton documentUrl={field.documentUrl} />
            {isVerified || isProfileVerified ? (
              <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white">
                <CheckCircle2 className="h-4 w-4" />
                Verified
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onVerify(field.id)}
                className="inline-flex items-center rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
              >
                Verify
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {field.label}
            </p>
            <p className="text-sm font-medium leading-6 text-slate-900">{field.value}</p>
          </div>
          {field.documentUrl ? (
            <div className="flex items-center">
              <ViewDocumentButton documentUrl={field.documentUrl} />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
