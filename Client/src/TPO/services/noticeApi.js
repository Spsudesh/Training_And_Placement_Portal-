import { apiClient } from "../../shared/apiClient";

function toArray(value) {
  return Array.isArray(value) ? value : value ? [value] : [];
}

function getFileName(item) {
  if (item?.name) {
    return item.name;
  }

  if (item?.file instanceof File) {
    return item.file.name;
  }

  if (item?.url) {
    try {
      const url = new URL(item.url);
      return decodeURIComponent(url.pathname.split("/").pop() || "Attachment");
    } catch {
      return "Attachment";
    }
  }

  return "Attachment";
}

function appendCommonFields(formData, values, status, scope) {
  formData.append("title", values.title.trim());
  formData.append("description", values.description.trim());
  formData.append("type", values.type);
  formData.append("status", status);
  formData.append("department", values.department);
  formData.append("year", values.year ?? "");
  formData.append("passingYear", values.year ?? "");
  formData.append("passingYears", values.year ?? "");
  formData.append("createdByRole", scope.toUpperCase());
  formData.append("createdById", `${scope}-portal`);
}

function appendOpportunityFields(formData, values) {
  formData.append("companyName", values.companyName.trim());
  formData.append("role", values.role.trim());
  formData.append("location", values.location.trim());
  formData.append("minCgpa", values.minCgpa);
  formData.append("maxBacklogs", values.maxBacklogs);
  formData.append("deadline", values.deadline);

  if (values.type === "placement") {
    formData.append("ctc", values.ctc);
  }

  if (values.type === "internship") {
    formData.append("stipend", values.stipend);
    formData.append("duration", values.duration.trim());
  }
}

function createNoticeFormData(values, status, scope, options = {}) {
  const { keepExistingFiles = false } = options;
  const formData = new FormData();
  const files = toArray(values.files);
  const retainedFiles = files
    .filter((item) => !(item instanceof File) && !(item?.file instanceof File) && item?.url)
    .map((item) => ({
      name: getFileName(item),
      url: item.url,
    }));

  appendCommonFields(formData, values, status, scope);

  if (values.type !== "announcement") {
    appendOpportunityFields(formData, values);
  }

  if (keepExistingFiles || retainedFiles.length > 0) {
    formData.append("keepExistingFiles", "true");
  }

  if (retainedFiles.length > 0) {
    formData.append("existingFiles", JSON.stringify(retainedFiles));
  }

  files.forEach((item) => {
    if (item instanceof File) {
      formData.append("attachment", item);
      return;
    }

    if (item?.file instanceof File) {
      formData.append("attachment", item.file);
    }
  });

  return formData;
}

function mapNotice(notice) {
  const files = Array.isArray(notice.files)
    ? notice.files.map((item) => ({
        ...item,
        name: getFileName(item),
        url: item.fileUrl ?? item.url ?? "",
      }))
    : [];

  return {
    id: notice.id,
    type: notice.type,
    status: notice.status,
    title: notice.title ?? "",
    description: notice.description ?? "",
    department: notice.department ?? "All Departments",
    departments: Array.isArray(notice.departments) ? notice.departments : [],
    year: notice.year ?? "",
    years: Array.isArray(notice.years) ? notice.years : [],
    companyName: notice.companyName ?? "",
    role: notice.role ?? "",
    location: notice.location ?? "",
    ctc: notice.ctc ?? "",
    stipend: notice.stipend ?? "",
    duration: notice.duration ?? "",
    minCgpa: notice.minCgpa ?? "",
    maxBacklogs: notice.maxBacklogs ?? "",
    deadline: notice.deadline ? String(notice.deadline).slice(0, 10) : "",
    files,
    attachmentName: files.length ? files[0].name : "",
    attachmentUrl: notice.attachmentUrl ?? files[0]?.url ?? "",
    createdAt: notice.createdAt,
    updatedAt: notice.updatedAt,
  };
}

export async function fetchNotices(scope = "tpo", filters = {}) {
  const response = await apiClient.get(`/${scope}/notices`, {
    params: filters,
  });

  const records = Array.isArray(response.data?.data) ? response.data.data : [];
  return records.map(mapNotice);
}

export async function createNotice(scope, values, status) {
  const response = await apiClient.post(`/${scope}/notices`, createNoticeFormData(values, status, scope), {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return mapNotice(response.data?.data);
}

export async function updateNotice(scope, id, values, status, options = {}) {
  const response = await apiClient.put(
    `/${scope}/notices/${id}`,
    createNoticeFormData(values, status, scope, options),
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return mapNotice(response.data?.data);
}

export async function deleteNotice(scope, id) {
  await apiClient.delete(`/${scope}/notices/${id}`);
}
