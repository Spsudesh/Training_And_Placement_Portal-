import { useMemo, useState } from "react";
import { FieldGrid, SaveButton, SectionCard, TextInput } from "./FormUI";

const skillSections = [
  {
    key: "languages",
    title: "Languages",
    placeholder: "Java, Python, SQL",
  },
  {
    key: "tools",
    title: "Tools",
    placeholder: "Git, Postman, Docker",
  },
  {
    key: "frameworks",
    title: "Frameworks",
    placeholder: "React, Spring Boot, Express",
  },
  {
    key: "otherSkills",
    title: "Other Skills",
    placeholder: "Problem solving, communication",
  },
];

function normalizeSkills(rawValue) {
  return rawValue
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function SkillGroup({ title, skillKey, values, draftValue, onDraftChange, onAdd, onRemove, placeholder }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">
          Add one or more comma-separated skills and keep the list structured.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <TextInput
            label={`Add ${title}`}
            name={skillKey}
            value={draftValue}
            onChange={onDraftChange}
            placeholder={placeholder}
          />
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex h-[50px] items-center justify-center rounded-xl bg-blue-900 px-5 text-sm font-semibold text-white transition hover:bg-blue-800"
        >
          Add
        </button>
      </div>

      <div className="mt-4 flex min-h-14 flex-wrap gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-3 py-3">
        {values.length ? (
          values.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-2 text-sm font-medium text-blue-800"
            >
              {skill}
              <button
                type="button"
                onClick={() => onRemove(skill)}
                className="text-blue-500 transition hover:text-blue-800"
                aria-label={`Remove ${skill}`}
              >
                x
              </button>
            </span>
          ))
        ) : (
          <p className="text-sm text-slate-400">No skills added yet.</p>
        )}
      </div>
    </div>
  );
}

function TechnicalSkillsSection({ data, onSkillsChange, onSave, isSaved }) {
  const [drafts, setDrafts] = useState({
    languages: "",
    tools: "",
    frameworks: "",
    otherSkills: "",
  });

  const safeData = useMemo(
    () => ({
      languages: data.languages ?? [],
      tools: data.tools ?? [],
      frameworks: data.frameworks ?? [],
      otherSkills: data.otherSkills ?? [],
    }),
    [data]
  );

  const handleDraftChange = (event) => {
    const { name, value } = event.target;
    setDrafts((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const addSkills = (skillKey) => {
    const newSkills = normalizeSkills(drafts[skillKey]);

    if (!newSkills.length) {
      return;
    }

    const mergedSkills = [...safeData[skillKey], ...newSkills].filter(
      (skill, index, allSkills) =>
        allSkills.findIndex(
          (entry) => entry.toLowerCase() === skill.toLowerCase()
        ) === index
    );

    onSkillsChange(skillKey, mergedSkills);
    setDrafts((current) => ({
      ...current,
      [skillKey]: "",
    }));
  };

  const removeSkill = (skillKey, skillToRemove) => {
    onSkillsChange(
      skillKey,
      safeData[skillKey].filter((skill) => skill !== skillToRemove)
    );
  };

  return (
    <SectionCard
      title="Technical Skills"
      description="Capture skills in a structured way so they can be stored in master and mapping tables."
      actions={<SaveButton onClick={onSave} saved={isSaved} />}
    >
      <FieldGrid columns={2}>
        {skillSections.map((section) => (
          <SkillGroup
            key={section.key}
            title={section.title}
            skillKey={section.key}
            values={safeData[section.key]}
            draftValue={drafts[section.key]}
            onDraftChange={handleDraftChange}
            onAdd={() => addSkills(section.key)}
            onRemove={(skill) => removeSkill(section.key, skill)}
            placeholder={section.placeholder}
          />
        ))}
      </FieldGrid>
    </SectionCard>
  );
}

export default TechnicalSkillsSection;
