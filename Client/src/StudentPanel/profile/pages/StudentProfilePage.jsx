import { useEffect, useState } from "react";
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
import { DEFAULT_PRN, getStudentProfile } from "../services/studentProfileApi";

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

function StudentProfilePage() {
  const [profile, setProfile] = useState(createEmptyStudentProfile);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [previewDocument, setPreviewDocument] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadStudentProfile() {
      try {
        setIsLoading(true);
        setErrorMessage("");
        const profileData = await getStudentProfile();

        if (isMounted) {
          setProfile(profileData);
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

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
        <p className="text-lg font-semibold text-slate-900">Loading profile...</p>
        <p className="mt-2 text-sm text-slate-500">
          Fetching student profile data for default PRN {DEFAULT_PRN}.
        </p>
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
          <ProfileSection
            id="basic-details"
            title="Basic Details"
            description="Core identity information is locked after initial verification. These details stay read-only to preserve record accuracy."
          >
            <ProfileFieldList
              columns={3}
              items={[
                { label: "PRN", value: profile.prn },
                { label: "Full Name", value: profile.fullName },
                { label: "Date of Birth", value: formatDate(profile.dob) },
                { label: "Gender", value: profile.gender },
                { label: "Category", value: profile.category },
                { label: "Aadhaar", value: profile.aadhaar },
                { label: "Handicap", value: profile.handicap },
                { label: "Department", value: profile.department },
                { label: "Passing Year", value: profile.passingYear },
              ]}
            />
          </ProfileSection>

          <ProfileSection
            id="contact-address"
            title="Contact & Address"
            description="These are active profile fields that students may need to keep current for communication and placement records."
            actionLabel="Update Contact Info"
          >
            <ProfileFieldList
              items={[
                { label: "Email", value: profile.email },
                { label: "Mobile Number", value: profile.mobile },
                { label: "Current Address", value: currentAddress },
                { label: "Pincode", value: profile.pincode },
              ]}
            />
          </ProfileSection>

          <ProfileSection
            id="academic-details"
            title="Academic Details"
            description="Historic records like 10th and 12th remain mostly informational, while current academics may need updates as your resume evolves."
            actionLabel="Update Current Academics"
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
              <ProfileItemCard
                title="12th Standard"
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
              <ProfileItemCard
                title="Current Degree Snapshot"
                subtitle={profile.department}
                meta={`Passout ${profile.passingYear}`}
                description={`Current CGPA: ${profile.currentCgpa} | Backlogs: ${profile.backlogs} | Gap: ${profile.gap}${profile.gapReason ? ` (${profile.gapReason})` : ""}`}
              />
            </div>
          </ProfileSection>

          <ProfileSection
            id="skills"
            title="Skills, Subjects & Languages"
            description="Skills are high-impact resume fields and should stay easy to update as the student grows."
            actionLabel="Update Skills"
          >
            <div className="grid gap-5 lg:grid-cols-2">
              <ProfileChipGroup title="Languages" items={profile.skills.languages} />
              <ProfileChipGroup title="Frameworks" items={profile.skills.frameworks} />
              <ProfileChipGroup title="Tools" items={profile.skills.tools} />
              <ProfileChipGroup title="Other Skills" items={profile.skills.otherSkills} />
            </div>
          </ProfileSection>

          <ProfileSection
            id="projects"
            title="Projects"
            description="Projects are resume-building content, so students should be able to add new work or improve descriptions later."
            actionLabel={profile.projects.length ? "Update Projects" : "Add Projects"}
            actionVariant={profile.projects.length ? "update" : "add"}
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
                      { label: "GitHub Link" },
                      ...(project.liveLink ? [{ label: "Live Demo" }] : []),
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
            actionLabel={profile.experience.length ? "Update Experience" : "Add Experience"}
            actionVariant={profile.experience.length ? "update" : "add"}
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
            actionLabel={profile.certifications.length ? "Update Certifications" : "Add Certifications"}
            actionVariant={profile.certifications.length ? "update" : "add"}
          >
            <div className="space-y-4">
              {profile.certifications.length ? (
                profile.certifications.map((item) => (
                  <ProfileItemCard
                    key={item.certNumber}
                    title={item.name}
                    subtitle={item.platform}
                    meta={`Certificate ${item.certNumber}`}
                    links={
                      item.certificateUrl
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
                        : []
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
            actionLabel={profile.activities.length ? "Update Activities" : "Add Activities"}
            actionVariant={profile.activities.length ? "update" : "add"}
          >
            <div className="space-y-4">
              {profile.summary ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-700">Profile Summary</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{profile.summary}</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 md:flex-row md:items-center md:justify-between">
                  <p className="max-w-2xl text-sm leading-6 text-slate-600">
                    No profile summary has been added yet. This should be an addable field because students refine their resume summary over time.
                  </p>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
                  >
                    <span className="material-symbols-outlined mr-2 text-[18px]">add</span>
                    Add Summary
                  </button>
                </div>
              )}

              {profile.activities.length ? (
                profile.activities.map((item) => (
                  <ProfileItemCard
                    key={item.actNumber}
                    title={item.title}
                    subtitle={`Activity ${item.actNumber}`}
                    description={item.description}
                    links={item.link ? [{ label: "Open Link" }] : []}
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
    </div>
  );
}

export default StudentProfilePage;
