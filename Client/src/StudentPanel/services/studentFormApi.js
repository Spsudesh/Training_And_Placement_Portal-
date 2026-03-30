import { apiClient } from "../../shared/apiClient";

function appendFileIfPresent(formData, fieldName, fileValue) {
  if (fileValue?.file instanceof File) {
    formData.append(fieldName, fileValue.file);
  }
}

function createPersonalFormData(personal) {
  const formData = new FormData();

  formData.append("prn", personal.prn ?? "");
  formData.append("firstName", personal.firstName ?? "");
  formData.append("middleName", personal.middleName ?? "");
  formData.append("lastName", personal.lastName ?? "");
  formData.append("email", personal.email ?? "");
  formData.append("collegeEmail", personal.collegeEmail ?? "");
  formData.append("mobile", personal.mobile ?? "");
  formData.append("address", personal.address ?? "");
  formData.append("country", personal.country ?? "");
  formData.append("city", personal.city ?? "");
  formData.append("district", personal.district ?? "");
  formData.append("state", personal.state ?? "");
  formData.append("pincode", personal.pincode ?? "");
  formData.append("dob", personal.dob ?? "");
  formData.append("age", personal.age ?? "");
  formData.append("gender", personal.gender ?? "");
  formData.append("category", personal.category ?? "");
  formData.append("handicap", personal.handicap ?? "");
  formData.append("aadhaar", personal.aadhaar ?? "");
  appendFileIfPresent(formData, "profilePhoto", personal.profilePhoto);

  return formData;
}

function createEducationFormData(prn, education) {
  const formData = new FormData();
  const educationTrack =
    education.educationTrack ||
    (education.diplomaInstitute || education.diplomaMarks || education.diplomaYear
      ? "diploma"
      : "twelfth");

  formData.append("prn", prn ?? "");
  formData.append("marks10", education.marks10 ?? "");
  formData.append("board10", education.board10 ?? "");
  formData.append("year10", education.year10 ?? "");
  formData.append("marks12", educationTrack === "twelfth" ? education.marks12 ?? "" : "");
  formData.append("board12", educationTrack === "twelfth" ? education.board12 ?? "" : "");
  formData.append("year12", educationTrack === "twelfth" ? education.year12 ?? "" : "");
  formData.append(
    "diplomaInstitute",
    educationTrack === "diploma" ? education.diplomaInstitute ?? "" : ""
  );
  formData.append(
    "diplomaMarks",
    educationTrack === "diploma" ? education.diplomaMarks ?? "" : ""
  );
  formData.append(
    "diplomaYear",
    educationTrack === "diploma" ? education.diplomaYear ?? "" : ""
  );
  formData.append("gapStatus", education.gapStatus ?? "");
  formData.append("gapReason", education.gapReason ?? "");
  formData.append("department", education.department ?? "");
  formData.append("cgpa", education.cgpa ?? "");
  formData.append("backlogs", education.backlogs ?? "");
  formData.append("graduationYear", education.graduationYear ?? "");
  appendFileIfPresent(formData, "marksheet10", education.marksheet10);
  appendFileIfPresent(
    formData,
    "marksheet12",
    educationTrack === "twelfth" ? education.marksheet12 : ""
  );
  appendFileIfPresent(
    formData,
    "diplomaMarksheet",
    educationTrack === "diploma" ? education.diplomaMarksheet : ""
  );
  appendFileIfPresent(formData, "gapCertificate", education.gapCertificate);

  return formData;
}

function createSkillsFormData(prn, skills) {
  const formData = new FormData();

  formData.append("prn", prn ?? "");
  formData.append("languages", JSON.stringify(skills.languages ?? []));
  formData.append("tools", JSON.stringify(skills.tools ?? []));
  formData.append("frameworks", JSON.stringify(skills.frameworks ?? []));
  formData.append("otherSkills", JSON.stringify(skills.otherSkills ?? []));

  return formData;
}

function createJsonArrayFormData(prn, fieldName, items) {
  const formData = new FormData();
  formData.append("prn", prn ?? "");
  formData.append(fieldName, JSON.stringify(items));
  return formData;
}

function omitFileField(items, fileFieldName) {
  return items.map((item) => {
    const sanitizedItem = { ...item };
    delete sanitizedItem[fileFieldName];
    return sanitizedItem;
  });
}

function createExperienceFormData(prn, experience) {
  const sanitizedExperience = omitFileField(experience, "certificate");
  const formData = createJsonArrayFormData(prn, "experience", sanitizedExperience);

  experience.forEach((entry, index) => {
    appendFileIfPresent(formData, `experienceCertificate_${index}`, entry.certificate);
  });

  return formData;
}

function createCertificationsFormData(prn, certifications) {
  const sanitizedCertifications = omitFileField(certifications, "certificate");
  const formData = createJsonArrayFormData(prn, "certifications", sanitizedCertifications);

  certifications.forEach((entry, index) => {
    appendFileIfPresent(formData, `certificationFile_${index}`, entry.certificate);
  });

  return formData;
}

async function postFormData(endpoint, formData) {
  const response = await apiClient.post(`/student/form${endpoint}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
}

async function savePersonalDetails(personal) {
  return postFormData("/personal_details", createPersonalFormData(personal));
}

async function saveEducationDetails(prn, education) {
  return postFormData("/education_details", createEducationFormData(prn, education));
}

async function saveExperienceDetails(prn, experience) {
  return postFormData("/experience", createExperienceFormData(prn, experience));
}

async function saveProjectsDetails(prn, projects) {
  return postFormData("/projects", createJsonArrayFormData(prn, "projects", projects));
}

async function saveSkillsDetails(prn, skills) {
  return postFormData("/skills", createSkillsFormData(prn, skills));
}

async function saveCertificationDetails(prn, certifications) {
  return postFormData("/certifications", createCertificationsFormData(prn, certifications));
}

async function saveActivitiesDetails(prn, activities) {
  return postFormData("/activities", createJsonArrayFormData(prn, "activities", activities));
}

async function saveConsentDetails(prn, accepted) {
  const formData = new FormData();
  formData.append("prn", prn ?? "");
  formData.append("accepted", accepted ? "true" : "false");
  return postFormData("/consent", formData);
}

async function saveProfileSummaryDetails(prn, summary) {
  const formData = new FormData();
  formData.append("prn", prn ?? "");
  formData.append("summary", summary ?? "");
  return postFormData("/summary", formData);
}

async function getStudentProfileProgress(prn) {
  const response = await apiClient.get(`/student/form/progress/${prn}`);
  return response.data?.data ?? null;
}

export {
  saveActivitiesDetails,
  saveCertificationDetails,
  saveConsentDetails,
  saveEducationDetails,
  saveExperienceDetails,
  getStudentProfileProgress,
  savePersonalDetails,
  saveProfileSummaryDetails,
  saveProjectsDetails,
  saveSkillsDetails,
};
