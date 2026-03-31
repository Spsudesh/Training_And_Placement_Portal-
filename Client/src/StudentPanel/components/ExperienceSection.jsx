import {
  EntryCard,
  FieldGrid,
  SaveButton,
  SelectInput,
  SectionCard,
  TextArea,
  TextInput,
  UploadRow,
} from "./FormUI";

const experienceTypeOptions = [
  { label: "Internship", value: "Internship" },
  { label: "Virtual Internship", value: "Virtual Internship" },
  { label: "Freelancer", value: "Freelancer" },
  { label: "Full-Time", value: "Full-Time" },
];

const durationUnitOptions = [
  { label: "Days", value: "days" },
  { label: "Weeks", value: "weeks" },
];

function ExperienceSection({
  data,
  onEntryChange,
  onEntryFileChange,
  onAddEntry,
  onRemoveEntry,
  onSave,
  isSaved,
}) {
  return (
    <SectionCard
      title="Experience"
      description="Add internship, part-time, or full-time experience entries as applicable."
      actions={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onAddEntry}
            className="inline-flex items-center justify-center rounded-xl border border-blue-200 bg-white px-5 py-3 text-sm font-semibold text-blue-900 transition hover:bg-blue-50"
          >
            Add Experience
          </button>
          <SaveButton onClick={onSave} saved={isSaved} />
        </div>
      }
    >
      <div className="space-y-5">
        {data.map((entry, index) => (
          <EntryCard
            key={index}
            title={`Experience ${index + 1}`}
            subtitle="Provide organization and role details"
            onRemove={() => onRemoveEntry(index)}
            disableRemove={data.length === 1}
          >
            <FieldGrid columns={2}>
              <SelectInput
                label="Type"
                name="type"
                value={entry.type}
                onChange={(event) => onEntryChange(index, event)}
                options={experienceTypeOptions}
                placeholder="Select experience type"
              />
              <TextInput label="Company Name" name="companyName" value={entry.companyName} onChange={(event) => onEntryChange(index, event)} placeholder="Company name" />
            </FieldGrid>

            <FieldGrid columns={4}>
              <SelectInput
                label="Duration Unit"
                name="durationUnit"
                value={entry.durationUnit}
                onChange={(event) => onEntryChange(index, event)}
                options={durationUnitOptions}
                placeholder="Select unit"
              />
              <TextInput
                label={entry.durationUnit === "weeks" ? "No. of Weeks" : "No. of Days"}
                name="durationValue"
                value={entry.durationValue}
                onChange={(event) => onEntryChange(index, event)}
                placeholder={entry.durationUnit === "weeks" ? "Enter weeks" : "Enter days"}
              />
              <TextInput
                label="Start Month"
                name="startMonth"
                type="month"
                value={entry.startMonth}
                onChange={(event) => onEntryChange(index, event)}
              />
              <TextInput
                label="End Month"
                name="endMonth"
                type="month"
                value={entry.endMonth}
                onChange={(event) => onEntryChange(index, event)}
              />
            </FieldGrid>

            <FieldGrid columns={2}>
              <TextInput label="Role" name="role" value={entry.role} onChange={(event) => onEntryChange(index, event)} placeholder="Role / Designation" />
              <TextInput
                label="Duration Summary"
                name="duration"
                value={entry.duration}
                onChange={(event) => onEntryChange(index, event)}
                placeholder="Auto-generated from the fields above"
                disabled
              />
            </FieldGrid>

            <TextArea
              label="Description"
              name="description"
              value={entry.description}
              onChange={(event) => onEntryChange(index, event)}
              placeholder="Explain your responsibilities, achievements, and impact"
            />

            <UploadRow
              label="Experience Certificate"
              name="certificate"
              fileName={entry.certificate}
              onChange={(event) => onEntryFileChange(index, event)}
              accept=".pdf,.jpg,.jpeg,.png"
              helperText="Upload internship or experience proof"
            />
          </EntryCard>
        ))}
      </div>
    </SectionCard>
  );
}

export default ExperienceSection;
