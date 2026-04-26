import { apiClient } from "../../../shared/apiClient";

export async function fetchNoticeAudienceEmails(scope, filters = {}) {
  const response = await apiClient.get(`/${scope}/notices/audience-emails`, {
    params: filters,
  });

  return {
    emails: Array.isArray(response.data?.data?.emails) ? response.data.data.emails : [],
    recipients: Array.isArray(response.data?.data?.recipients) ? response.data.data.recipients : [],
    count: Number(response.data?.data?.count || 0),
  };
}

function toArray(value) {
  return Array.isArray(value) ? value : value ? [value] : [];
}

export async function sendNoticeMail(scope, values) {
  const formData = new FormData();

  formData.append("title", String(values?.title || "").trim());
  formData.append("description", String(values?.description || "").trim());
  formData.append("department", values?.department ?? "");
  formData.append("year", values?.year ?? "");
  formData.append("passingYear", values?.year ?? "");
  formData.append("passingYears", values?.year ?? "");

  toArray(values?.files).forEach((item) => {
    if (item instanceof File) {
      formData.append("attachment", item);
      return;
    }

    if (item?.file instanceof File) {
      formData.append("attachment", item.file);
    }
  });

  const response = await apiClient.post(`/${scope}/notices/send`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return {
    message: response.data?.message || "Mail sent successfully.",
    count: Number(response.data?.data?.count || 0),
    accepted: Number(response.data?.data?.accepted || 0),
    rejected: Number(response.data?.data?.rejected || 0),
  };
}
