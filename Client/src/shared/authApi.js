import axios from "axios";

const authApi = axios.create({
  baseURL: "http://localhost:3000",
});

export async function signupUser(payload) {
  const response = await authApi.post("/student/signup", payload);
  return response.data;
}

export async function loginUser(payload) {
  const response = await authApi.post("/student/login", payload);
  return response.data;
}
