import { apiClient } from "../../shared/apiClient";

export async function fetchTPCList() {
  const response = await apiClient.get("/tpo/tpc/list");
  const records = Array.isArray(response.data?.data) ? response.data.data : [];

  return records.map((item) => ({
    ...item,
    department: item?.department || item?.department_name || "",
    department_name: item?.department_name || item?.department || "",
    name: item?.name || "",
    email: item?.email || "",
  }));
}

export async function fetchTPCById(id) {
  const response = await apiClient.get(`/tpo/tpc/${id}`);
  return response.data?.data || null;
}

export async function createTPC(email, password, name, department_name) {
  const response = await apiClient.post("/tpo/tpc/create", {
    email,
    password,
    name,
    department_name,
  });
  return response.data?.data || null;
}

export async function updateTPC(id, updates) {
  const response = await apiClient.put(`/tpo/tpc/${id}`, updates);
  return response.data || null;
}

export async function deleteTPCById(id) {
  const response = await apiClient.delete(`/tpo/tpc/${id}`);
  return response.data || null;
}
