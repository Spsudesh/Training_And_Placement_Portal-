import axios from "axios";

const verificationApi = axios.create({
  baseURL: "http://localhost:3000/tpc/verification",
});

async function getStudentVerificationRecords() {
  const response = await verificationApi.get("/students");
  return response.data?.data ?? [];
}

async function verifyStudentField(prn, fieldId) {
  const response = await verificationApi.post(`/students/${prn}/verify-field`, {
    fieldId,
  });

  return response.data;
}

async function verifyStudentProfile(prn) {
  const response = await verificationApi.post(`/students/${prn}/verify-profile`);
  return response.data;
}

export { getStudentVerificationRecords, verifyStudentField, verifyStudentProfile };
