import { apiClient } from "../../../shared/apiClient";

const ACTIVE_STUDENT_STORAGE_KEY = "training-placement-active-student";
const STUDENT_PROFILE_VERIFIED_STORAGE_KEY = "training-placement-student-profile-verified";
const STUDENT_PROFILE_VERIFICATION_EVENT = "student-profile-verification-changed";

function getStoredStudentPrn() {
  return window.localStorage.getItem(ACTIVE_STUDENT_STORAGE_KEY) || "";
}

async function getStudentProfile(prn = getStoredStudentPrn()) {
  const response = await apiClient.get("/student/profile", {
    params: prn ? { prn } : {},
  });

  const profileData = response.data.data;
  const resolvedPrn = String(profileData?.prn || "").trim();

  if (resolvedPrn) {
    window.localStorage.setItem(ACTIVE_STUDENT_STORAGE_KEY, resolvedPrn);
  }

  window.localStorage.setItem(
    STUDENT_PROFILE_VERIFIED_STORAGE_KEY,
    profileData?.verification?.isProfileVerified ? "true" : "false",
  );
  window.dispatchEvent(new Event(STUDENT_PROFILE_VERIFICATION_EVENT));

  return profileData;
}

export {
  STUDENT_PROFILE_VERIFICATION_EVENT,
  STUDENT_PROFILE_VERIFIED_STORAGE_KEY,
  getStudentProfile,
};
