import { apiClient } from "../../../shared/apiClient";

export async function fetchResumeTemplates() {
  const response = await apiClient.get("/student/resumes/templates");
  return response.data?.data ?? [];
}

export async function fetchStudentResumes() {
  const response = await apiClient.get("/student/resumes");
  return response.data?.data ?? [];
}

export async function fetchStudentResumeById(resumeId) {
  const response = await apiClient.get(`/student/resumes/${resumeId}`);
  return response.data?.data ?? null;
}

export async function generateStudentResume(payload) {
  const response = await apiClient.post("/student/resumes/generate", payload);
  return response.data?.data ?? null;
}
