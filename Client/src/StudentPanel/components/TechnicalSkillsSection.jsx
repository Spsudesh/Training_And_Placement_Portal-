import { useMemo } from "react";
import { FieldGrid, SaveButton, SectionCard } from "./FormUI";
import SkillSelector from "./SkillSelector";

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
    key: "otherLanguages",
    title: "Other Languages",
    placeholder: "German, French, Spanish, etc.",
  },
];

function normalizeSkills(rawValue) {
  if (Array.isArray(rawValue)) {
    return rawValue;
  }
  return rawValue
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function TechnicalSkillsSection({ data, onSkillsChange, onSave, isSaved }) {
  const safeData = useMemo(
    () => ({
      languages: data.languages ?? [],
      tools: data.tools ?? [],
      frameworks: data.frameworks ?? [],
      otherLanguages: data.otherLanguages ?? [],
    }),
    [data]
  );

  const handleSkillsChange = (skillKey, newSkills) => {
    if (Array.isArray(newSkills)) {
      onSkillsChange(skillKey, newSkills);
    } else {
      const parsed = normalizeSkills(newSkills);
      const mergedSkills = [...safeData[skillKey], ...parsed].filter(
        (skill, index, allSkills) =>
          allSkills.findIndex(
            (entry) => entry.toLowerCase() === skill.toLowerCase()
          ) === index
      );
      onSkillsChange(skillKey, mergedSkills);
    }
  };

  return (
    <SectionCard
      title="Technical Skills"
      description="Capture skills in a structured way so they can be stored directly in the student skills table."
      actions={<SaveButton onClick={onSave} saved={isSaved} />}
    >
      <FieldGrid columns={2}>
        {skillSections.map((section) => {
          let skillType = section.key;
          if (section.key === "otherLanguages") skillType = "other";

          return (
            <SkillSelector
              key={section.key}
              title={section.title}
              skillType={skillType}
              value={safeData[section.key]}
              onChange={(newSkills) => handleSkillsChange(section.key, newSkills)}
            />
          );
        })}
      </FieldGrid>
    </SectionCard>
  );
}

export default TechnicalSkillsSection;
