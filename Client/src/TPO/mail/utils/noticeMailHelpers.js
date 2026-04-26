export function parsePassingYears(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item ?? "").trim()).filter(Boolean).filter((item) => item !== "All Batches");
  }

  const normalized = String(value ?? "").trim();

  if (!normalized || normalized === "All Batches") {
    return [];
  }

  return normalized
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => item !== "All Batches");
}

export function getAttachmentSummary(files = []) {
  return files
    .map((item, index) => {
      const name = String(item?.name || item?.file?.name || `Attachment ${index + 1}`).trim();
      const url = String(item?.url || "").trim();

      if (url && !url.startsWith("blob:")) {
        return `${index + 1}. ${name} - ${url}`;
      }

      return `${index + 1}. ${name}`;
    })
    .filter(Boolean);
}
