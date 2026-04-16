import { apiClient } from "../../../shared/apiClient";

function resolveApplicationTrackingBasePath(scope = "tpo") {
  return scope === "tpc" ? "/tpc/application-tracking" : "/tpo/application-tracking";
}

export async function fetchOpportunityApplicants(opportunityId, scope = "tpo") {
  const response = await apiClient.get(
    `${resolveApplicationTrackingBasePath(scope)}/opportunities/${opportunityId}/applicants`,
  );

  return response.data?.data || {
    opportunity: null,
    summary: {
      totalApplicants: 0,
      pendingVerification: 0,
      inProcess: 0,
      selected: 0,
    },
    applicants: [],
  };
}

export async function verifyAllOpportunityApplicants(opportunityId, scope = "tpo") {
  const response = await apiClient.post(
    `${resolveApplicationTrackingBasePath(scope)}/opportunities/${opportunityId}/applicants/verify-all`,
  );

  return response.data || null;
}

export async function rejectAllOpportunityApplicants(opportunityId, scope = "tpo") {
  const response = await apiClient.post(
    `${resolveApplicationTrackingBasePath(scope)}/opportunities/${opportunityId}/applicants/reject-all`,
  );

  return response.data || null;
}

export async function verifyOpportunityApplicant(applicationId, scope = "tpo") {
  const response = await apiClient.post(
    `${resolveApplicationTrackingBasePath(scope)}/applications/${applicationId}/verify`,
  );

  return response.data || null;
}

export async function rejectOpportunityApplicant(applicationId, scope = "tpo") {
  const response = await apiClient.post(
    `${resolveApplicationTrackingBasePath(scope)}/applications/${applicationId}/reject`,
  );

  return response.data || null;
}

export async function upsertStageResults(stageId, results, scope = "tpo") {
  const response = await apiClient.post(
    `${resolveApplicationTrackingBasePath(scope)}/stages/${stageId}/results/upsert`,
    { results },
  );

  return response.data || null;
}
