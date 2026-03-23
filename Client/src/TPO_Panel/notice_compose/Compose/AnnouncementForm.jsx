const departmentOptions = [
  "All Departments",
  "CSE",
  "IT",
  "ECE",
  "EEE",
  "Mechanical",
  "Civil",
  "MBA",
];

function Field({ label, children, hint }) {
  return (
    <label className="block space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        {hint ? <span className="text-xs text-slate-400">{hint}</span> : null}
      </div>
      {children}
    </label>
  );
}

function inputClassName() {
  return "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100";
}

export default function AnnouncementForm({
  formData,
  onFieldChange,
  onFileChange,
}) {
  return (
    <div className="grid gap-5 rounded-[28px] border border-slate-200 bg-slate-50/60 p-5">
      <div>
        <p className="text-sm font-semibold text-slate-900">Announcement Details</p>
        <p className="mt-1 text-sm text-slate-500">
          Share circulars and updates in a simple notice format.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Title" hint="Required">
          <input
            type="text"
            value={formData.title}
            onChange={(event) => onFieldChange("title", event.target.value)}
            placeholder="Enter post title"
            className={inputClassName()}
          />
        </Field>

        <Field label="Department">
          <select
            value={formData.department}
            onChange={(event) => onFieldChange("department", event.target.value)}
            className={inputClassName()}
          >
            {departmentOptions.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Description" hint="Required">
        <textarea
          rows="5"
          value={formData.description}
          onChange={(event) => onFieldChange("description", event.target.value)}
          placeholder="Write a clear summary for students"
          className={`${inputClassName()} resize-none`}
        />
      </Field>

      <Field label="File Upload" hint="Optional">
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 p-4">
          <input
            type="file"
            onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
            className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800"
          />
          <p className="mt-3 text-xs text-slate-500">
            {formData.attachmentName || formData.file?.name || "No file selected"}
          </p>
        </div>
      </Field>
    </div>
  );
}
