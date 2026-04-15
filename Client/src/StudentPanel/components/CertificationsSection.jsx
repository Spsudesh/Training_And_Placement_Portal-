import {
  EntryCard,
  FieldGrid,
  SaveButton,
  SectionCard,
  SelectInput,
  TextInput,
  UploadRow,
} from "./FormUI";

const certificationDurationOptions = [
  { label: "Days", value: "days" },
  { label: "Weeks", value: "weeks" },
];

function CertificationsSection({
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
      title="Certifications"
      description="Add certificates from recognized platforms, workshops, or professional programs."
      actions={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onAddEntry}
            className="inline-flex items-center justify-center rounded-xl border border-blue-200 bg-white px-5 py-3 text-sm font-semibold text-blue-900 transition hover:bg-blue-50"
          >
            Add Certification
          </button>
          <SaveButton onClick={onSave} saved={isSaved} />
        </div>
      }
    >
      <div className="space-y-5">
        {data.map((entry, index) => (
          <EntryCard
            key={index}
            title={`Certification ${index + 1}`}
            subtitle="Mention platform and upload proof"
            onRemove={() => onRemoveEntry(index)}
            disableRemove={data.length === 1}
          >
            <FieldGrid columns={2}>
              <TextInput label="Certification Name" name="name" value={entry.name} onChange={(event) => onEntryChange(index, event)} placeholder="Certification name" />
              <TextInput label="Platform" name="platform" value={entry.platform} onChange={(event) => onEntryChange(index, event)} placeholder="Coursera, NPTEL, Udemy" />
            </FieldGrid>

            <FieldGrid columns={1}>
              <TextInput
                label="Certification Link"
                name="link"
                value={entry.link || ""}
                onChange={(event) => onEntryChange(index, event)}
                placeholder="https://..."
              />
            </FieldGrid>

            <FieldGrid columns={4}>
              <SelectInput
                label="Duration Unit"
                name="durationUnit"
                value={entry.durationUnit}
                onChange={(event) => onEntryChange(index, event)}
                options={certificationDurationOptions}
                placeholder="Select duration unit"
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

            <FieldGrid columns={1}>
              <TextInput
                label="Duration Summary"
                name="durationSummary"
                value={entry.durationSummary || entry.duration || ""}
                onChange={(event) => onEntryChange(index, event)}
                placeholder="Auto-generated from the fields above"
                disabled
              />
            </FieldGrid>

            <UploadRow
              label="Upload Certificate"
              name="certificate"
              fileName={entry.certificate}
              onChange={(event) => onEntryFileChange(index, event)}
              accept=".pdf,.jpg,.jpeg,.png"
            />
          </EntryCard>
        ))}
      </div>
    </SectionCard>
  );
}

export default CertificationsSection;
