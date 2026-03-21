import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/student/form",
});

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

  formData.append("prn", prn ?? "");
  formData.append("marks10", education.marks10 ?? "");
  formData.append("board10", education.board10 ?? "");
  formData.append("year10", education.year10 ?? "");
  formData.append("marks12", education.marks12 ?? "");
  formData.append("board12", education.board12 ?? "");
  formData.append("year12", education.year12 ?? "");
  formData.append("diplomaInstitute", education.diplomaInstitute ?? "");
  formData.append("diplomaMarks", education.diplomaMarks ?? "");
  formData.append("diplomaYear", education.diplomaYear ?? "");
  formData.append("gapStatus", education.gapStatus ?? "");
  formData.append("gapReason", education.gapReason ?? "");
  formData.append("department", education.department ?? "");
  formData.append("cgpa", education.cgpa ?? "");
  formData.append("backlogs", education.backlogs ?? "");
  formData.append("graduationYear", education.graduationYear ?? "");
  appendFileIfPresent(formData, "marksheet10", education.marksheet10);
  appendFileIfPresent(formData, "marksheet12", education.marksheet12);
  appendFileIfPresent(formData, "diplomaMarksheet", education.diplomaMarksheet);
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

function createExperienceFormData(prn, experience) {
  const sanitizedExperience = experience.map(({ certificate, ...entry }) => entry);
  const formData = createJsonArrayFormData(prn, "experience", sanitizedExperience);

  experience.forEach((entry, index) => {
    appendFileIfPresent(formData, `experienceCertificate_${index}`, entry.certificate);
  });

  return formData;
}

function createCertificationsFormData(prn, certifications) {
  const sanitizedCertifications = certifications.map(({ certificate, ...entry }) => entry);
  const formData = createJsonArrayFormData(prn, "certifications", sanitizedCertifications);

  certifications.forEach((entry, index) => {
    appendFileIfPresent(formData, `certificationFile_${index}`, entry.certificate);
  });

  return formData;
}

async function postFormData(endpoint, formData) {
  const response = await api.post(endpoint, formData, {
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

export {
  saveActivitiesDetails,
  saveCertificationDetails,
  saveEducationDetails,
  saveExperienceDetails,
  savePersonalDetails,
  saveProjectsDetails,
  saveSkillsDetails,
};
