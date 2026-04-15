import { useEffect, useState } from "react";
import CertificationsSection from "../../components/CertificationsSection";
import EducationalDetailsSection from "../../components/EducationalDetailsSection";
import ExperienceSection from "../../components/ExperienceSection";
import ExtraActivitiesSection from "../../components/ExtraActivitiesSection";
import {
  FieldGrid,
  SaveButton,
  SectionCard,
  TextInput,
} from "../../components/FormUI";
import PersonalDetailsSection from "../../components/PersonalDetailsSection";
import ProjectsSection from "../../components/ProjectsSection";
import TechnicalSkillsSection from "../../components/TechnicalSkillsSection";
import {
  saveActivitiesDetails,
  saveCertificationDetails,
  saveEducationDetails,
  saveExperienceDetails,
  savePersonalDetails,
  saveProfileSummaryDetails,
  saveProjectsDetails,
  saveSkillsDetails,
} from "../../services/studentFormApi";
import ProfileSidebarCard from "../components/ProfileSidebarCard";
import {
  ProfileChipGroup,
  ProfileDocumentPreviewModal,
  ProfileFieldList,
  ProfileItemCard,
  ProfileSection,
} from "../components/ProfileSection";
import {
  createEmptyStudentProfile,
  profileSectionLinks,
} from "../data/mockStudentProfile";
import {
  getStudentProfile,
  STUDENT_PROFILE_VERIFICATION_EVENT,
  STUDENT_PROFILE_VERIFIED_STORAGE_KEY,
} from "../services/studentProfileApi";

const SECTION_VERIFICATION_STORAGE_KEY = "training-placement-student-section-verification";

const createExperienceEntry = () => ({
  type: "",
  companyName: "",
  role: "",
  duration: "",
  durationUnit: "",
  durationValue: "",
  startMonth: "",
  endMonth: "",
  description: "",
  certificate: "",
  certificateUrl: "",
});

const createProjectEntry = () => ({
  title: "",
  description: "",
  techStack: "",
  githubLink: "",
  liveLink: "",
});

const createCertificationEntry = () => ({
  name: "",
  platform: "",
  link: "",
  duration: "",
  durationSummary: "",
  durationValue: "",
  durationUnit: "",
  startMonth: "",
  endMonth: "",
  certificate: "",
  certificateUrl: "",
});

const createActivityEntry = () => ({
  title: "",
  description: "",
  links: "",
});

const createDeadBacklogEntry = () => ({
  semester: "",
  count: "",
});

function formatDate(dateValue) {
  if (!dateValue) {
    return "-";
  }

  return new Date(dateValue).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatAddress(profile) {
  return [
    profile.address,
    profile.city,
    profile.district,
    profile.state,
    profile.pincode,
  ]
    .filter(Boolean)
    .join(", ");
}

function buildDocumentUrl(filePath) {
  if (!filePath || filePath === "xyz") {
    return "";
  }

  if (/^https?:\/\//i.test(filePath)) {
    return filePath;
  }

  if (filePath.startsWith("/uploads/")) {
    return `http://localhost:3000${filePath}`;
  }

  if (filePath.startsWith("uploads/")) {
    return `http://localhost:3000/${filePath}`;
  }

  return filePath;
}

function inferFileType(fileUrl) {
  const normalizedUrl = String(fileUrl || "").toLowerCase();

  if (
    [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"].some((extension) =>
      normalizedUrl.endsWith(extension)
    )
  ) {
    return "image/*";
  }

  if (normalizedUrl.endsWith(".pdf")) {
    return "application/pdf";
  }

  return "";
}

function buildPreviewUrl(fileUrl, fileLabel) {
  const fileType = inferFileType(fileUrl);

  if (fileType === "application/pdf") {
    const params = new URLSearchParams({
      url: fileUrl,
      name: fileLabel || "document.pdf",
    });

    return `http://localhost:3000/student/profile/document?${params.toString()}`;
  }

  return fileUrl;
}

function normalizeExternalUrl(url) {
  if (!url) {
    return "";
  }

  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function calculatePercentageFromCgpa(cgpaValue) {
  if (cgpaValue === undefined || cgpaValue === null || cgpaValue === "") {
    return "";
  }

  const parsedCgpa = Number(cgpaValue);

  if (Number.isNaN(parsedCgpa)) {
    return "";
  }

  const percentage = parsedCgpa * 10 - 7.5;
  return percentage > 0 ? percentage.toFixed(2) : "";
}

function formatExperienceMonth(monthValue) {
  if (!monthValue || !/^\d{4}-\d{2}$/.test(monthValue)) {
    return "";
  }

  const [year, month] = monthValue.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);

  return date.toLocaleString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function buildExperienceDuration(durationValue, durationUnit, startMonth, endMonth) {
  const normalizedValue = String(durationValue ?? "").trim();
  const normalizedUnit = String(durationUnit ?? "").trim().toLowerCase();
  const quantityPart =
    normalizedValue && normalizedUnit
      ? `${normalizedValue} ${
          normalizedUnit === "weeks" && normalizedValue === "1" ? "Week" : normalizedUnit === "weeks" ? "Weeks" : normalizedValue === "1" ? "Day" : "Days"
        }`
      : "";
  const startLabel = formatExperienceMonth(startMonth);
  const endLabel = formatExperienceMonth(endMonth);
  const monthPart = startLabel && endLabel ? `${startLabel} - ${endLabel}` : "";

  return [quantityPart, monthPart].filter(Boolean).join(" | ");
}

function parseExperienceDuration(durationValue) {
  const normalizedValue = String(durationValue ?? "").trim();
  const parsedDuration = {
    durationUnit: "",
    durationValue: "",
    startMonth: "",
    endMonth: "",
  };

  const quantityMatch = normalizedValue.match(/(\d+)\s+(day|days|week|weeks)/i);

  if (quantityMatch) {
    parsedDuration.durationValue = quantityMatch[1];
    parsedDuration.durationUnit = quantityMatch[2].toLowerCase().startsWith("week")
      ? "weeks"
      : "days";
  }

  const monthRangeMatch = normalizedValue.match(
    /([A-Za-z]{3,9})\s+(\d{4})\s*-\s*([A-Za-z]{3,9})\s+(\d{4})/i,
  );

  if (monthRangeMatch) {
    const startDate = new Date(`${monthRangeMatch[1]} 1, ${monthRangeMatch[2]}`);
    const endDate = new Date(`${monthRangeMatch[3]} 1, ${monthRangeMatch[4]}`);

    if (!Number.isNaN(startDate.getTime())) {
      parsedDuration.startMonth = `${startDate.getFullYear()}-${String(
        startDate.getMonth() + 1,
      ).padStart(2, "0")}`;
    }

    if (!Number.isNaN(endDate.getTime())) {
      parsedDuration.endMonth = `${endDate.getFullYear()}-${String(
        endDate.getMonth() + 1,
      ).padStart(2, "0")}`;
    }
  }

  return parsedDuration;
}

const LOCATION_FIELD_NAMES = new Set(["country", "state", "district", "city"]);

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

function getFileNameFromUrl(fileUrl, fallbackLabel) {
  if (!fileUrl) {
    return fallbackLabel;
  }

  const normalizedUrl = String(fileUrl).split("?")[0];
  const urlParts = normalizedUrl.split("/");
  return urlParts[urlParts.length - 1] || fallbackLabel;
}

function createExistingFileValue(fileUrl, fallbackLabel) {
  const sourceUrl = buildDocumentUrl(fileUrl);

  if (!sourceUrl) {
    return "";
  }

  return {
    name: getFileNameFromUrl(fileUrl, fallbackLabel),
    type: inferFileType(sourceUrl),
    url: buildPreviewUrl(sourceUrl, fallbackLabel),
  };
}

function mapProfileToEducationForm(profile) {
  return {
    educationTrack: profile.education.diploma?.year ? "diploma" : "twelfth",
    schoolName10: profile.education.tenth?.schoolName ?? "",
    marks10: profile.education.tenth?.marks ?? "",
    mathsMarks10: profile.education.tenth?.mathsMarks ?? "",
    marksheet10: createExistingFileValue(profile.education.tenth?.marksheetUrl, "10th Marksheet"),
    board10: profile.education.tenth?.board ?? "",
    year10: profile.education.tenth?.year ?? "",
    collegeName12: profile.education.twelfth?.collegeName ?? "",
    marks12: profile.education.twelfth?.marks ?? "",
    mathsMarks12: profile.education.twelfth?.mathsMarks ?? "",
    marksheet12: createExistingFileValue(profile.education.twelfth?.marksheetUrl, "12th Marksheet"),
    board12: profile.education.twelfth?.board ?? "",
    year12: profile.education.twelfth?.year ?? "",
    diplomaInstitute: profile.education.diploma?.institute ?? "",
    diplomaMarks: profile.education.diploma?.marks ?? "",
    diplomaYear: profile.education.diploma?.year ?? "",
    diplomaMarksheet: createExistingFileValue(
      profile.education.diploma?.marksheetUrl,
      "Diploma Marksheet",
    ),
    gapStatus: profile.gap === "YES" ? "Yes" : "No",
    gapReason: profile.gapReason ?? "",
    gapCertificate: createExistingFileValue(
      profile.education.gapCertificateUrl,
      "Gap Certificate",
    ),
    entranceExamType: profile.education.twelfth?.entranceExamType ?? "",
    entranceExamScore: profile.education.twelfth?.entranceExamScore ?? "",
    entranceExamCertificate: createExistingFileValue(
      profile.education.twelfth?.entranceExamCertificateUrl,
      "Entrance Exam Certificate",
    ),
    department: profile.department ?? "",
    cgpa: profile.currentCgpa ?? "",
    percentage:
      profile.currentPercentage ??
      calculatePercentageFromCgpa(profile.currentCgpa),
    activeBacklogs: profile.backlogs ?? "",
    backlogs: profile.backlogs ?? "",
    deadBacklogs: profile.deadBacklogs?.length
      ? profile.deadBacklogs.map((entry) => ({
          semester: entry.semester ?? "",
          count: entry.count ?? "",
        }))
      : [createDeadBacklogEntry()],
    graduationYear: profile.passingYear ?? "",
  };
}

function mapProfileToPersonalForm(profile) {
  return {
    prn: profile.prn ?? "",
    firstName: profile.firstName ?? "",
    middleName: profile.middleName ?? "",
    lastName: profile.lastName ?? "",
    email: profile.email ?? "",
    collegeEmail: profile.collegeEmail ?? "",
    mobile: profile.mobile ?? "",
    address: profile.address ?? "",
    country: profile.country ?? "",
    state: profile.state ?? "",
    district: profile.district ?? "",
    city: profile.city ?? "",
    pincode: profile.pincode ?? "",
    dob: profile.dob ?? "",
    age: profile.age ?? "",
    bloodGroup: profile.bloodGroup ?? "",
    gender: profile.gender ?? "",
    category: profile.category ?? "",
    handicap: profile.handicap ?? "",
    aadhaar: profile.aadhaar ?? "",
    panNumber: profile.panNumber ?? "",
    github: profile.github ?? profile.githubUrl ?? profile.github_url ?? "",
    linkedin: profile.linkedin ?? profile.linkedinUrl ?? profile.linkedin_url ?? "",
    portfolio: profile.portfolio ?? profile.portfolioUrl ?? profile.portfolio_url ?? "",
    profilePhoto: createExistingFileValue(profile.profilePhotoUrl, "Profile Photo"),
  };
}

function mapProfileToProfessionalProfilesForm(profile) {
  return {
    github: profile.github ?? profile.githubUrl ?? profile.github_url ?? "",
    linkedin: profile.linkedin ?? profile.linkedinUrl ?? profile.linkedin_url ?? "",
    portfolio: profile.portfolio ?? profile.portfolioUrl ?? profile.portfolio_url ?? "",
  };
}

function mapProfileToSkillsForm(profile) {
  return {
    languages: profile.skills.languages ?? [],
    tools: profile.skills.tools ?? [],
    frameworks: profile.skills.frameworks ?? [],
    otherLanguages: profile.skills.otherLanguages ?? [],
  };
}

function mapProfileToProjectsForm(profile) {
  return profile.projects.length
    ? profile.projects.map((project) => ({
        projectNumber: project.projectNumber,
        title: project.title ?? "",
        description: project.description ?? "",
        techStack: project.techStack ?? "",
        githubLink: project.githubLink ?? "",
        liveLink: project.liveLink ?? "",
      }))
    : [createProjectEntry()];
}

function mapProfileToExperienceForm(profile) {
  return profile.experience.length
    ? profile.experience.map((item) => ({
        ...parseExperienceDuration(item.duration),
        expNumber: item.expNumber,
        type: item.type ?? "",
        companyName: item.companyName ?? "",
        role: item.role ?? "",
        duration: item.duration ?? "",
        description: item.description ?? "",
        certificate: createExistingFileValue(
          item.certificateUrl,
          `${item.companyName || "Experience"} Certificate`,
        ),
        certificateUrl: buildDocumentUrl(item.certificateUrl),
      }))
    : [createExperienceEntry()];
}

function mapProfileToCertificationsForm(profile) {
  return profile.certifications.length
    ? profile.certifications.map((item) => ({
        ...parseExperienceDuration(item.durationSummary || item.duration),
        certNumber: item.certNumber,
        name: item.name ?? "",
        platform: item.platform ?? "",
        link: item.link ?? "",
        duration: item.duration ?? item.durationSummary ?? "",
        durationSummary: item.durationSummary ?? item.duration ?? "",
        durationValue: item.durationValue ?? "",
        durationUnit: item.durationUnit ?? "",
        certificate: createExistingFileValue(item.certificateUrl, `${item.name || "Certificate"}.pdf`),
        certificateUrl: buildDocumentUrl(item.certificateUrl),
      }))
    : [createCertificationEntry()];
}

function mapProfileToActivitiesForm(profile) {
  return profile.activities.length
    ? profile.activities.map((item) => ({
        actNumber: item.actNumber,
        title: item.title ?? "",
        description: item.description ?? "",
        links: item.link ?? "",
      }))
    : [createActivityEntry()];
}

function mapEducationFormToProfile(profile, formData) {
  const selectedTrack =
    formData.educationTrack ||
    (formData.diplomaInstitute || formData.diplomaMarks || formData.diplomaYear
      ? "diploma"
      : "twelfth");

  const currentTenth = profile.education.tenth;
  const currentTwelfth = profile.education.twelfth;
  const currentDiploma = profile.education.diploma;

  return {
    ...profile,
    department: formData.department ?? profile.department,
    currentCgpa: formData.cgpa === "" ? "" : formData.cgpa,
    currentPercentage: formData.percentage === "" ? "" : formData.percentage,
    backlogs: formData.activeBacklogs === "" ? "" : formData.activeBacklogs,
    deadBacklogs: formData.deadBacklogs ?? profile.deadBacklogs ?? [],
    passingYear: formData.graduationYear === "" ? "" : formData.graduationYear,
    gap: formData.gapStatus === "Yes" ? "YES" : "NO",
    gapReason: formData.gapReason ?? "",
    education: {
      ...profile.education,
      tenth:
        formData.year10 || formData.board10 || formData.marks10 || currentTenth?.marksheetUrl
          ? {
              schoolName: formData.schoolName10 ?? "",
              marks: formData.marks10 === "" ? "" : formData.marks10,
              mathsMarks: formData.mathsMarks10 === "" ? "" : formData.mathsMarks10,
              board: formData.board10 ?? "",
              year: formData.year10 === "" ? "" : formData.year10,
              marksheetUrl: currentTenth?.marksheetUrl ?? "",
            }
          : null,
      twelfth:
        selectedTrack === "twelfth" &&
        (formData.year12 || formData.board12 || formData.marks12 || currentTwelfth?.marksheetUrl)
          ? {
              collegeName: formData.collegeName12 ?? "",
              marks: formData.marks12 === "" ? "" : formData.marks12,
              mathsMarks: formData.mathsMarks12 === "" ? "" : formData.mathsMarks12,
              board: formData.board12 ?? "",
              year: formData.year12 === "" ? "" : formData.year12,
              entranceExamType: formData.entranceExamType ?? "",
              entranceExamScore:
                formData.entranceExamScore === "" ? "" : formData.entranceExamScore,
              entranceExamCertificateUrl:
                currentTwelfth?.entranceExamCertificateUrl ?? "",
              marksheetUrl: currentTwelfth?.marksheetUrl ?? "",
            }
          : null,
      diploma:
        selectedTrack === "diploma" &&
        (formData.diplomaYear ||
          formData.diplomaInstitute ||
          formData.diplomaMarks ||
          currentDiploma?.marksheetUrl)
          ? {
              marks: formData.diplomaMarks === "" ? "" : formData.diplomaMarks,
              institute: formData.diplomaInstitute ?? "",
              year: formData.diplomaYear === "" ? "" : formData.diplomaYear,
              marksheetUrl: currentDiploma?.marksheetUrl ?? "",
            }
          : null,
      gapCertificateUrl: profile.education.gapCertificateUrl,
    },
  };
}

function resetVerificationState(profile) {
  return {
    ...profile,
    verification: {
      ...profile.verification,
      isProfileVerified: false,
    },
  };
}

function getStoredSectionVerification(prn) {
  try {
    const sectionStatusMap = JSON.parse(
      window.localStorage.getItem(SECTION_VERIFICATION_STORAGE_KEY) || "{}",
    );

    return sectionStatusMap[prn] || {};
  } catch (error) {
    return {};
  }
}

function setStoredSectionVerification(prn, sectionStatus) {
  if (!prn) {
    return;
  }

  try {
    const sectionStatusMap = JSON.parse(
      window.localStorage.getItem(SECTION_VERIFICATION_STORAGE_KEY) || "{}",
    );

    sectionStatusMap[prn] = {
      ...(sectionStatusMap[prn] || {}),
      ...sectionStatus,
    };

    window.localStorage.setItem(
      SECTION_VERIFICATION_STORAGE_KEY,
      JSON.stringify(sectionStatusMap),
    );
  } catch (error) {
    window.localStorage.setItem(
      SECTION_VERIFICATION_STORAGE_KEY,
      JSON.stringify({
        [prn]: sectionStatus,
      }),
    );
  }
}

function createEditorState(profile, sectionKey) {
  switch (sectionKey) {
    case "summary":
      return profile.summary ?? "";
    case "professional":
      return mapProfileToProfessionalProfilesForm(profile);
    case "personal":
      return mapProfileToPersonalForm(profile);
    case "academic":
      return mapProfileToEducationForm(profile);
    case "skills":
      return mapProfileToSkillsForm(profile);
    case "projects":
      return mapProfileToProjectsForm(profile);
    case "experience":
      return mapProfileToExperienceForm(profile);
    case "certifications":
      return mapProfileToCertificationsForm(profile);
    case "activities":
      return mapProfileToActivitiesForm(profile);
    default:
      return null;
  }
}

function ProfessionalProfilesEditor({
  data,
  onFieldChange,
  onSave,
  isSaved,
}) {
  return (
    <SectionCard
      title="Professional Profiles"
      description="Keep your public professional links updated so recruiters can quickly review your work and presence."
      actions={<SaveButton onClick={onSave} saved={isSaved} label="Save Profiles" />}
    >
      <FieldGrid columns={1}>
        <TextInput
          label="GitHub Profile Link"
          name="github"
          type="url"
          value={data.github}
          onChange={onFieldChange}
          placeholder="https://github.com/username"
        />
        <TextInput
          label="LinkedIn Profile Link"
          name="linkedin"
          type="url"
          value={data.linkedin}
          onChange={onFieldChange}
          placeholder="https://www.linkedin.com/in/username"
        />
        <TextInput
          label="Portfolio Link"
          name="portfolio"
          type="url"
          value={data.portfolio}
          onChange={onFieldChange}
          placeholder="https://your-portfolio.com"
        />
      </FieldGrid>
    </SectionCard>
  );
}

function ProfileEditModal({ title, children, onClose }) {
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
      <button
        type="button"
        aria-label="Close editor"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-slate-100 p-4 shadow-2xl sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
              Profile Update
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm transition hover:bg-slate-100"
          >
            x
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function StudentProfilePage() {
  const [profile, setProfile] = useState(createEmptyStudentProfile);
  const [sectionVerification, setSectionVerification] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [previewDocument, setPreviewDocument] = useState(null);
  const [editingSection, setEditingSection] = useState("");
  const [editorState, setEditorState] = useState(null);
  const [isSavingSection, setIsSavingSection] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadStudentProfile() {
      try {
        setIsLoading(true);
        setErrorMessage("");
        const profileData = await getStudentProfile();

        if (isMounted) {
          setProfile(profileData);
          const storedSectionVerification = getStoredSectionVerification(profileData.prn);
          const nextSectionVerification = {
            personal:
              profileData.verification?.isProfileVerified ||
              Boolean(storedSectionVerification.personal),
          };
          setSectionVerification(nextSectionVerification);
          setStoredSectionVerification(profileData.prn, nextSectionVerification);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error?.response?.data?.message ||
              error?.response?.data?.error ||
              error?.message ||
              "Failed to load student profile."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadStudentProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const currentAddress = formatAddress(profile);
  const hasDiplomaDetails = Boolean(
    profile.education.diploma?.year ||
      profile.education.diploma?.marks ||
      profile.education.diploma?.institute ||
      profile.education.diploma?.marksheetUrl,
  );
  const academicSectionVerified = hasDiplomaDetails
    ? Boolean(
        profile.verification?.education?.tenth &&
          profile.verification?.education?.diploma &&
          profile.verification?.education?.cgpa &&
          profile.verification?.education?.backlogs,
      )
    : Boolean(
        profile.verification?.education?.tenth &&
          profile.verification?.education?.twelfth &&
          profile.verification?.education?.cgpa &&
          profile.verification?.education?.backlogs,
      );
  const experienceSectionVerified = Boolean(
    profile.experience.length &&
      profile.experience.every(
        (item) => profile.verification?.experience?.[item.expNumber],
      ),
  );
  const personalSectionVerified = Boolean(sectionVerification.personal);

  function openEditor(sectionKey) {
    setEditingSection(sectionKey);
    setEditorState(createEditorState(profile, sectionKey));
  }

  function requestEdit(sectionKey) {
    if (profile.verification?.isProfileVerified) {
      const confirmed = window.confirm(
        "Your profile is verified. If you edit these details, your profile will go for verification again and until then you cannot use other features. Do you want to continue?",
      );

      if (!confirmed) {
        return;
      }
    }

    openEditor(sectionKey);
  }

  function closeEditor(force = false) {
    if (isSavingSection && !force) {
      return;
    }

    setEditingSection("");
    setEditorState(null);
  }

  const handleEditorFieldChange = (event) => {
    const { name } = event.target;
    let { value } = event.target;

    if (editingSection === "personal") {
      if (LOCATION_FIELD_NAMES.has(name)) {
        value = normalizeLocationInput(value);
      }

      if (name === "dob") {
        setEditorState((current) => ({
          ...current,
          dob: value,
          age: calculateAgeFromDob(value),
        }));
        return;
      }
    }

    if (editingSection === "academic") {
      if (name === "cgpa") {
        setEditorState((current) => ({
          ...current,
          cgpa: value,
          percentage: calculatePercentageFromCgpa(value),
        }));
        return;
      }

      if (name === "activeBacklogs") {
        setEditorState((current) => ({
          ...current,
          activeBacklogs: value,
          backlogs: value,
        }));
        return;
      }

      if (name === "entranceExamType" && !value) {
        setEditorState((current) => ({
          ...current,
          entranceExamType: "",
          entranceExamScore: "",
          entranceExamCertificate: "",
        }));
        return;
      }
    }

    setEditorState((current) =>
      typeof current === "string" ? value : { ...current, [name]: value },
    );
  };

  const handleEditorFileChange = (event) => {
    const file = event.target.files?.[0];
    const { name } = event.target;

    setEditorState((current) => ({
      ...current,
      [name]: file
        ? {
            file,
            name: file.name,
            type: file.type,
            url: URL.createObjectURL(file),
          }
        : "",
    }));
  };

  const handleSkillsChange = (skillType, values) => {
    setEditorState((current) => ({
      ...current,
      [skillType]: values,
    }));
  };

  const handleEducationDeadBacklogChange = (index, event) => {
    const { name, value } = event.target;

    setEditorState((current) => ({
      ...current,
      deadBacklogs: current.deadBacklogs.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [name]: value } : entry,
      ),
    }));
  };

  const handleAddEducationDeadBacklog = () => {
    setEditorState((current) => ({
      ...current,
      deadBacklogs: [...current.deadBacklogs, createDeadBacklogEntry()],
    }));
  };

  const handleRemoveEducationDeadBacklog = (index) => {
    setEditorState((current) => ({
      ...current,
      deadBacklogs:
        current.deadBacklogs.length === 1
          ? current.deadBacklogs
          : current.deadBacklogs.filter((_, entryIndex) => entryIndex !== index),
    }));
  };

  const handleListItemChange = (index, event) => {
    const { name, value } = event.target;

    if (
      ["experience", "certifications"].includes(editingSection) &&
      ["durationUnit", "durationValue", "startMonth", "endMonth"].includes(name)
    ) {
      setEditorState((current) =>
        current.map((item, itemIndex) => {
          if (itemIndex !== index) {
            return item;
          }

          const nextItem = {
            ...item,
            [name]: value,
          };

          return {
            ...nextItem,
            [editingSection === "experience" ? "duration" : "durationSummary"]: buildExperienceDuration(
              nextItem.durationValue,
              nextItem.durationUnit,
              nextItem.startMonth,
              nextItem.endMonth,
            ),
            ...(editingSection === "certifications"
              ? {
                  duration: buildExperienceDuration(
                    nextItem.durationValue,
                    nextItem.durationUnit,
                    nextItem.startMonth,
                    nextItem.endMonth,
                  ),
                }
              : {}),
          };
        }),
      );
      return;
    }

    setEditorState((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [name]: value } : item,
      ),
    );
  };

  const handleListItemFileChange = (index, event) => {
    const file = event.target.files?.[0];
    const { name } = event.target;

    setEditorState((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [name]: file
                ? {
                    file,
                    name: file.name,
                    type: file.type,
                    url: URL.createObjectURL(file),
                  }
                : "",
            }
          : item,
      ),
    );
  };

  const addListItem = (factory) => {
    setEditorState((current) => [...current, factory()]);
  };

  const removeListItem = (index) => {
    setEditorState((current) => {
      if (current.length === 1) {
        return current;
      }

      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  };

  async function refreshProfile() {
    const profileData = await getStudentProfile();
    setProfile(profileData);
    const storedSectionVerification = getStoredSectionVerification(profileData.prn);
    const nextSectionVerification = {
      personal:
        profileData.verification?.isProfileVerified ||
        Boolean(storedSectionVerification.personal),
    };
    setSectionVerification(nextSectionVerification);
    setStoredSectionVerification(profileData.prn, nextSectionVerification);
    return profileData;
  }

  async function handleSectionSave() {
    try {
      setIsSavingSection(true);

      switch (editingSection) {
        case "summary":
          await saveProfileSummaryDetails(profile.prn, editorState);
          break;
        case "professional":
          await savePersonalDetails({
            ...mapProfileToPersonalForm(profile),
            ...editorState,
          });
          break;
        case "personal":
          await savePersonalDetails(editorState);
          break;
        case "academic":
          await saveEducationDetails(profile.prn, editorState);
          break;
        case "skills":
          await saveSkillsDetails(profile.prn, editorState);
          break;
        case "projects":
          await saveProjectsDetails(profile.prn, editorState);
          break;
        case "experience":
          await saveExperienceDetails(profile.prn, editorState);
          break;
        case "certifications":
          await saveCertificationDetails(profile.prn, editorState);
          break;
        case "activities":
          await saveActivitiesDetails(profile.prn, editorState);
          break;
        default:
          return;
      }

      window.localStorage.setItem(STUDENT_PROFILE_VERIFIED_STORAGE_KEY, "false");
      window.dispatchEvent(new Event(STUDENT_PROFILE_VERIFICATION_EVENT));

      const refreshedProfile = await refreshProfile();
      let nextProfile = resetVerificationState(refreshedProfile);
      let nextSectionVerification = getStoredSectionVerification(refreshedProfile.prn);

      if (editingSection === "summary") {
        nextProfile = {
          ...nextProfile,
          summary: editorState,
        };
      }

      if (editingSection === "professional") {
        nextProfile = {
          ...nextProfile,
          ...editorState,
        };
      }

      if (editingSection === "academic") {
        nextProfile = mapEducationFormToProfile(nextProfile, editorState);
      }

      if (["personal", "professional"].includes(editingSection)) {
        nextSectionVerification = {
          ...nextSectionVerification,
          personal: false,
        };
      }

      setProfile(nextProfile);
      setSectionVerification(nextSectionVerification);
      setStoredSectionVerification(nextProfile.prn, nextSectionVerification);

      closeEditor(true);
      window.alert("Profile section updated successfully.");
    } catch (error) {
      window.alert(
        error?.response?.data?.error ||
          error?.response?.data?.message ||
          error?.message ||
          "Failed to update profile section.",
      );
    } finally {
      setIsSavingSection(false);
    }
  }

  function renderEditorSection() {
    switch (editingSection) {
      case "summary":
        return (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
            <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-blue-50 to-cyan-50 px-6 py-5">
              <h2 className="text-xl font-semibold text-slate-900">Profile Summary</h2>
              <p className="mt-1 text-sm text-slate-600">
                Add a short summary that introduces the student profile.
              </p>
            </div>
            <div className="space-y-5 px-6 py-6">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Summary
                </span>
                <textarea
                  name="summary"
                  value={editorState}
                  onChange={handleEditorFieldChange}
                  rows={6}
                  placeholder="Write a simple summary about strengths, interests, academic background, and career focus."
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </label>
            </div>
            <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={handleSectionSave}
                disabled={isSavingSection}
                className="inline-flex min-w-[170px] items-center justify-center rounded-xl bg-blue-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-80"
              >
                {isSavingSection ? "Saving..." : "Submit Summary"}
              </button>
            </div>
          </div>
        );
      case "professional":
        return (
          <ProfessionalProfilesEditor
            data={editorState}
            onFieldChange={handleEditorFieldChange}
            onSave={handleSectionSave}
            isSaved={isSavingSection}
          />
        );
      case "academic":
        return (
          <EducationalDetailsSection
            data={editorState}
            onFieldChange={handleEditorFieldChange}
            onFileChange={handleEditorFileChange}
            onDeadBacklogChange={handleEducationDeadBacklogChange}
            onAddDeadBacklog={handleAddEducationDeadBacklog}
            onRemoveDeadBacklog={handleRemoveEducationDeadBacklog}
            onSave={handleSectionSave}
            isSaved={isSavingSection}
          />
        );
      case "personal":
        return (
          <PersonalDetailsSection
            data={editorState}
            onFieldChange={handleEditorFieldChange}
            onFileChange={handleEditorFileChange}
            onSave={handleSectionSave}
            isSaved={isSavingSection}
          />
        );
      case "skills":
        return (
          <TechnicalSkillsSection
            data={editorState}
            onSkillsChange={handleSkillsChange}
            onSave={handleSectionSave}
            isSaved={isSavingSection}
          />
        );
      case "projects":
        return (
          <ProjectsSection
            data={editorState}
            onEntryChange={handleListItemChange}
            onAddEntry={() => addListItem(createProjectEntry)}
            onRemoveEntry={removeListItem}
            onSave={handleSectionSave}
            isSaved={isSavingSection}
          />
        );
      case "experience":
        return (
          <ExperienceSection
            data={editorState}
            onEntryChange={handleListItemChange}
            onEntryFileChange={handleListItemFileChange}
            onAddEntry={() => addListItem(createExperienceEntry)}
            onRemoveEntry={removeListItem}
            onSave={handleSectionSave}
            isSaved={isSavingSection}
          />
        );
      case "certifications":
        return (
          <CertificationsSection
            data={editorState}
            onEntryChange={handleListItemChange}
            onEntryFileChange={handleListItemFileChange}
            onAddEntry={() => addListItem(createCertificationEntry)}
            onRemoveEntry={removeListItem}
            onSave={handleSectionSave}
            isSaved={isSavingSection}
          />
        );
      case "activities":
        return (
          <ExtraActivitiesSection
            data={editorState}
            onEntryChange={handleListItemChange}
            onAddEntry={() => addListItem(createActivityEntry)}
            onRemoveEntry={removeListItem}
            onSave={handleSectionSave}
            isSaved={isSavingSection}
          />
        );
      default:
        return null;
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
        <p className="text-lg font-semibold text-slate-900">Loading profile...</p>
        <p className="mt-2 text-sm text-slate-500">Fetching student profile data.</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-8 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
        <p className="text-lg font-semibold text-red-700">Unable to load profile</p>
        <p className="mt-2 text-sm text-red-600">{errorMessage}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mx-auto grid w-full max-w-[92rem] gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="xl:sticky xl:top-28 xl:self-start">
          <ProfileSidebarCard profile={profile} links={profileSectionLinks} />
        </div>

        <div className="space-y-6">
          {profile.verification?.isProfileVerified ? (
            <section className="rounded-3xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm font-medium text-blue-700">
              This profile is fully verified by TPC. If you edit any section, the profile will move back to verification review and other student features will stay locked until it is verified again.
            </section>
          ) : (
            <section className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-700">
              This profile is currently unverified by TPC. Once the updated details are reviewed and verified again, the locked student features will become available.
            </section>
          )}

          <ProfileSection
            id="profile-summary"
            title="Profile Summary"
            description="A quick overview of the student profile that appears before the detailed academic and resume sections."
            actionLabel={profile.summary ? "Update Profile Summary" : "Add Profile Summary"}
            actionVariant={profile.summary ? "update" : "add"}
            onAction={() => requestEdit("summary")}
          >
            {profile.summary ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-700">Student Summary</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{profile.summary}</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
                <p className="text-sm leading-6 text-slate-600">
                  No profile summary has been added yet.
                </p>
              </div>
            )}
          </ProfileSection>

          <ProfileSection
            id="professional-profiles"
            title="Professional Profiles"
            description="Public links that help recruiters review the student's coding presence, work samples, and online portfolio."
            statusLabel={personalSectionVerified ? "Verified" : "Pending Verification"}
            actionLabel={
              profile.github || profile.linkedin || profile.portfolio
                ? "Update Professional Profiles"
                : "Add Professional Profiles"
            }
            actionVariant={
              profile.github || profile.linkedin || profile.portfolio ? "update" : "add"
            }
            onAction={() => requestEdit("professional")}
          >
            <ProfileFieldList
              items={[
                {
                  label: "GitHub Profile",
                  value: profile.github ?? profile.githubUrl ?? profile.github_url,
                },
                {
                  label: "LinkedIn Profile",
                  value: profile.linkedin ?? profile.linkedinUrl ?? profile.linkedin_url,
                },
                {
                  label: "Portfolio",
                  value: profile.portfolio ?? profile.portfolioUrl ?? profile.portfolio_url,
                },
              ]}
            />
          </ProfileSection>

          <ProfileSection
            id="basic-details"
            title="Basic Details"
            description="Core identity details from the submitted student profile. Editing them will send the profile back for TPC verification."
            statusLabel={personalSectionVerified ? "Verified" : "Pending Verification"}
            actionLabel="Edit Basic Details"
            onAction={() => requestEdit("personal")}
          >
            <ProfileFieldList
              columns={3}
              items={[
                { label: "PRN", value: profile.prn },
                { label: "Full Name", value: profile.fullName },
                { label: "Date of Birth", value: formatDate(profile.dob) },
                { label: "Blood Group", value: profile.bloodGroup },
                { label: "Gender", value: profile.gender },
                { label: "Category", value: profile.category },
                { label: "Aadhaar", value: profile.aadhaar },
                { label: "PAN", value: profile.panNumber },
                { label: "Handicap", value: profile.handicap },
                { label: "Department", value: profile.department },
                { label: "Passing Year", value: profile.passingYear },
              ]}
            />
          </ProfileSection>

          <ProfileSection
            id="contact-address"
            title="Contact & Address"
            description="Communication and address details used across placement records. Editing them will send the profile back for TPC verification."
            statusLabel={personalSectionVerified ? "Verified" : "Pending Verification"}
            actionLabel="Edit Contact Info"
            onAction={() => requestEdit("personal")}
          >
            <ProfileFieldList
              items={[
                { label: "Personal Email", value: profile.email },
                { label: "College Email", value: profile.collegeEmail },
                { label: "Mobile Number", value: profile.mobile },
                { label: "Current Address", value: currentAddress },
                { label: "Pincode", value: profile.pincode },
              ]}
            />
          </ProfileSection>

          <ProfileSection
            id="academic-details"
            title="Academic Details"
            description="10th details are shown for every student. Based on the submitted academic path, the profile shows either diploma details or 12th details."
            statusLabel={academicSectionVerified ? "Verified" : "Pending Verification"}
            actionLabel="Update Current Academics"
            onAction={() => requestEdit("academic")}
          >
            <div className="grid gap-4 lg:grid-cols-3">
              <ProfileItemCard
                title="10th Standard"
                subtitle={profile.education.tenth?.board}
                meta={profile.education.tenth?.year ? `${profile.education.tenth.year}` : ""}
                description={
                  profile.education.tenth
                    ? `Marks: ${profile.education.tenth.marks}%`
                    : "No 10th record available."
                }
                links={
                  profile.education.tenth?.marksheetUrl
                    ? [
                            {
                              label: "View Marksheet",
                              onClick: () =>
                                setPreviewDocument({
                                  url: buildPreviewUrl(
                                    buildDocumentUrl(profile.education.tenth.marksheetUrl),
                                    "10th Marksheet.pdf"
                                  ),
                                  sourceUrl: buildDocumentUrl(profile.education.tenth.marksheetUrl),
                                  label: "10th Marksheet",
                                  type: inferFileType(profile.education.tenth.marksheetUrl),
                                }),
                            },
                      ]
                    : []
                }
              />
              {hasDiplomaDetails ? (
                <ProfileItemCard
                  title="Diploma Student"
                  subtitle={profile.education.diploma?.institute}
                  meta={profile.education.diploma?.year ? `${profile.education.diploma.year}` : ""}
                  description={
                    profile.education.diploma
                      ? `Marks: ${profile.education.diploma.marks}%`
                      : "No diploma record available."
                  }
                  links={
                    profile.education.diploma?.marksheetUrl
                      ? [
                          {
                            label: "View Marksheet",
                            onClick: () =>
                              setPreviewDocument({
                                url: buildPreviewUrl(
                                  buildDocumentUrl(profile.education.diploma.marksheetUrl),
                                  "Diploma Marksheet.pdf"
                                ),
                                sourceUrl: buildDocumentUrl(profile.education.diploma.marksheetUrl),
                                label: "Diploma Marksheet",
                                type: inferFileType(profile.education.diploma.marksheetUrl),
                              }),
                          },
                        ]
                      : []
                  }
                />
              ) : (
                <ProfileItemCard
                  title="12th Candidate"
                  subtitle={profile.education.twelfth?.board}
                  meta={profile.education.twelfth?.year ? `${profile.education.twelfth.year}` : ""}
                  description={
                    profile.education.twelfth
                      ? `Marks: ${profile.education.twelfth.marks}%`
                      : "No 12th record available."
                  }
                  links={
                    profile.education.twelfth?.marksheetUrl
                      ? [
                          {
                            label: "View Marksheet",
                            onClick: () =>
                              setPreviewDocument({
                                url: buildPreviewUrl(
                                  buildDocumentUrl(profile.education.twelfth.marksheetUrl),
                                  "12th Marksheet.pdf"
                                ),
                                sourceUrl: buildDocumentUrl(profile.education.twelfth.marksheetUrl),
                                label: "12th Marksheet",
                                type: inferFileType(profile.education.twelfth.marksheetUrl),
                              }),
                          },
                        ]
                      : []
                  }
                />
              )}
              <ProfileItemCard
                title="Current Degree Snapshot"
                subtitle={profile.department}
                meta={`Passout ${profile.passingYear}`}
                description={`Current CGPA: ${profile.currentCgpa} | Percentage: ${profile.currentPercentage || "-"} | Active Backlogs: ${profile.backlogs} | Dead Backlogs: ${profile.deadBacklogs?.map((entry) => `${entry.semester}${entry.count ? `(${entry.count})` : ""}`).filter(Boolean).join(", ") || "-"} | Gap: ${profile.gap}${profile.gapReason ? ` (${profile.gapReason})` : ""}`}
              />
            </div>
          </ProfileSection>

          <ProfileSection
            id="skills"
            title="Skills, Subjects & Languages"
            description="Skills are high-impact resume fields and should stay easy to update as the student grows."
            actionLabel="Update Skills"
            onAction={() => requestEdit("skills")}
          >
            <div className="grid gap-5 lg:grid-cols-2">
              <ProfileChipGroup title="Languages" items={profile.skills.languages} />
              <ProfileChipGroup title="Frameworks" items={profile.skills.frameworks} />
              <ProfileChipGroup title="Tools" items={profile.skills.tools} />
              <ProfileChipGroup title="Other Languages" items={profile.skills.otherLanguages} />
            </div>
          </ProfileSection>

          <ProfileSection
            id="projects"
            title="Projects"
            description="Projects are resume-building content, so students should be able to add new work or improve descriptions later."
            actionLabel={
              profile.projects.length
                ? "Update Projects"
                : "Add Projects"
            }
            actionVariant={profile.projects.length ? "update" : "add"}
            onAction={() => requestEdit("projects")}
          >
            <div className="space-y-4">
              {profile.projects.length ? (
                profile.projects.map((project) => (
                  <ProfileItemCard
                    key={project.projectNumber}
                    title={project.title}
                    subtitle={project.techStack}
                    meta={`Project ${project.projectNumber}`}
                    description={project.description}
                    links={[
                      ...(project.githubLink
                        ? [
                            {
                              label: "GitHub Link",
                              onClick: () =>
                                window.open(
                                  normalizeExternalUrl(project.githubLink),
                                  "_blank",
                                  "noopener,noreferrer",
                                ),
                            },
                          ]
                        : []),
                      ...(project.liveLink
                        ? [
                            {
                              label: "Live Demo",
                              onClick: () =>
                                window.open(
                                  normalizeExternalUrl(project.liveLink),
                                  "_blank",
                                  "noopener,noreferrer",
                                ),
                            },
                          ]
                        : []),
                    ]}
                  />
                ))
              ) : (
                <p className="text-sm text-slate-500">No projects added yet.</p>
              )}
            </div>
          </ProfileSection>

          <ProfileSection
            id="experience"
            title="Internship & Work Experience"
            description="Internships and work experience often grow over time, so these entries should remain updateable."
            statusLabel={experienceSectionVerified ? "Verified" : "Pending Verification"}
            actionLabel={
              profile.experience.length
                ? "Update Experience"
                : "Add Experience"
            }
            actionVariant={profile.experience.length ? "update" : "add"}
            onAction={() => requestEdit("experience")}
          >
            <div className="space-y-4">
              {profile.experience.length ? (
                profile.experience.map((item) => (
                  <ProfileItemCard
                    key={item.expNumber}
                    title={`${item.type} at ${item.companyName}`}
                    subtitle={item.role}
                    meta={item.duration}
                    description={item.description}
                    links={
                      item.certificateUrl
                        ? [
                            {
                              label: "View Certificate",
                              onClick: () =>
                                setPreviewDocument({
                                  url: buildPreviewUrl(
                                    buildDocumentUrl(item.certificateUrl),
                                    `${item.companyName} Certificate.pdf`
                                  ),
                                  sourceUrl: buildDocumentUrl(item.certificateUrl),
                                  label: `${item.companyName} Certificate`,
                                  type: inferFileType(item.certificateUrl),
                                }),
                            },
                          ]
                        : []
                    }
                  />
                ))
              ) : (
                <p className="text-sm text-slate-500">No experience entries added yet.</p>
              )}
            </div>
          </ProfileSection>

          <ProfileSection
            id="certifications"
            title="Certifications"
            description="Certifications are dynamic resume items and should support both new additions and updates."
            actionLabel={
              profile.certifications.length
                ? "Update Certifications"
                : "Add Certifications"
            }
            actionVariant={profile.certifications.length ? "update" : "add"}
            onAction={() => requestEdit("certifications")}
          >
            <div className="space-y-4">
              {profile.certifications.length ? (
                profile.certifications.map((item) => (
                  <ProfileItemCard
                    key={item.certNumber}
                    title={item.name}
                    subtitle={
                      [item.platform, item.durationSummary || item.duration || ""]
                        .filter(Boolean)
                        .join(" | ")
                    }
                    meta={`Certificate ${item.certNumber}`}
                    links={
                      [
                        ...(item.link
                          ? [
                              {
                                label: "Link",
                                href: normalizeExternalUrl(item.link),
                              },
                            ]
                          : []),
                        ...(item.certificateUrl
                          ? [
                              {
                                label: "View Certificate",
                                onClick: () =>
                                  setPreviewDocument({
                                    url: buildPreviewUrl(
                                      buildDocumentUrl(item.certificateUrl),
                                      `${item.name}.pdf`
                                    ),
                                    sourceUrl: buildDocumentUrl(item.certificateUrl),
                                    label: item.name,
                                    type: inferFileType(item.certificateUrl),
                                  }),
                              },
                            ]
                          : []),
                      ]
                    }
                  />
                ))
              ) : (
                <p className="text-sm text-slate-500">No certifications added yet.</p>
              )}
            </div>
          </ProfileSection>

          <ProfileSection
            id="activities"
            title="Activities & Accomplishments"
            description="This section keeps the profile resume-ready by highlighting clubs, volunteering, hackathons, and similar achievements."
            actionLabel={
              profile.activities.length
                ? "Update Activities"
                : "Add Activities"
            }
            actionVariant={profile.activities.length ? "update" : "add"}
            onAction={() => requestEdit("activities")}
          >
            <div className="space-y-4">
              {profile.activities.length ? (
                profile.activities.map((item) => (
                  <ProfileItemCard
                    key={item.actNumber}
                    title={item.title}
                    subtitle={`Activity ${item.actNumber}`}
                    description={item.description}
                    links={
                      item.link
                        ? [
                            {
                              label: "Open Link",
                              onClick: () =>
                                window.open(
                                  normalizeExternalUrl(item.link),
                                  "_blank",
                                  "noopener,noreferrer",
                                ),
                            },
                          ]
                        : []
                    }
                  />
                ))
              ) : (
                <p className="text-sm text-slate-500">No activities added yet.</p>
              )}
            </div>
          </ProfileSection>
        </div>
      </div>

      {previewDocument?.url ? (
        <ProfileDocumentPreviewModal
          fileUrl={previewDocument.url}
          sourceUrl={previewDocument.sourceUrl || previewDocument.url}
          fileLabel={previewDocument.label}
          fileType={previewDocument.type}
          onClose={() => setPreviewDocument(null)}
        />
      ) : null}

      {editingSection && editorState !== null ? (
        <ProfileEditModal
          title={
            editingSection === "summary"
              ? "Profile Summary"
              : editingSection === "professional"
              ? "Professional Profiles"
              : editingSection === "personal"
              ? "Edit Personal Details"
              : editingSection === "academic"
              ? "Update Academic Details"
              : editingSection === "skills"
              ? "Update Skills"
              : editingSection === "projects"
              ? "Update Projects"
              : editingSection === "experience"
              ? "Update Experience"
              : editingSection === "certifications"
              ? "Update Certifications"
              : "Update Activities"
          }
          onClose={closeEditor}
        >
          {renderEditorSection()}
        </ProfileEditModal>
      ) : null}
    </div>
  );
}

export default StudentProfilePage;
