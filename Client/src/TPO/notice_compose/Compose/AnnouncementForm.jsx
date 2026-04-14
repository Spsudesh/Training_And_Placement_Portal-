import FileAttachmentsField from "./FileAttachmentsField";
import { getPassingYearOptions, noticeDepartmentOptions } from "./noticeTargetOptions";
import TargetMultiSelectField from "./TargetMultiSelectField";

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
  return "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-4 focus:ring-slate-200";
}

export default function AnnouncementForm({
  formData,
  onFieldChange,
  onFileChange,
  onRemoveFile,
}) {
  const passingYearOptions = getPassingYearOptions();

  return (
    <div className="grid gap-4 rounded-[28px] border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
      <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">Announcement Details</p>
          <p className="mt-1 text-sm text-slate-500">
            Share circulars and updates in a simple notice format.
          </p>
        </div>
        <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
          Section 1
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-12">
          <Field label="Title" hint="Required">
            <input
              type="text"
              value={formData.title}
              onChange={(event) => onFieldChange("title", event.target.value)}
              placeholder="Enter post title"
              className={inputClassName()}
            />
          </Field>
        </div>

        <div className="lg:col-span-7">
          <TargetMultiSelectField
            label="Target Departments"
            value={formData.department}
            options={noticeDepartmentOptions}
            allLabel="All Departments"
            emptySerializedValue="All Departments"
            onChange={(value) => onFieldChange("department", value)}
            addPlaceholder="Select department to add"
            emptyLabel="All Departments"
          />
        </div>

        <div className="lg:col-span-5">
          <TargetMultiSelectField
            label="Target Passing Years"
            value={formData.year}
            options={passingYearOptions}
            allLabel="All Batches"
            emptySerializedValue=""
            onChange={(value) => onFieldChange("year", value)}
            addPlaceholder="Select passing year to add"
            emptyLabel="All Batches"
          />
        </div>

        <div className="lg:col-span-12">
          <Field label="Description" hint="Required">
            <textarea
              rows="4"
              value={formData.description}
              onChange={(event) => onFieldChange("description", event.target.value)}
              placeholder="Write a clear summary for students"
              className={`${inputClassName()} resize-none`}
            />
          </Field>
        </div>

        <div className="lg:col-span-12">
          <FileAttachmentsField
            files={formData.files}
            onFileChange={onFileChange}
            onRemoveFile={onRemoveFile}
          />
        </div>
      </div>
    </div>
  );
}
