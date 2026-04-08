import { EntryCard, SaveButton, SectionCard, TextArea, TextInput } from "./FormUI";

function ExtraActivitiesSection({
  data,
  onEntryChange,
  onAddEntry,
  onRemoveEntry,
  onSave,
  isSaved,
}) {
  return (
    <SectionCard
      title="Extra Curricular Activities"
      description="Include achievements, leadership activities, clubs, events, or volunteering work."
      actions={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onAddEntry}
            className="inline-flex items-center justify-center rounded-xl border border-blue-200 bg-white px-5 py-3 text-sm font-semibold text-blue-900 transition hover:bg-blue-50"
          >
            Add Activity
          </button>
          <SaveButton onClick={onSave} saved={isSaved} />
        </div>
      }
    >
      <div className="space-y-5">
        {data.map((entry, index) => (
          <EntryCard
            key={index}
            title={`Activity ${index + 1}`}
            subtitle="Showcase contributions beyond academics"
            onRemove={() => onRemoveEntry(index)}
            disableRemove={data.length === 1}
          >
            <TextInput label="Title" name="title" value={entry.title} onChange={(event) => onEntryChange(index, event)} placeholder="Activity title" />
            <TextArea
              label="Description"
              name="description"
              value={entry.description}
              onChange={(event) => onEntryChange(index, event)}
              placeholder="Describe the activity, role, and outcome"
            />
            <TextInput
              label="Links"
              name="links"
              value={entry.links}
              onChange={(event) => onEntryChange(index, event)}
              placeholder="Portfolio, event page, LinkedIn post, etc."
            />
          </EntryCard>
        ))}
      </div>
    </SectionCard>
  );
}

export default ExtraActivitiesSection;

