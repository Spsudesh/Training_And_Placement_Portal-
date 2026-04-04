
import { apiClient } from "../../../shared/apiClient";

async function getStudentVerificationRecords() {
  const response = await apiClient.get("/tpc/verification/students");
  return response.data?.data ?? [];
}

async function verifyStudentField(prn, fieldId) {
  const response = await apiClient.post(`/tpc/verification/students/${prn}/verify-field`, {
    fieldId,
  });

  return response.data;
}

async function verifyStudentProfile(prn) {
  const response = await apiClient.post(`/tpc/verification/students/${prn}/verify-profile`);
  return response.data;
}

export { getStudentVerificationRecords, verifyStudentField, verifyStudentProfile };
