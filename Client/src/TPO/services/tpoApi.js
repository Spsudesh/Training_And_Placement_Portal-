import { apiClient } from "../../shared/apiClient";

export const getDashboardData = async () => {
  const response = await apiClient.get("/tpo/dashboard");
  return response.data?.data ?? response.data;
};

