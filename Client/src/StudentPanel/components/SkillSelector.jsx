import { useMemo, useState } from "react";

const SKILL_CATALOG = {
  languages: {
    helperText: "Select core programming languages relevant to your role preparation.",
    searchPlaceholder: "Search programming languages",
    emptyLabel: "No programming languages selected yet.",
    options: [
      "C",
      "C++",
      "C#",
      "CSS",
      "Dart",
      "Go",
      "HTML",
      "Java",
      "JavaScript",
      "Kotlin",
      "MATLAB",
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
  tools: {
    helperText: "Choose tools and platforms you can confidently use in projects and internships.",
    searchPlaceholder: "Search tools and platforms",
    emptyLabel: "No tools selected yet.",
    options: [
      "Android Studio",
      "Canva",
      "Docker",
      "Eclipse",
      "Figma",
      "Firebase",
      "Git",
      "GitHub",
      "GitHub Actions",
      "IntelliJ IDEA",
      "Jupyter Notebook",
      "Linux",
      "MATLAB",
      "Netlify",
      "Postman",
      "Power BI",
      "PyCharm",
      "Render",
      "Tableau",
      "Vercel",
      "VS Code",
    ],
  },
  frameworks: {
    helperText: "Add frameworks, libraries, and platforms you have used in academic or personal work.",
    searchPlaceholder: "Search frameworks and libraries",
    emptyLabel: "No frameworks selected yet.",
    options: [
      ".NET",
      "Angular",
      "Bootstrap",
      "Django",
      "Express.js",
      "FastAPI",
      "Flask",
      "Flutter",
      "Hibernate",
      "Laravel",
      "Next.js",
      "Node.js",
      "NumPy",
      "Pandas",
      "React",
      "React Native",
      "Spring",
      "Spring Boot",
      "Tailwind CSS",
      "TensorFlow",
      "Vue.js",
    ],
  },
  other: {
    helperText: "Mention spoken or foreign languages that can support HR rounds, client interaction, or international roles.",
    searchPlaceholder: "Search spoken languages",
    emptyLabel: "No spoken languages selected yet.",
    options: [
      "English",
      "Hindi",
      "Marathi",
      "Gujarati",
      "Punjabi",
      "Bengali",
      "Tamil",
      "Telugu",
      "Kannada",
      "Malayalam",
      "Urdu",
      "Sanskrit",
      "French",
      "German",
      "Japanese",
      "Spanish",
      "Italian",
      "Mandarin",
      "Arabic",
      "Russian",
    ],
  },
};

function normalizeSkills(value) {
  if (!value) {
    return [];
  }

  const items = Array.isArray(value)
    ? value
    : String(value)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

  return items.filter(
    (item, index, allItems) =>
      allItems.findIndex((entry) => entry.toLowerCase() === item.toLowerCase()) === index,
  );
}

function SkillSelector({ title, value, onChange, skillType }) {
  const [searchValue, setSearchValue] = useState("");
  const [customValue, setCustomValue] = useState("");

  const config = SKILL_CATALOG[skillType] ?? SKILL_CATALOG.languages;
  const selectedItems = useMemo(() => normalizeSkills(value), [value]);
  const normalizedSearch = searchValue.trim().toLowerCase();

  const filteredOptions = config.options.filter((option) => {
    const matchesSearch = !normalizedSearch || option.toLowerCase().includes(normalizedSearch);
    const isAlreadySelected = selectedItems.some(
      (item) => item.toLowerCase() === option.toLowerCase(),
    );

    return matchesSearch && !isAlreadySelected;
  });

  function updateSelection(nextItems) {
    onChange(
      nextItems.filter(
        (item, index, allItems) =>
          allItems.findIndex((entry) => entry.toLowerCase() === item.toLowerCase()) === index,
      ),
    );
  }

  function addItem(item) {
    const trimmedItem = String(item || "").trim();

    if (!trimmedItem) {
      return;
    }

    if (selectedItems.some((entry) => entry.toLowerCase() === trimmedItem.toLowerCase())) {
      return;
    }

    updateSelection([...selectedItems, trimmedItem]);
  }

  function removeItem(item) {
    updateSelection(
      selectedItems.filter((entry) => entry.toLowerCase() !== item.toLowerCase()),
    );
  }

  function handleAddCustomValue() {
    addItem(customValue);
    setCustomValue("");
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-blue-50/60 p-5 shadow-sm">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white">
            {selectedItems.length} selected
          </span>
        </div>
        <p className="text-sm leading-6 text-slate-500">{config.helperText}</p>
      </div>

      <div className="mt-5 space-y-4">
        <input
          type="text"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder={config.searchPlaceholder}
          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
        />

        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Selected
          </p>
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
              <p className="text-sm text-slate-400">{config.emptyLabel}</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Suggested Options
          </p>
          <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto pr-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => addItem(option)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                >
                  {option}
                </button>
              ))
            ) : (
              <p className="text-sm text-slate-400">No matching options. Add a custom value below.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
            Add Custom
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={customValue}
              onChange={(event) => setCustomValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleAddCustomValue();
                }
              }}
              placeholder={`Add custom ${title.toLowerCase()}`}
              className="flex-1 rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
            <button
              type="button"
              onClick={handleAddCustomValue}
              className="rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SkillSelector;
