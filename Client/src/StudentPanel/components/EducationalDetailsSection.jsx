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

function EducationalDetailsSection({ data, onFieldChange, onFileChange, onSave, isSaved }) {
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
        />
        <FieldGrid columns={3}>
          <TextInput label="10th Marks" name="marks10" value={data.marks10} onChange={onFieldChange} placeholder="Percentage / CGPA" />
          <TextInput label="10th Board" name="board10" value={data.board10} onChange={onFieldChange} placeholder="Board name" />
          <TextInput label="10th Passing Year" name="year10" value={data.year10} onChange={onFieldChange} placeholder="Year" />
        </FieldGrid>
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
            />
            <FieldGrid columns={3}>
              <TextInput label="Diploma Institute" name="diplomaInstitute" value={data.diplomaInstitute} onChange={onFieldChange} placeholder="Institute name" />
              <TextInput label="Diploma Percentage" name="diplomaMarks" value={data.diplomaMarks} onChange={onFieldChange} placeholder="Percentage / CGPA" />
              <TextInput label="Diploma Passing Year" name="diplomaYear" value={data.diplomaYear} onChange={onFieldChange} placeholder="Year" />
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
            />
            <FieldGrid columns={3}>
              <TextInput label="12th Marks" name="marks12" value={data.marks12} onChange={onFieldChange} placeholder="Percentage / CGPA" />
              <TextInput label="12th Board" name="board12" value={data.board12} onChange={onFieldChange} placeholder="Board name" />
              <TextInput label="12th Passing Year" name="year12" value={data.year12} onChange={onFieldChange} placeholder="Year" />
            </FieldGrid>
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
        />
        <FieldGrid columns={3}>
          <TextInput label="Current CGPA" name="cgpa" value={data.cgpa} onChange={onFieldChange} placeholder="CGPA" />
          <TextInput label="Backlogs" name="backlogs" value={data.backlogs} onChange={onFieldChange} placeholder="Number of active backlogs" />
          <TextInput label="Year of Passing" name="graduationYear" value={data.graduationYear} onChange={onFieldChange} placeholder="Passing year" />
        </FieldGrid>
      </div>
    </SectionCard>
  );
}

export default EducationalDetailsSection;
