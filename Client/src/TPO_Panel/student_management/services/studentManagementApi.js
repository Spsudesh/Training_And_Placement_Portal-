import { apiClient } from "../../../shared/apiClient";

export async function getTpoStudentManagementRecords() {
  const response = await apiClient.get("/tpo/students");
  return response.data?.data || [];
}

export async function getTpoStudentManagementRecord(prn) {
  const response = await apiClient.get(`/tpo/students/${prn}`);
  return response.data?.data || null;
}
