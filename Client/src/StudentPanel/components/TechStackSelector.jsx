import { useState } from "react";

const TECH_STACK_CATALOG = [
  {
    key: "tech-stacks",
    label: "Tech Stacks",
    options: [
      "MERN Stack",
      "MEAN Stack",
      "Java Full Stack",
      "Python Full Stack",
      "Next.js Modern Stack",
      "Vue Full Stack",
      "LAMP Stack",
      "Flutter Mobile",
      "React Native",
      "Cloud Native",
      ".NET Stack",
      "AWS DevOps",
    ],
  },
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
    key: "databases",
    label: "Databases",
    options: [
      "Firebase",
      "MariaDB",
      "MongoDB",
      "MySQL",
      "Oracle",
      "PostgreSQL",
      "Prisma",
      "Redis",
      "SQLite",
      "Supabase",
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
    key: "other",
    label: "Other",
    options: [],
  },
];

function parseTechStackValue(value) {
  if (!value) {
    return [];
  }

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .filter(
      (item, index, items) =>
        items.findIndex((entry) => entry.toLowerCase() === item.toLowerCase()) === index,
    );
}

function joinTechStackValue(items) {
  return items.join(", ");
}

function TechStackSelector({ value, onChange }) {
  const [activeCategory, setActiveCategory] = useState(TECH_STACK_CATALOG[0].key);
  const [searchTerm, setSearchTerm] = useState("");
  const [customTechInput, setCustomTechInput] = useState("");

  const selectedItems = parseTechStackValue(value);
  const currentCategory =
    TECH_STACK_CATALOG.find((category) => category.key === activeCategory) ?? TECH_STACK_CATALOG[0];
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const visibleOptions = currentCategory.options.filter((option) =>
    option.toLowerCase().includes(normalizedSearch),
  );

  function isSelected(option) {
    return selectedItems.some((item) => item.toLowerCase() === option.toLowerCase());
  }

  function updateSelection(nextItems) {
    onChange(joinTechStackValue(nextItems));
  }

  function handleToggle(option) {
    if (isSelected(option)) {
      updateSelection(
        selectedItems.filter((item) => item.toLowerCase() !== option.toLowerCase()),
      );
      return;
    }

    updateSelection([...selectedItems, option]);
  }

  function handleAddCustomTech() {
    const trimmedInput = customTechInput.trim();
    if (trimmedInput && !isSelected(trimmedInput)) {
      updateSelection([...selectedItems, trimmedInput]);
      setCustomTechInput("");
      setShowCustomInput(false);
    }
  }

  function removeItem(option) {
    updateSelection(selectedItems.filter((item) => item.toLowerCase() !== option.toLowerCase()));
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <span>Tech Stack</span>
        </div>
        <p className="text-sm text-slate-500">
          Pick technologies from categories. Start with Tech Stacks for predefined stacks (MERN, MEAN, etc.) or pick individual languages, frameworks, and tools.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {TECH_STACK_CATALOG.map((category) => {
          const active = category.key === activeCategory;

          return (
            <button
              key={category.key}
              type="button"
              onClick={() => {
                setActiveCategory(category.key);
                setSearchTerm("");
              }}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                active
                  ? "bg-slate-900 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              {category.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder={`Search in ${currentCategory.label}`}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
        />
      </div>

      <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-4">
        <div className="flex flex-wrap gap-2">
          {selectedItems.length > 0 ? (
            selectedItems.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => removeItem(item)}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-600"
              >
                <span>{item}</span>
                <span className="text-base leading-none">x</span>
              </button>
            ))
          ) : (
            <p className="text-sm text-slate-400">No tech stack selected yet.</p>
          )}
        </div>
      </div>

      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          {currentCategory.label}
        </p>

        {currentCategory.key === "other" ? (
          <div className="mt-3 flex flex-col gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3">
            <input
              type="text"
              value={customTechInput}
              onChange={(e) => setCustomTechInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleAddCustomTech();
                }
              }}
              placeholder="Type custom tech stack or language..."
              className="rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAddCustomTech}
                className="flex-1 rounded-lg bg-blue-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-600"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setCustomTechInput("");
                }}
                className="flex-1 rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-50"
              >
                Clear
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {visibleOptions.length > 0 ? (
              visibleOptions.map((option) => {
                const selected = isSelected(option);

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleToggle(option)}
                    className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                      selected
                        ? "border-emerald-500 bg-emerald-100 text-emerald-900"
                        : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50"
                    }`}
                  >
                    <span>{option}</span>
                    <span className="text-base leading-none">{selected ? "x" : "+"}</span>
                  </button>
                );
              })
            ) : (
              <p className="text-sm text-slate-400">No matching technologies in this category.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default TechStackSelector;
