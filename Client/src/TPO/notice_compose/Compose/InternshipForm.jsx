function Field({ label, children }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function inputClassName() {
  return "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-4 focus:ring-slate-200";
}

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

const yearOptions = ["All Years", "1", "2", "3", "4"];

export default function InternshipForm({
  formData,
  onFieldChange,
  onFileChange,
  onRemoveFile,
}) {
  return (
    <div className="space-y-5 rounded-[28px] border border-slate-200 bg-slate-50/60 p-5">
      <div>
        <p className="text-sm font-semibold text-slate-900">Internship Details</p>
        <p className="mt-1 text-sm text-slate-500">
          Capture internship specifics without the CTC field.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Title">
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

        <Field label="Company Name">
          <input
            type="text"
            value={formData.companyName}
            onChange={(event) =>
              onFieldChange("companyName", event.target.value)
            }
            placeholder="Example: Deloitte"
            className={inputClassName()}
          />
        </Field>

        <Field label="Role">
          <input
            type="text"
            value={formData.role}
            onChange={(event) => onFieldChange("role", event.target.value)}
            placeholder="Data Analyst Intern"
            className={inputClassName()}
          />
        </Field>

        <Field label="Location">
          <input
            type="text"
            value={formData.location}
            onChange={(event) => onFieldChange("location", event.target.value)}
            placeholder="Hyderabad"
            className={inputClassName()}
          />
        </Field>

        <Field label="CGPA">
          <input
            type="number"
            step="0.01"
            value={formData.minCgpa}
            onChange={(event) => onFieldChange("minCgpa", event.target.value)}
            placeholder="6.5"
            className={inputClassName()}
          />
        </Field>

        <Field label="Max Backlogs">
          <input
            type="number"
            value={formData.maxBacklogs}
            onChange={(event) => onFieldChange("maxBacklogs", event.target.value)}
            placeholder="1"
            className={inputClassName()}
          />
        </Field>

        <Field label="Stipend">
          <input
            type="number"
            step="0.01"
            value={formData.stipend}
            onChange={(event) => onFieldChange("stipend", event.target.value)}
            placeholder="15000"
            className={inputClassName()}
          />
        </Field>

        <Field label="Duration">
          <input
            type="text"
            value={formData.duration}
            onChange={(event) => onFieldChange("duration", event.target.value)}
            placeholder="6 months"
            className={inputClassName()}
          />
        </Field>

        <Field label="Deadline">
          <input
            type="date"
            value={formData.deadline}
            onChange={(event) => onFieldChange("deadline", event.target.value)}
            className={inputClassName()}
          />
        </Field>

        <Field label="Target Year">
          <select
            value={formData.year}
            onChange={(event) => onFieldChange("year", event.target.value)}
            className={inputClassName()}
          >
            {yearOptions.map((year) => (
              <option key={year} value={year === "All Years" ? "" : year}>
                {year}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Description">
        <textarea
          rows="5"
          value={formData.description}
          onChange={(event) => onFieldChange("description", event.target.value)}
          placeholder="Write a clear summary for students"
          className={`${inputClassName()} resize-none`}
        />
      </Field>

      <FileAttachmentsField
        files={formData.files}
        onFileChange={onFileChange}
        onRemoveFile={onRemoveFile}
      />

    </div>
  );
}
import FileAttachmentsField from "./FileAttachmentsField";
