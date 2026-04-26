function toList(value, emptyLabel) {
  return Array.isArray(value) && value.length ? value : [emptyLabel];
}

function joinLabel(values, emptyLabel) {
  return toList(values, emptyLabel).join(", ");
}

function formatValue(label, value) {
  return value ? `*${label}:* ${value}` : "";
}

export function buildWhatsAppMessage(formData, { departments = [], years = [] } = {}) {
  const typeLabel =
    formData.type === "placement"
      ? "Placement Opportunity"
      : formData.type === "internship"
        ? "Internship Opportunity"
        : "Announcement";
  const departmentLabel = joinLabel(departments, "All Departments");
  const batchLabel = joinLabel(years, "All Batches");
  const lines = [
    `*${typeLabel}*`,
    "",
    formatValue("Title", String(formData.title || "").trim()),
    formatValue("Department", departmentLabel),
    formatValue("Batch", batchLabel),
  ];

  if (formData.type !== "announcement") {
    lines.push(
      formatValue("Company", String(formData.companyName || "").trim()),
      formatValue("Role", String(formData.role || "").trim()),
      formatValue("Location", String(formData.location || "").trim()),
      formData.type === "placement"
        ? formatValue("CTC", String(formData.ctc || "").trim())
        : formatValue("Stipend", String(formData.stipend || "").trim()),
      formData.type === "internship"
        ? formatValue("Duration", String(formData.duration || "").trim())
        : "",
      formatValue("Min CGPA", String(formData.minCgpa || "").trim()),
      formatValue("Max Backlogs", String(formData.maxBacklogs || "").trim()),
      formatValue("Deadline", String(formData.deadline || "").trim())
    );
  }

  lines.push(
    "",
    "*Description:*",
    String(formData.description || "").trim()
  );

  return lines.filter(Boolean).join("\n");
}

export async function copyTextToClipboard(text) {
  const content = String(text || "");

  if (!content) {
    throw new Error("Nothing to copy.");
  }

  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(content);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = content;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);

  if (!copied) {
    throw new Error("Clipboard copy is not supported in this browser.");
  }
}
