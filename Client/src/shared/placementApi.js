import axios from "axios";
import {
  buildPlacementPayload,
  hydratePlacementJob,
  normalizePlacementAttachment,
} from "./placementJobs";

const placementApi = axios.create({
  baseURL: "http://localhost:3000",
});

function appendPlacementFields(target, payload) {
  target.append("company", payload.company);
  target.append("title", payload.title);
  target.append("location", payload.location);
  target.append("type", payload.type);
  target.append("deadline", payload.deadline);
  target.append("category", payload.overview.category);
  target.append("level", payload.overview.level);
  target.append("functions", payload.overview.functions);
  target.append("ctc", payload.overview.ctc);
  target.append("otherInfo", payload.overview.otherInfo);
  target.append("roleOverview", payload.description.roleOverview);
  target.append("responsibilities", payload.description.responsibilities);
  target.append("skills", payload.description.skills);
  target.append("offer", payload.description.offer);
  target.append("disclaimer", payload.description.disclaimer);
  target.append("requiredSkills", JSON.stringify(payload.additional.requiredSkills));
  target.append("minCgpa", payload.additional.minCgpa);
  target.append("maxBacklogs", payload.additional.maxBacklogs);
  target.append("allowedDepartments", payload.additional.allowedDepartments);
  target.append("passingYear", payload.additional.passingYear);
  target.append("extraInfo", payload.additional.extraInfo);
  target.append("workflow", JSON.stringify(payload.workflow));
}

function createPlacementFormData(formValues, existingPlacement = null) {
  const payload = buildPlacementPayload(formValues);
  const requestData = new FormData();
  const attachments = normalizePlacementAttachment(formValues.attachment);
  const retainedAttachments = attachments
    .filter((item) => !(item.file instanceof File) && item.url)
    .map((item) => ({
      name: item.name,
      type: item.type,
      url: item.url,
      notice: item.notice,
    }));
  const hasNewAttachments = attachments.some((item) => item.file instanceof File);

  appendPlacementFields(requestData, payload);

  if (retainedAttachments.length > 0) {
    requestData.append("existingAttachments", JSON.stringify(retainedAttachments));
  }

  attachments.forEach((item) => {
    if (item.file instanceof File) {
      requestData.append("attachment", item.file);
    }
  });

  if (!attachments.length && existingPlacement?.attachmentUrl && !hasNewAttachments) {
    requestData.append("removeAttachment", "true");
  }

  return requestData;
}

function mapApiPlacement(responseData) {
  return hydratePlacementJob(responseData);
}

export async function fetchPlacements(scope = "tpo", options = {}) {
  const response = await placementApi.get(`/${scope}/placements`, {
    params: options,
  });
  const placements = Array.isArray(response.data?.data) ? response.data.data : [];
  return placements.map(mapApiPlacement);
}

export async function createPlacement(formValues) {
  const response = await placementApi.post(
    "/tpo/placements",
    createPlacementFormData(formValues),
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return mapApiPlacement(response.data?.data);
}

export async function updatePlacement(id, formValues, existingPlacement = null) {
  const response = await placementApi.put(
    `/tpo/placements/${id}`,
    createPlacementFormData(formValues, existingPlacement),
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return mapApiPlacement(response.data?.data);
}

export async function deletePlacement(id) {
  await placementApi.delete(`/tpo/placements/${id}`);
}
