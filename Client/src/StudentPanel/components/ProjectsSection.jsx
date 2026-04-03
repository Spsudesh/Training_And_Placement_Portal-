import { EntryCard, FieldGrid, SaveButton, SectionCard, TextArea, TextInput } from "./FormUI";
import TechStackSelector from "./TechStackSelector";

function ProjectsSection({
  data,
  onEntryChange,
  onAddEntry,
  onRemoveEntry,
  onSave,
  isSaved,
}) {
  function handleTechStackChange(index, nextValue) {
    onEntryChange(index, {
      target: {
        name: "techStack",
        value: nextValue,
      },
    });
  }

  return (
    <SectionCard
      title="Projects"
      description="Add as many academic or personal projects as needed and choose which ones should appear in the resume."
      actions={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onAddEntry}
            className="inline-flex items-center justify-center rounded-xl border border-blue-200 bg-white px-5 py-3 text-sm font-semibold text-blue-900 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add Project
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
            headerActions={
              <button
                type="button"
                onClick={() =>
                  onEntryChange(index, {
                    target: {
                      name: "includeInResume",
                      value: !entry.includeInResume,
                    },
                  })
                }
                className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition ${
                  entry.includeInResume
                    ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                }`}
              >
                {entry.includeInResume ? "Selected for Resume" : "Select for Resume"}
              </button>
            }
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
            <TechStackSelector
              value={entry.techStack}
              onChange={(nextValue) => handleTechStackChange(index, nextValue)}
            />
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
