import { EntryCard, FieldGrid, SaveButton, SectionCard, TextArea, TextInput } from "./FormUI";

function ProjectsSection({
  data,
  onEntryChange,
  onAddEntry,
  onRemoveEntry,
  onSave,
  isSaved,
}) {
  const canAddMore = data.length < 3;

  return (
    <SectionCard
      title="Projects"
      description="Highlight up to three relevant academic or personal projects with links."
      actions={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onAddEntry}
            disabled={!canAddMore}
            className="inline-flex items-center justify-center rounded-xl border border-blue-200 bg-white px-5 py-3 text-sm font-semibold text-blue-900 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {canAddMore ? "Add Project" : "Maximum 3 Projects"}
          </button>
          <SaveButton onClick={onSave} saved={isSaved} />
        </div>
      }
    >
      <div className="space-y-5">
        {data.map((entry, index) => (
          <EntryCard
            key={index}
            title={`Project ${index + 1}`}
            subtitle="Showcase project scope and outcomes"
            onRemove={() => onRemoveEntry(index)}
            disableRemove={data.length === 1}
          >
            <TextInput label="Project Title" name="title" value={entry.title} onChange={(event) => onEntryChange(index, event)} placeholder="Project title" />
            <TextArea
              label="Description"
              name="description"
              value={entry.description}
              onChange={(event) => onEntryChange(index, event)}
              placeholder="Project overview, modules, and your contribution"
            />
            <TextInput label="Tech Stack" name="techStack" value={entry.techStack} onChange={(event) => onEntryChange(index, event)} placeholder="React, Node.js, MySQL, Tailwind CSS" />
            <FieldGrid columns={2}>
              <TextInput label="GitHub Link" name="githubLink" value={entry.githubLink} onChange={(event) => onEntryChange(index, event)} placeholder="https://github.com/..." />
              <TextInput label="Live Link" name="liveLink" value={entry.liveLink} onChange={(event) => onEntryChange(index, event)} placeholder="https://your-project-demo.com" />
            </FieldGrid>
          </EntryCard>
        ))}
      </div>
    </SectionCard>
  );
}

export default ProjectsSection;
