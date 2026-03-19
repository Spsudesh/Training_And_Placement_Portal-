import { EntryCard, FieldGrid, SaveButton, SectionCard, TextInput, UploadRow } from "./FormUI";

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
