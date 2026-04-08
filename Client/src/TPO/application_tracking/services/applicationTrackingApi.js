import { apiClient } from "../../../shared/apiClient";

export async function fetchOpportunityApplicants(opportunityId) {
  const response = await apiClient.get(
    `/tpo/application-tracking/opportunities/${opportunityId}/applicants`,
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

export async function verifyAllOpportunityApplicants(opportunityId) {
  const response = await apiClient.post(
    `/tpo/application-tracking/opportunities/${opportunityId}/applicants/verify-all`,
  );

  return response.data || null;
}

export async function rejectAllOpportunityApplicants(opportunityId) {
  const response = await apiClient.post(
    `/tpo/application-tracking/opportunities/${opportunityId}/applicants/reject-all`,
  );

  return response.data || null;
}

export async function verifyOpportunityApplicant(applicationId) {
  const response = await apiClient.post(
    `/tpo/application-tracking/applications/${applicationId}/verify`,
  );

  return response.data || null;
}

export async function rejectOpportunityApplicant(applicationId) {
  const response = await apiClient.post(
    `/tpo/application-tracking/applications/${applicationId}/reject`,
  );

  return response.data || null;
}

export async function upsertStageResults(stageId, results) {
  const response = await apiClient.post(
    `/tpo/application-tracking/stages/${stageId}/results/upsert`,
    { results },
  );

  return response.data || null;
}
