import { apiClient } from "../../../shared/apiClient";

export async function generateStudentSwot() {
  const response = await apiClient.post("/student/swot/analyze");
  return response.data?.data || null;
}
