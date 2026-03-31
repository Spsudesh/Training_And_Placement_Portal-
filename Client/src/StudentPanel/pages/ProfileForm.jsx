import { useEffect, useReducer, useState } from "react";
import CertificationsSection from "../components/CertificationsSection";
import ConsentSection from "../components/ConsentSection";
import EducationalDetailsSection from "../components/EducationalDetailsSection";
import ExperienceSection from "../components/ExperienceSection";
import ExtraActivitiesSection from "../components/ExtraActivitiesSection";
import PersonalDetailsSection from "../components/PersonalDetailsSection";
import ProjectsSection from "../components/ProjectsSection";
import StepIndicator from "../components/StepIndicator";
import TechnicalSkillsSection from "../components/TechnicalSkillsSection";
import {
  getStudentProfileProgress,
  saveActivitiesDetails,
  saveCertificationDetails,
  saveConsentDetails,
  saveEducationDetails,
  saveExperienceDetails,
  savePersonalDetails,
  saveProjectsDetails,
  saveSkillsDetails,
} from "../services/studentFormApi";
import { getStudentProfile } from "../profile/services/studentProfileApi";

const LOCATION_FIELD_NAMES = new Set(["country", "state", "district", "city"]);
const progressColumnToStepIndex = {
  personal_details_completed: 0,
  education_details_completed: 1,
  experience_completed: 2,
  projects_completed: 3,
  skills_completed: 4,
  certifications_completed: 5,
  activities_completed: 6,
  consent_completed: 7,
};
const progressStepKeyToIndex = {
  personal: 0,
  personal_details: 0,
  education: 1,
  education_details: 1,
  experience: 2,
  projects: 3,
  skills: 4,
  certifications: 5,
  activities: 6,
  consent: 7,
};

function calculateAgeFromDob(dobValue) {
  if (!dobValue) {
    return "";
  }

  const birthDate = new Date(dobValue);

  if (Number.isNaN(birthDate.getTime())) {
    return "";
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return age >= 0 ? String(age) : "";
}

function normalizeLocationInput(value) {
  const normalizedValue = String(value ?? "")
    .replace(/\s+/g, " ")
    .trimStart()
    .toLowerCase();

  return normalizedValue.replace(/\b\w/g, (character) => character.toUpperCase());
}

const steps = [
  "Personal",
  "Education",
  "Experience",
  "Projects",
  "Skills",
  "Certifications",
  "Activities",
  "Consent",
];

const createExperience = () => ({
  type: "",
  companyName: "",
  role: "",
  duration: "",
  description: "",
  certificate: "",
});

const createProject = () => ({
  title: "",
  description: "",
  techStack: "",
  githubLink: "",
  liveLink: "",
});

const createCertification = () => ({
  name: "",
  platform: "",
  certificate: "",
});

const createActivity = () => ({
  title: "",
  description: "",
  links: "",
});

function createProfilePhotoValue(profilePhotoUrl) {
  if (!profilePhotoUrl) {
    return "";
  }

  return {
    name: "Profile Photo",
    type: "",
    url: profilePhotoUrl,
  };
}

function mapProfileToPersonalForm(profileData = {}) {
  return {
    prn: profileData.prn ?? "",
    firstName: profileData.firstName ?? "",
    middleName: profileData.middleName ?? "",
    lastName: profileData.lastName ?? "",
    email: profileData.email ?? "",
    collegeEmail: profileData.collegeEmail ?? "",
    mobile: profileData.mobile ?? "",
    address: profileData.address ?? "",
    country: profileData.country ?? "",
    state: profileData.state ?? "",
    district: profileData.district ?? "",
    city: profileData.city ?? "",
    pincode: profileData.pincode ?? "",
    dob: profileData.dob ?? "",
    age:
      profileData.age !== undefined && profileData.age !== null && profileData.age !== ""
        ? String(profileData.age)
        : calculateAgeFromDob(profileData.dob),
    bloodGroup: profileData.bloodGroup ?? "",
    gender: profileData.gender ?? "",
    category: profileData.category ?? "",
    handicap: profileData.handicap ?? "",
    aadhaar: profileData.aadhaar ?? "",
    panNumber: profileData.panNumber ?? "",
    profilePhoto: createProfilePhotoValue(profileData.profilePhotoUrl),
  };
}

function getFileNameFromUrl(fileUrl, fallbackLabel) {
  if (!fileUrl) {
    return fallbackLabel;
  }

  const normalizedUrl = String(fileUrl).split("?")[0];
  const urlParts = normalizedUrl.split("/");
  return urlParts[urlParts.length - 1] || fallbackLabel;
}

function createExistingFileValue(fileUrl, fallbackLabel) {
  if (!fileUrl) {
    return "";
  }

  return {
    name: getFileNameFromUrl(fileUrl, fallbackLabel),
    type: "",
    url: fileUrl,
  };
}

function mapProfileToEducationForm(profileData = {}) {
  return {
    educationTrack: profileData.education?.diploma?.year ? "diploma" : "twelfth",
    marks10: profileData.education?.tenth?.marks ?? "",
    marksheet10: createExistingFileValue(
      profileData.education?.tenth?.marksheetUrl,
      "10th Marksheet",
    ),
    board10: profileData.education?.tenth?.board ?? "",
    year10: profileData.education?.tenth?.year ?? "",
    marks12: profileData.education?.twelfth?.marks ?? "",
    marksheet12: createExistingFileValue(
      profileData.education?.twelfth?.marksheetUrl,
      "12th Marksheet",
    ),
    board12: profileData.education?.twelfth?.board ?? "",
    year12: profileData.education?.twelfth?.year ?? "",
    diplomaInstitute: profileData.education?.diploma?.institute ?? "",
    diplomaMarks: profileData.education?.diploma?.marks ?? "",
    diplomaYear: profileData.education?.diploma?.year ?? "",
    diplomaMarksheet: createExistingFileValue(
      profileData.education?.diploma?.marksheetUrl,
      "Diploma Marksheet",
    ),
    gapStatus: profileData.gap === "YES" ? "Yes" : "No",
    gapReason: profileData.gapReason ?? "",
    gapCertificate: createExistingFileValue(
      profileData.education?.gapCertificateUrl,
      "Gap Certificate",
    ),
    department: profileData.department ?? "",
    cgpa: profileData.currentCgpa ?? "",
    backlogs: profileData.backlogs ?? "",
    graduationYear: profileData.passingYear ?? "",
  };
}

function mapProfileToExperienceForm(profileData = {}) {
  return profileData.experience?.length
    ? profileData.experience.map((entry) => ({
        expNumber: entry.expNumber,
        type: entry.type ?? "",
        companyName: entry.companyName ?? "",
        role: entry.role ?? "",
        duration: entry.duration ?? "",
        description: entry.description ?? "",
        certificate: createExistingFileValue(
          entry.certificateUrl,
          `${entry.companyName || "Experience"} Certificate`,
        ),
      }))
    : [createExperience()];
}

function mapProfileToProjectsForm(profileData = {}) {
  return profileData.projects?.length
    ? profileData.projects.map((project) => ({
        projectNumber: project.projectNumber,
        title: project.title ?? "",
        description: project.description ?? "",
        techStack: project.techStack ?? "",
        githubLink: project.githubLink ?? "",
        liveLink: project.liveLink ?? "",
      }))
    : [createProject()];
}

function mapProfileToSkillsForm(profileData = {}) {
  return {
    languages: profileData.skills?.languages ?? [],
    tools: profileData.skills?.tools ?? [],
    frameworks: profileData.skills?.frameworks ?? [],
    otherSkills: profileData.skills?.otherSkills ?? [],
  };
}

function mapProfileToCertificationsForm(profileData = {}) {
  return profileData.certifications?.length
    ? profileData.certifications.map((entry) => ({
        certNumber: entry.certNumber,
        name: entry.name ?? "",
        platform: entry.platform ?? "",
        certificate: createExistingFileValue(
          entry.certificateUrl,
          `${entry.name || "Certificate"}.pdf`,
        ),
      }))
    : [createCertification()];
}

function mapProfileToActivitiesForm(profileData = {}) {
  return profileData.activities?.length
    ? profileData.activities.map((entry) => ({
        actNumber: entry.actNumber,
        title: entry.title ?? "",
        description: entry.description ?? "",
        links: entry.link ?? "",
      }))
    : [createActivity()];
}

function getCompletedStepsFromProgress(progress) {
  const completedFromFlags = Object.entries(progressColumnToStepIndex)
    .filter(([columnName]) => Boolean(progress?.[columnName]))
    .map(([, stepIndex]) => stepIndex)
    .sort((left, right) => left - right);

  const normalizedLastCompletedStep = String(progress?.last_completed_step || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  const lastCompletedStepIndex = progressStepKeyToIndex[normalizedLastCompletedStep];

  if (lastCompletedStepIndex === undefined) {
    return completedFromFlags;
  }

  const completedSteps = new Set(completedFromFlags);

  for (let index = 0; index <= lastCompletedStepIndex; index += 1) {
    completedSteps.add(index);
  }

  return Array.from(completedSteps).sort((left, right) => left - right);
}

function hasMeaningfulText(value) {
  return String(value ?? "").trim() !== "";
}

function hasExistingFile(value) {
  return Boolean(value && typeof value === "object" && (value.file || value.url || value.name));
}

function getCompletedStepsFromProfileData(profileData) {
  if (!profileData) {
    return [];
  }

  const completedSteps = [];

  const hasPersonalDetails =
    hasMeaningfulText(profileData.firstName) &&
    hasMeaningfulText(profileData.lastName) &&
    hasMeaningfulText(profileData.mobile) &&
    hasMeaningfulText(profileData.address) &&
    hasMeaningfulText(profileData.dob) &&
    hasMeaningfulText(profileData.gender) &&
    hasMeaningfulText(profileData.aadhaar);

  if (hasPersonalDetails) {
    completedSteps.push(0);
  }

  const hasEducationDetails = Boolean(
    profileData.department ||
      profileData.currentCgpa ||
      profileData.passingYear ||
      profileData.education?.tenth?.year ||
      profileData.education?.twelfth?.year ||
      profileData.education?.diploma?.year,
  );

  if (hasEducationDetails) {
    completedSteps.push(1);
  }

  if (profileData.experience?.length) {
    completedSteps.push(2);
  }

  if (profileData.projects?.length) {
    completedSteps.push(3);
  }

  const hasSkills = Boolean(
    profileData.skills?.languages?.length ||
      profileData.skills?.tools?.length ||
      profileData.skills?.frameworks?.length ||
      profileData.skills?.otherSkills?.length,
  );

  if (hasSkills) {
    completedSteps.push(4);
  }

  if (profileData.certifications?.length) {
    completedSteps.push(5);
  }

  if (profileData.activities?.length) {
    completedSteps.push(6);
  }

  return completedSteps;
}

function getNextStepIndex(completedSteps) {
  for (let index = 0; index < steps.length; index += 1) {
    if (!completedSteps.includes(index)) {
      return index;
    }
  }

  return steps.length - 1;
}

const personalRequiredFields = [
  ["prn", "PRN"],
  ["firstName", "First Name"],
  ["middleName", "Middle Name"],
  ["lastName", "Last Name"],
  ["email", "Personal Email"],
  ["collegeEmail", "College Email"],
  ["mobile", "Mobile Number"],
  ["address", "Address"],
  ["country", "Country"],
  ["state", "State"],
  ["district", "District"],
  ["city", "City"],
  ["pincode", "Pincode"],
  ["dob", "Date of Birth"],
  ["age", "Age"],
  ["bloodGroup", "Blood Group"],
  ["gender", "Gender"],
  ["category", "Category"],
  ["handicap", "Handicap"],
  ["aadhaar", "Aadhaar Number"],
  ["panNumber", "PAN Number"],
  ["profilePhoto", "Profile Photo"],
];

function hasValue(value) {
  if (typeof value === "string") {
    return value.trim() !== "";
  }

  if (typeof value === "number") {
    return !Number.isNaN(value);
  }

  if (typeof value === "object" && value !== null) {
    return Boolean(value.name || value.file || value.url);
  }

  return Boolean(value);
}

function getMissingPersonalFields(personal) {
  return personalRequiredFields
    .filter(([fieldName]) => !hasValue(personal[fieldName]))
    .map(([, label]) => label);
}

const initialState = {
  currentStep: 0,
  completedSteps: [],
  formData: {
    personal: {
      prn: "",
      firstName: "",
      middleName: "",
      lastName: "",
      email: "",
      collegeEmail: "",
      mobile: "",
      address: "",
      country: "",
      state: "",
      district: "",
      city: "",
      pincode: "",
      dob: "",
      age: "",
      bloodGroup: "",
      gender: "",
      category: "",
      handicap: "",
      aadhaar: "",
      panNumber: "",
      profilePhoto: "",
    },
    education: {
      educationTrack: "twelfth",
      marks10: "",
      marksheet10: "",
      board10: "",
      year10: "",
      marks12: "",
      marksheet12: "",
      board12: "",
      year12: "",
      diplomaInstitute: "",
      diplomaMarks: "",
      diplomaYear: "",
      diplomaMarksheet: "",
      gapStatus: "",
      gapReason: "",
      gapCertificate: "",
      department: "",
      cgpa: "",
      backlogs: "",
      graduationYear: "",
    },
    experience: [createExperience()],
    projects: [createProject()],
    skills: {
      languages: [],
      tools: [],
      frameworks: [],
      otherSkills: [],
    },
    certifications: [createCertification()],
    activities: [createActivity()],
    consent: {
      accepted: false,
    },
  },
};

function removeCompletedStep(completedSteps, stepIndex) {
  return completedSteps.filter((completedStep) => completedStep !== stepIndex);
}

function revokeFileUrl(fileValue) {
  if (
    fileValue &&
    typeof fileValue === "object" &&
    fileValue.url &&
    fileValue.url.startsWith("blob:")
  ) {
    URL.revokeObjectURL(fileValue.url);
  }
}

function reducer(state, action) {
  switch (action.type) {
    case "UPDATE_SECTION_FIELD":
      return {
        ...state,
        completedSteps: removeCompletedStep(state.completedSteps, action.stepIndex),
        formData: {
          ...state.formData,
          [action.section]: {
            ...state.formData[action.section],
            [action.name]: action.value,
          },
        },
      };

    case "UPDATE_SECTION_FIELDS":
      return {
        ...state,
        completedSteps: removeCompletedStep(state.completedSteps, action.stepIndex),
        formData: {
          ...state.formData,
          [action.section]: {
            ...state.formData[action.section],
            ...action.updates,
          },
        },
      };

    case "UPDATE_LIST_ITEM":
      return {
        ...state,
        completedSteps: removeCompletedStep(state.completedSteps, action.stepIndex),
        formData: {
          ...state.formData,
          [action.section]: state.formData[action.section].map((item, index) =>
            index === action.index
              ? { ...item, [action.name]: action.value }
              : item
          ),
        },
      };

    case "ADD_LIST_ITEM":
      return {
        ...state,
        completedSteps: removeCompletedStep(state.completedSteps, action.stepIndex),
        formData: {
          ...state.formData,
          [action.section]: [...state.formData[action.section], action.item],
        },
      };

    case "REMOVE_LIST_ITEM":
      return {
        ...state,
        completedSteps: removeCompletedStep(state.completedSteps, action.stepIndex),
        formData: {
          ...state.formData,
          [action.section]: state.formData[action.section].filter(
            (_, index) => index !== action.index
          ),
        },
      };

    case "SAVE_STEP":
      return {
        ...state,
        completedSteps: state.completedSteps.includes(action.stepIndex)
          ? state.completedSteps
          : [...state.completedSteps, action.stepIndex],
      };

    case "GO_TO_STEP":
      return {
        ...state,
        currentStep: action.stepIndex,
      };

    case "INITIALIZE_FORM":
      return {
        ...state,
        currentStep: action.currentStep,
        completedSteps: action.completedSteps,
        formData: {
          ...state.formData,
          ...action.formData,
        },
      };

    default:
      return state;
  }
}

function ProfileForm({ onComplete }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [isSaving, setIsSaving] = useState(false);
  const { currentStep, completedSteps, formData } = state;
  const isCurrentStepSaved = completedSteps.includes(currentStep);

  useEffect(() => {
    let isMounted = true;

    async function loadStudentFormContext() {
      try {
        const profileData = await getStudentProfile().catch(() => null);
        const activePrn = String(
          profileData?.prn ||
            window.localStorage.getItem("training-placement-active-student") ||
            "",
        ).trim();
        const progressData = activePrn
          ? await getStudentProfileProgress(activePrn).catch(() => null)
          : null;

        if (!isMounted) {
          return;
        }

        const completedStepsFromProgress = getCompletedStepsFromProgress(progressData);
        const completedStepsFromProfile = getCompletedStepsFromProfileData(profileData);
        const completedSteps = Array.from(
          new Set([...completedStepsFromProgress, ...completedStepsFromProfile]),
        ).sort((left, right) => left - right);

        dispatch({
          type: "INITIALIZE_FORM",
          currentStep: getNextStepIndex(completedSteps),
          completedSteps,
          formData: profileData
            ? {
                personal: mapProfileToPersonalForm(profileData),
                education: mapProfileToEducationForm(profileData),
                experience: mapProfileToExperienceForm(profileData),
                projects: mapProfileToProjectsForm(profileData),
                skills: mapProfileToSkillsForm(profileData),
                certifications: mapProfileToCertificationsForm(profileData),
                activities: mapProfileToActivitiesForm(profileData),
                consent: {
                  accepted: Boolean(progressData?.consent_completed),
                },
              }
            : {
                personal: {
                  ...initialState.formData.personal,
                  prn: activePrn,
                },
                consent: {
                  accepted: Boolean(progressData?.consent_completed),
                },
              },
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        dispatch({
          type: "INITIALIZE_FORM",
          currentStep: 0,
          completedSteps: [],
          formData: {
            personal: {
              ...initialState.formData.personal,
              prn: window.localStorage.getItem("training-placement-active-student") || "",
            },
          },
        });
      }
    }

    loadStudentFormContext();

    return () => {
      isMounted = false;
    };
  }, []);

  const updateSectionField = (section, stepIndex) => (event) => {
    const { name } = event.target;
    let { value } = event.target;

    if (section === "personal") {
      if (LOCATION_FIELD_NAMES.has(name)) {
        value = normalizeLocationInput(value);
      }

      if (name === "dob") {
        dispatch({
          type: "UPDATE_SECTION_FIELDS",
          section,
          stepIndex,
          updates: {
            dob: value,
            age: calculateAgeFromDob(value),
          },
        });
        return;
      }
    }

    dispatch({
      type: "UPDATE_SECTION_FIELD",
      section,
      stepIndex,
      name,
      value,
    });
  };

  const updateSectionFile = (section, stepIndex) => (event) => {
    const file = event.target.files?.[0];
    const { name } = event.target;

    revokeFileUrl(state.formData[section][name]);

    dispatch({
      type: "UPDATE_SECTION_FIELD",
      section,
      stepIndex,
      name,
      value: file
        ? {
            file,
            name: file.name,
            type: file.type,
            url: URL.createObjectURL(file),
          }
        : "",
    });
  };

  const updateSkills = (skillType, values) => {
    dispatch({
      type: "UPDATE_SECTION_FIELD",
      section: "skills",
      stepIndex: 4,
      name: skillType,
      value: values,
    });
  };

  const updateListItem = (section, stepIndex) => (index, event) => {
    const { name, value } = event.target;
    dispatch({
      type: "UPDATE_LIST_ITEM",
      section,
      stepIndex,
      index,
      name,
      value,
    });
  };

  const updateListItemFile = (section, stepIndex) => (index, event) => {
    const file = event.target.files?.[0];
    const { name } = event.target;

    revokeFileUrl(state.formData[section][index][name]);

    dispatch({
      type: "UPDATE_LIST_ITEM",
      section,
      stepIndex,
      index,
      name,
      value: file
        ? {
            file,
            name: file.name,
            type: file.type,
            url: URL.createObjectURL(file),
          }
        : "",
    });
  };

  const addListItem = (section, stepIndex, itemFactory) => () => {
    dispatch({
      type: "ADD_LIST_ITEM",
      section,
      stepIndex,
      item: itemFactory(),
    });
  };

  const removeListItem = (section, stepIndex) => (index) => {
    if (state.formData[section].length === 1) {
      return;
    }

    dispatch({
      type: "REMOVE_LIST_ITEM",
      section,
      stepIndex,
      index,
    });
  };

  const saveStep = async (stepIndex) => {
    const stepLabel = steps[stepIndex];

    if (completedSteps.includes(stepIndex)) {
      window.alert(`${stepLabel} details have already been submitted.`);
      return;
    }

    const confirmed = window.confirm(
      `Do you want to save the ${stepLabel} section? Please confirm before continuing.`
    );

    if (!confirmed) {
      return;
    }

    if (stepIndex !== 0 && !formData.personal.prn) {
      window.alert("Please fill and save PRN in Personal Details first.");
      return;
    }

    if (stepIndex === 0) {
      const missingFields = getMissingPersonalFields(formData.personal);

      if (missingFields.length > 0) {
        window.alert(
          `Please fill all mandatory personal details before saving.\n\nMissing fields: ${missingFields.join(", ")}`
        );
        return;
      }
    }

    try {
      setIsSaving(true);

      switch (stepIndex) {
        case 0:
          await savePersonalDetails(formData.personal);
          break;
        case 1:
          await saveEducationDetails(formData.personal.prn, formData.education);
          break;
        case 2:
          await saveExperienceDetails(formData.personal.prn, formData.experience);
          break;
        case 3:
          await saveProjectsDetails(formData.personal.prn, formData.projects);
          break;
        case 4:
          await saveSkillsDetails(formData.personal.prn, formData.skills);
          break;
        case 5:
          await saveCertificationDetails(formData.personal.prn, formData.certifications);
          break;
        case 6:
          await saveActivitiesDetails(formData.personal.prn, formData.activities);
          break;
        case 7:
          await saveConsentDetails(formData.personal.prn, formData.consent.accepted);
          dispatch({ type: "SAVE_STEP", stepIndex });
          window.alert("Final submission completed successfully.");
          onComplete?.();
          return;
        default:
          return;
      }

      dispatch({ type: "SAVE_STEP", stepIndex });
      if (stepIndex < steps.length - 1) {
        dispatch({ type: "GO_TO_STEP", stepIndex: stepIndex + 1 });
      }
      window.alert(`${stepLabel} details saved successfully.`);
    } catch (error) {
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        `Failed to save ${stepLabel.toLowerCase()} details.`;
      window.alert(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = () => {
    if (!isCurrentStepSaved || currentStep === steps.length - 1) {
      return;
    }

    dispatch({ type: "GO_TO_STEP", stepIndex: currentStep + 1 });
  };

  const handlePrev = () => {
    if (currentStep === 0) {
      return;
    }

    dispatch({ type: "GO_TO_STEP", stepIndex: currentStep - 1 });
  };

  const handleStepClick = (stepIndex) => {
    const highestCompleted = completedSteps.length
      ? Math.max(...completedSteps)
      : -1;

    if (stepIndex <= highestCompleted + 1) {
      dispatch({ type: "GO_TO_STEP", stepIndex });
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <PersonalDetailsSection
            data={formData.personal}
            onFieldChange={updateSectionField("personal", 0)}
            onFileChange={updateSectionFile("personal", 0)}
            onSave={() => saveStep(0)}
            isSaved={completedSteps.includes(0) && !isSaving}
          />
        );
      case 1:
        return (
          <EducationalDetailsSection
            data={formData.education}
            onFieldChange={updateSectionField("education", 1)}
            onFileChange={updateSectionFile("education", 1)}
            onSave={() => saveStep(1)}
            isSaved={completedSteps.includes(1) && !isSaving}
          />
        );
      case 2:
        return (
          <ExperienceSection
            data={formData.experience}
            onEntryChange={updateListItem("experience", 2)}
            onEntryFileChange={updateListItemFile("experience", 2)}
            onAddEntry={addListItem("experience", 2, createExperience)}
            onRemoveEntry={removeListItem("experience", 2)}
            onSave={() => saveStep(2)}
            isSaved={completedSteps.includes(2) && !isSaving}
          />
        );
      case 3:
        return (
          <ProjectsSection
            data={formData.projects}
            onEntryChange={updateListItem("projects", 3)}
            onAddEntry={addListItem("projects", 3, createProject)}
            onRemoveEntry={removeListItem("projects", 3)}
            onSave={() => saveStep(3)}
            isSaved={completedSteps.includes(3) && !isSaving}
          />
        );
      case 4:
        return (
          <TechnicalSkillsSection
            data={formData.skills}
            onSkillsChange={updateSkills}
            onSave={() => saveStep(4)}
            isSaved={completedSteps.includes(4) && !isSaving}
          />
        );
      case 5:
        return (
          <CertificationsSection
            data={formData.certifications}
            onEntryChange={updateListItem("certifications", 5)}
            onEntryFileChange={updateListItemFile("certifications", 5)}
            onAddEntry={addListItem("certifications", 5, createCertification)}
            onRemoveEntry={removeListItem("certifications", 5)}
            onSave={() => saveStep(5)}
            isSaved={completedSteps.includes(5) && !isSaving}
          />
        );
      case 6:
        return (
          <ExtraActivitiesSection
            data={formData.activities}
            onEntryChange={updateListItem("activities", 6)}
            onAddEntry={addListItem("activities", 6, createActivity)}
            onRemoveEntry={removeListItem("activities", 6)}
            onSave={() => saveStep(6)}
            isSaved={completedSteps.includes(6) && !isSaving}
          />
        );
      case 7:
        return (
          <ConsentSection
            data={formData.consent}
            onConsentChange={() =>
              dispatch({
                type: "UPDATE_SECTION_FIELD",
                section: "consent",
                stepIndex: 7,
                name: "accepted",
                value: !formData.consent.accepted,
              })
            }
            onSave={() => saveStep(7)}
            isSaved={completedSteps.includes(7) && !isSaving}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-[90rem]">
        <div className="mb-6 rounded-3xl border border-slate-200 bg-white/90 px-6 py-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-800">
                Student Panel
              </p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">
                Training and Placement Profile Form
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Complete all eight sections carefully to build your placement
                profile. Save each section before moving to the next step.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Current Step
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {currentStep + 1} / {steps.length}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Completed
                </p>
                <p className="mt-1 text-lg font-semibold text-emerald-700">
                  {completedSteps.length}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Status
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {isCurrentStepSaved ? "Saved" : "Pending"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <StepIndicator
          steps={steps}
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={handleStepClick}
        />

        <div
          className={`mt-6 ${
            completedSteps.includes(currentStep) ? "pointer-events-none opacity-90" : ""
          }`}
        >
          {renderStep()}
        </div>

        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.08)] sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            disabled={currentStep === 0}
            onClick={handlePrev}
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>

          <div className="text-sm text-slate-500">
            {isCurrentStepSaved
              ? "This section is saved. You can move ahead."
              : isSaving
              ? "Saving your section data..."
              : "Save this section to unlock the next step."}
          </div>

          <button
            type="button"
            disabled={isSaving || !isCurrentStepSaved || currentStep === steps.length - 1}
            onClick={handleNext}
            className="inline-flex items-center justify-center rounded-xl bg-blue-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {currentStep === steps.length - 1 ? "Final Step" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProfileForm;
