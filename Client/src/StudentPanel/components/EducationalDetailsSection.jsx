import {
  FieldGrid,
  SaveButton,
  SectionCard,
  SelectInput,
  TextInput,
  UploadRow,
} from "./FormUI";

const gapOptions = ["No", "Yes"];
const educationTrackOptions = [
  { label: "12th Student", value: "twelfth" },
  { label: "Diploma Student", value: "diploma" },
];
const entranceExamOptions = [
  { label: "CET", value: "cet" },
  { label: "JEE", value: "jee" },
];
const departmentOptions = [
  "Computer Engineering",
  "Computer Engineering and Information Technology",
  "Artificial Intelligence and Machine Learning",
  "Mechatronics Engineering",
  "Robotics Engineering",
  "Mechanical Engineering",
  "Electrical Engineering",
  "Civil Engineering",
];

function EducationalDetailsSection({
  data,
  onFieldChange,
  onFileChange,
  onSave,
  isSaved,
  onDeadBacklogChange,
  onAddDeadBacklog,
  onRemoveDeadBacklog,
}) {
  const selectedTrack =
    data.educationTrack ||
    (data.diplomaInstitute || data.diplomaMarks || data.diplomaYear
      ? "diploma"
      : "twelfth");

  return (
    <SectionCard
      title="Educational Details"
      description="Provide your academic history and upload mark sheets where applicable."
      actions={<SaveButton onClick={onSave} saved={isSaved} />}
    >
      <div className="space-y-5">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
          Secondary Education
        </h3>
        <UploadRow
          label="10th Marksheet"
          name="marksheet10"
          fileName={data.marksheet10}
          onChange={onFileChange}
          accept=".pdf,.jpg,.jpeg,.png"
          helperText="Enter marks and upload scanned marksheet"
          required
        />
        <FieldGrid columns={3}>
          <TextInput label="10th Marks" name="marks10" value={data.marks10} onChange={onFieldChange} placeholder="Percentage / CGPA" required />
          <TextInput label="10th Maths Marks" name="mathsMarks10" value={data.mathsMarks10} onChange={onFieldChange} placeholder="Maths marks" required />
          <TextInput label="10th Board" name="board10" value={data.board10} onChange={onFieldChange} placeholder="Board name" required />
        </FieldGrid>
        <TextInput label="10th Passing Year" name="year10" value={data.year10} onChange={onFieldChange} placeholder="Year" required />
      </div>

      <div className="space-y-5">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
          Academic Path After 10th
        </h3>
        <SelectInput
          label="Select Education Path"
          name="educationTrack"
          value={selectedTrack}
          onChange={onFieldChange}
          options={educationTrackOptions}
          placeholder="Choose 12th or Diploma"
          required
        />

        {selectedTrack === "diploma" ? (
          <div className="space-y-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Diploma Details
            </h3>
            <UploadRow
              label="Diploma Marksheet"
              name="diplomaMarksheet"
              fileName={data.diplomaMarksheet}
              onChange={onFileChange}
              accept=".pdf,.jpg,.jpeg,.png"
              helperText="Upload diploma marksheet"
              required
            />
            <FieldGrid columns={3}>
              <TextInput label="Diploma Institute" name="diplomaInstitute" value={data.diplomaInstitute} onChange={onFieldChange} placeholder="Institute name" required />
              <TextInput label="Diploma Percentage" name="diplomaMarks" value={data.diplomaMarks} onChange={onFieldChange} placeholder="Percentage / CGPA" required />
              <TextInput label="Diploma Passing Year" name="diplomaYear" value={data.diplomaYear} onChange={onFieldChange} placeholder="Year" required />
            </FieldGrid>
          </div>
        ) : (
          <div className="space-y-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Higher Secondary Education
            </h3>
            <UploadRow
              label="12th Marksheet"
              name="marksheet12"
              fileName={data.marksheet12}
              onChange={onFileChange}
              accept=".pdf,.jpg,.jpeg,.png"
              helperText="Upload 12th standard marksheet"
              required
            />
            <FieldGrid columns={3}>
              <TextInput label="12th Marks" name="marks12" value={data.marks12} onChange={onFieldChange} placeholder="Percentage / CGPA" required />
              <TextInput label="12th Maths Marks" name="mathsMarks12" value={data.mathsMarks12} onChange={onFieldChange} placeholder="Maths marks" required />
              <TextInput label="12th Board" name="board12" value={data.board12} onChange={onFieldChange} placeholder="Board name" required />
            </FieldGrid>
            <TextInput label="12th Passing Year" name="year12" value={data.year12} onChange={onFieldChange} placeholder="Year" required />

            <FieldGrid columns={2}>
              <SelectInput
                label="Entrance Exam"
                name="entranceExamType"
                value={data.entranceExamType}
                onChange={onFieldChange}
                options={entranceExamOptions}
                placeholder="Select JEE or CET"
              />
              <TextInput
                label={`${data.entranceExamType ? data.entranceExamType.toUpperCase() : "Entrance Exam"} Score`}
                name="entranceExamScore"
                value={data.entranceExamScore}
                onChange={onFieldChange}
                placeholder="Enter score"
              />
            </FieldGrid>

            {data.entranceExamType ? (
              <UploadRow
                label={`${data.entranceExamType.toUpperCase()} Score Card`}
                name="entranceExamCertificate"
                fileName={data.entranceExamCertificate}
                onChange={onFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
                helperText={`Upload ${data.entranceExamType.toUpperCase()} score card`}
              />
            ) : null}
          </div>
        )}
      </div>

      <div className="space-y-5">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
          Gap Information
        </h3>
        <FieldGrid columns={2}>
          <SelectInput
            label="Academic Gap"
            name="gapStatus"
            value={data.gapStatus}
            onChange={onFieldChange}
            options={gapOptions}
            placeholder="Select gap status"
          />
          <TextInput
            label="Gap Reason"
            name="gapReason"
            value={data.gapReason}
            onChange={onFieldChange}
            placeholder="Mention the reason if gap is applicable"
          />
        </FieldGrid>

        {data.gapStatus === "Yes" ? (
          <UploadRow
            label="Gap Certificate"
            name="gapCertificate"
            fileName={data.gapCertificate}
            onChange={onFileChange}
            accept=".pdf,.jpg,.jpeg,.png"
            helperText="Upload gap certificate or supporting document"
          />
        ) : (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
            Select "Yes" in Academic Gap to upload a gap certificate.
          </div>
        )}
      </div>

      <div className="space-y-5">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
          Current Degree Details
        </h3>
        <SelectInput
          label="Department"
          name="department"
          value={data.department}
          onChange={onFieldChange}
          options={departmentOptions}
          placeholder="Select department"
          required
        />
        <FieldGrid columns={3}>
          <TextInput label="Current CGPA" name="cgpa" value={data.cgpa} onChange={onFieldChange} placeholder="CGPA" required />
          <TextInput label="Percentage" name="percentage" value={data.percentage} onChange={onFieldChange} placeholder="Auto calculated percentage" disabled hint="Calculated automatically from current CGPA." required />
          <TextInput label="Active Backlogs" name="activeBacklogs" value={data.activeBacklogs} onChange={onFieldChange} placeholder="Number of active backlogs" required />
          <TextInput label="Year of Passing" name="graduationYear" value={data.graduationYear} onChange={onFieldChange} placeholder="Passing year" required />
        </FieldGrid>

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Dead Backlogs</h4>
              <p className="mt-1 text-xs text-slate-500">
                Add semester-wise cleared backlog count, if any.
              </p>
            </div>
            <button
              type="button"
              onClick={onAddDeadBacklog}
              className="inline-flex items-center justify-center rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
            >
              Add Semester
            </button>
          </div>

          {(data.deadBacklogs ?? []).map((entry, index) => (
            <div key={`${entry.semester}-${index}`} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
              <TextInput
                label="Semester"
                name="semester"
                value={entry.semester}
                onChange={(event) => onDeadBacklogChange?.(index, event)}
                placeholder="Semester number"
              />
              <TextInput
                label="No. of Dead Backlogs"
                name="count"
                value={entry.count}
                onChange={(event) => onDeadBacklogChange?.(index, event)}
                placeholder="Count"
              />
              <button
                type="button"
                onClick={() => onRemoveDeadBacklog?.(index)}
                disabled={(data.deadBacklogs ?? []).length === 1}
                className="inline-flex items-center justify-center rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

export default EducationalDetailsSection;
