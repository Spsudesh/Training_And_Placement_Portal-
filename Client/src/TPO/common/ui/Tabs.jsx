export default function Tabs({ tabs = [], activeTab, onChange }) {
  return (
    <div className="flex flex-wrap gap-6 border-b border-slate-200/80 pb-3">
      {tabs.map((tab) => {
        const active = activeTab === tab.key;

        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange?.(tab.key)}
            className={`pb-2 text-sm font-medium transition ${
              active
                ? "border-b-2 border-cyan-600 text-cyan-700"
                : "border-b-2 border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
