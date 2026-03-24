const typeBadgeClasses = {
  announcement: "bg-slate-100 text-slate-700",
  job: "bg-emerald-100 text-emerald-700",
  internship: "bg-amber-100 text-amber-700",
};

const typeLabels = {
  announcement: "Announcement",
  job: "Job Opportunity",
  internship: "Internship",
};

function DetailRow({ label, value }) {
  if (!value) {
    return null;
  }

  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}

export default function PreviewCard({ formData, editMode }) {
  const attachmentLabel = formData.file?.name || formData.attachmentName;

  return (
    <div className="sticky top-24 rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Live Preview</p>
          <p className="mt-1 text-sm text-slate-500">
            Students will see updates here in real time.
          </p>
        </div>
        {editMode ? (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
            Editing
          </span>
        ) : null}
      </div>

      <div className="mt-6 overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-5 text-white">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              typeBadgeClasses[formData.type]
            }`}
          >
            {typeLabels[formData.type]}
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
            {formData.department || "All Departments"}
          </span>
        </div>

        <h3 className="mt-4 text-xl font-semibold">
          {formData.title || "Your post title will appear here"}
        </h3>
        <p className="mt-3 text-sm leading-6 text-white/75">
          {formData.description ||
            "Write a concise summary so students can quickly understand the opportunity or announcement."}
        </p>

        {attachmentLabel ? (
          <div className="mt-4 inline-flex rounded-full bg-white/10 px-3 py-2 text-xs text-white/80">
            Attachment: {attachmentLabel}
          </div>
        ) : null}
      </div>

      {formData.type !== "announcement" ? (
        <div className="mt-5 grid gap-3">
          <DetailRow label="Company" value={formData.companyName} />
          <DetailRow label="Role" value={formData.role} />
          <DetailRow label="Location" value={formData.location} />
          {formData.type === "job" ? (
            <DetailRow label="CTC" value={formData.ctc} />
          ) : null}
          <DetailRow
            label="Eligibility"
            value={
              formData.cgpa || formData.backlogs
                ? `CGPA: ${formData.cgpa || "-"} | Backlogs: ${
                    formData.backlogs || "-"
                  }`
                : ""
            }
          />
          <DetailRow label="Deadline" value={formData.deadline} />
        </div>
      ) : null}

      {formData.hiringProcess.some((stage) => stage.trim()) &&
      formData.type !== "announcement" ? (
        <div className="mt-5 rounded-[28px] border border-slate-200 p-4">
          <p className="text-sm font-semibold text-slate-900">Hiring Process</p>
          <div className="mt-3 space-y-2">
            {formData.hiringProcess
              .filter((stage) => stage.trim())
              .map((stage, index) => (
                <div
                  key={`${stage}-${index}`}
                  className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-600 text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <span className="text-sm text-slate-700">{stage}</span>
                </div>
              ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
