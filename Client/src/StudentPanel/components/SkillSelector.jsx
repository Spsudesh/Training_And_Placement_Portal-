import { useState } from "react";

const SKILL_CATALOG = [
  {
    key: "languages",
    label: "Languages",
    options: [
      "C",
      "C++",
      "C#",
      "Dart",
      "Go",
      "Java",
      "JavaScript",
      "Kotlin",
      "PHP",
      "Python",
      "R",
      "Ruby",
      "Rust",
      "SQL",
      "Swift",
      "TypeScript",
    ],
  },
  {
    key: "tools",
    label: "Tools",
    options: [
      "Android Studio",
      "Docker",
      "Figma",
      "Git",
      "GitHub",
      "Linux",
      "MATLAB",
      "Netlify",
      "Postman",
      "Power BI",
      "Render",
      "Vercel",
      "VS Code",
    ],
  },
  {
    key: "frameworks",
    label: "Frameworks",
    options: [
      ".NET",
      "Angular",
      "Bootstrap",
      "Django",
      "Express.js",
      "FastAPI",
      "Flask",
      "Flutter",
      "Laravel",
      "Next.js",
      "Node.js",
      "React",
      "React Native",
      "Spring Boot",
      "Tailwind CSS",
      "Vue.js",
    ],
  },
  {
    key: "other",
    label: "Other",
    options: [],
  },
  {
    key: "soft_skills",
    label: "Non-Technical Skills",
    options: [
      "Leadership",
      "Communication",
      "Teamwork",
      "Problem Solving",
      "Time Management",
      "Adaptability",
      "Critical Thinking",
      "Emotional Intelligence",
      "Presentation",
      "Negotiation",
      "Conflict Resolution",
      "Creativity",
      "Project Management",
      "Decision Making",
      "Public Speaking",
    ],
  },
];

function parseSkillValue(value) {
  if (!value) {
    return [];
  }

  return Array.isArray(value)
    ? value
    : String(value)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .filter(
          (item, index, items) =>
            items.findIndex((entry) => entry.toLowerCase() === item.toLowerCase()) === index
        );
}

function joinSkillValue(items) {
  return items;
}

function SkillSelector({ title, value, onChange, skillType }) {
  const [inputValue, setInputValue] = useState("");

  const selectedItems = parseSkillValue(value);
  const currentCategory =
    SKILL_CATALOG.find((category) => category.key === skillType) ?? SKILL_CATALOG[0];
  
  // Get the last word being typed (after the last comma)
  const inputParts = inputValue.split(",").map((s) => s.trim());
  const lastInput = inputParts[inputParts.length - 1].toLowerCase();
  
  // Filter options based on last input
  const visibleOptions = currentCategory.options.filter((option) =>
    option.toLowerCase().includes(lastInput) && !isSelected(option)
  );

  function isSelected(option) {
    return selectedItems.some((item) => item.toLowerCase() === option.toLowerCase());
  }

  function updateSelection(nextItems) {
    onChange(joinSkillValue(nextItems));
  }

  function handleAddSkillsFromInput() {
    const newSkills = inputValue
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (newSkills.length) {
      const mergedSkills = [...selectedItems, ...newSkills].filter(
        (skill, index, allSkills) =>
          allSkills.findIndex(
            (entry) => entry.toLowerCase() === skill.toLowerCase()
          ) === index
      );
      updateSelection(mergedSkills);
      setInputValue("");
    }
  }

  function removeItem(option) {
    updateSelection(
      selectedItems.filter((item) => item.toLowerCase() !== option.toLowerCase())
    );
  }

  function handleSelectSuggestion(option) {
    // Replace last word with selected option and keep comma-separated format
    const newParts = [...inputParts.slice(0, -1), option];
    setInputValue(newParts.join(", ") + ", ");
  }

  // Create display value: selected items + current input
  const displayValue = selectedItems.length > 0 
    ? selectedItems.join(", ") + (inputValue.trim() ? ", " + inputValue : "")
    : inputValue;

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <span>{title}</span>
        </div>
        <p className="text-sm text-slate-500">
          Type skills separated by commas or select from suggestions.
        </p>
      </div>

      <div className="mt-4">
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={displayValue}
            onChange={(event) => {
              const newValue = event.target.value;
              // Only update if it's a new addition
              if (newValue.length > displayValue.length) {
                // User is typing
                setInputValue(newValue.substring(selectedItems.join(", ").length).replace(/^, /, ""));
              } else {
                // User deleted
                setInputValue(newValue);
              }
            }}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleAddSkillsFromInput();
              }
            }}
            placeholder={`Type ${title.toLowerCase()} separated by commas...`}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
          />
          <button
            type="button"
            onClick={handleAddSkillsFromInput}
            className="rounded-lg bg-blue-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-600"
          >
            Add
          </button>
        </div>

        {lastInput && visibleOptions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
            <p className="w-full text-xs font-semibold uppercase text-slate-600">Suggestions:</p>
            {visibleOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleSelectSuggestion(option)}
                className="rounded-full border border-blue-300 bg-white px-3 py-1 text-sm text-blue-700 transition hover:bg-blue-100"
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedItems.length > 0 && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-xs font-semibold uppercase text-slate-600">Selected:</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedItems.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => removeItem(item)}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-800 transition hover:bg-emerald-200"
              >
                <span>{item}</span>
                <span className="text-base leading-none">x</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SkillSelector;
