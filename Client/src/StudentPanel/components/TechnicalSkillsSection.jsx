import { FieldGrid, SaveButton, SectionCard, TextArea, TextInput } from "./FormUI";

function TechnicalSkillsSection({ data, onFieldChange, onSave, isSaved }) {
  return (
    <SectionCard
      title="Technical Skills"
      description="Capture core programming abilities, tools, frameworks, and other strengths."
      actions={<SaveButton onClick={onSave} saved={isSaved} />}
    >
      <TextArea
        label="Languages"
        name="languages"
        value={data.languages}
        onChange={onFieldChange}
        placeholder="C, C++, Java, Python, JavaScript"
        rows={4}
      />

      <FieldGrid columns={2}>
        <TextArea label="Tools" name="tools" value={data.tools} onChange={onFieldChange} placeholder="Git, VS Code, Postman, Docker" rows={4} />
        <TextArea
          label="Frameworks"
          name="frameworks"
          value={data.frameworks}
          onChange={onFieldChange}
          placeholder="React, Express, Tailwind CSS, Spring Boot"
          rows={4}
        />
      </FieldGrid>

      <TextInput
        label="Other Skills"
        name="otherSkills"
        value={data.otherSkills}
        onChange={onFieldChange}
        placeholder="Problem solving, communication, data analysis"
      />
    </SectionCard>
  );
}

export default TechnicalSkillsSection;
