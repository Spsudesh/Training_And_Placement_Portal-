import { apiClient } from "../../../shared/apiClient";

export const getAtsTemplates = async () => {
  const response = await apiClient.get("/student/ats-resumes/templates");
  return response.data.data;
};

export const generateAtsResume = async (payload) => {
  const response = await apiClient.post("/student/ats-resumes/generate", payload);
  return response.data;
};

export const getAtsResumeHistory = async () => {
  const response = await apiClient.get("/student/ats-resumes");
  return response.data;
};
