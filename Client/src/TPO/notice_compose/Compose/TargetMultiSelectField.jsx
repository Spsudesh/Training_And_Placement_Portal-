function inputClassName() {
  return "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200";
}

function normalizeSelectedValues(value, allLabel) {
  const normalized = Array.isArray(value)
    ? value
    : String(value ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  const uniqueValues = [...new Set(normalized)];
  return uniqueValues.length > 0 ? uniqueValues : [allLabel];
}

function serializeSelectedValues(values, allLabel, emptySerializedValue) {
  const cleanedValues = [...new Set(values.map((item) => String(item || "").trim()).filter(Boolean))];

  if (!cleanedValues.length || cleanedValues.includes(allLabel)) {
    return emptySerializedValue;
  }

  return cleanedValues.join(", ");
}

function normalizeOptions(options) {
  return options.map((option) => {
    if (option && typeof option === "object") {
      return {
        label: option.label,
        value: String(option.value ?? ""),
      };
    }

    return {
      label: String(option ?? ""),
      value: String(option ?? ""),
    };
  });
}

export default function TargetMultiSelectField({
  label,
  value,
  options = [],
  allLabel,
  emptySerializedValue,
  onChange,
  addPlaceholder,
  emptyLabel,
}) {
  const normalizedOptions = normalizeOptions(options);
  const optionLabelByValue = new Map(normalizedOptions.map((option) => [option.value, option.label]));
  const selectedValues = normalizeSelectedValues(value, allLabel);

  function handleAddSelection(nextValue) {
    if (!nextValue) {
      return;
    }

    if (nextValue === allLabel) {
      onChange(emptySerializedValue);
      return;
    }

    const nextSelections = selectedValues.includes(allLabel)
      ? [nextValue]
      : [...selectedValues, nextValue];

    onChange(serializeSelectedValues(nextSelections, allLabel, emptySerializedValue));
  }

  function handleRemoveSelection(targetValue) {
    if (targetValue === allLabel) {
      onChange(emptySerializedValue);
      return;
    }

    const nextSelections = selectedValues.filter((item) => item !== targetValue);
    onChange(serializeSelectedValues(nextSelections, allLabel, emptySerializedValue));
  }

  return (
    <div className="space-y-3">
      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <select
          onChange={(event) => {
            handleAddSelection(event.target.value);
            event.target.value = "";
          }}
          defaultValue=""
          className={inputClassName()}
        >
          <option value="">{addPlaceholder}</option>
          {normalizedOptions.map((option) => (
            <option
              key={option.value || option.label}
              value={option.value}
              disabled={selectedValues.includes(option.value) && option.value !== allLabel}
            >
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        {selectedValues.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedValues.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700"
              >
                {optionLabelByValue.get(item) || item}
                <button
                  type="button"
                  onClick={() => handleRemoveSelection(item)}
                  className="text-blue-600 transition hover:text-blue-900"
                >
                  x
                </button>
              </span>
            ))}
          </div>
        ) : (
          <span className="text-slate-400">{emptyLabel}</span>
        )}
      </div>
    </div>
  );
}
