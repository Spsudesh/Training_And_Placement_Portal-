import axios from "axios";

const profileApi = axios.create({
  baseURL: "http://localhost:3000/student/profile",
});

const DEFAULT_PRN = "2453012";

async function getStudentProfile(prn = DEFAULT_PRN) {
  const response = await profileApi.get("/", {
    params: { prn },
  });

  return response.data.data;
}

export { DEFAULT_PRN, getStudentProfile };
