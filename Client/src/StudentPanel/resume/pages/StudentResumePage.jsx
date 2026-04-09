import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, FileText, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getStudentProfile } from "../../profile/services/studentProfileApi";
import {
  fetchResumeTemplates,
  fetchStudentResumes,
  generateStudentResume,
} from "../services/resumeApi";
import ResumeHistoryList from "../components/ResumeHistoryList";
import TemplateSelectionStep from "../components/TemplateSelectionStep";
import SectionSelectionStep from "../components/SectionSelectionStep";
import ResumeGenerationStep from "../components/ResumeGenerationStep";
import { resumeSelectionLimits, resumeSelectionSteps } from "../utils/resumeTemplates";

function clampSelection(currentValues, nextValue, limit) {
  if (currentValues.includes(nextValue)) {
    return currentValues.filter((item) => item !== nextValue);
  }

  if (currentValues.length >= limit) {
    return currentValues;
  }

  return [...currentValues, nextValue];
}

export default function StudentResumePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [savedResumes, setSavedResumes] = useState([]);
  const [selectedTemplateCode, setSelectedTemplateCode] = useState("");
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [selectedCertifications, setSelectedCertifications] = useState([]);
  const [selectedExperience, setSelectedExperience] = useState([]);
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [resumeTitle, setResumeTitle] = useState("");
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadResumeModule() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const [profileData, templateData, resumeData] = await Promise.all([
          getStudentProfile(),
          fetchResumeTemplates(),
          fetchStudentResumes(),
        ]);

        if (!isMounted) {
          return;
        }

        setProfile(profileData);
        setTemplates(templateData);
        setSavedResumes(resumeData);
        setSelectedTemplateCode(templateData[0]?.id || "");
        setResumeTitle(
          `${profileData?.fullName || profileData?.prn || "Student"} Resume`,
        );
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(
          error?.response?.data?.message ||
            error?.response?.data?.error ||
            error?.message ||
            "Failed to load resume data.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadResumeModule();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedTemplate = useMemo(
    () => templates.find((item) => item.id === selectedTemplateCode) || null,
    [selectedTemplateCode, templates],
  );

  const selectionSummary = useMemo(
    () => [
      { label: "Projects", count: selectedProjects.length },
      { label: "Certifications", count: selectedCertifications.length },
      { label: "Experience", count: selectedExperience.length },
      { label: "Activities", count: selectedActivities.length },
    ],
    [selectedActivities.length, selectedCertifications.length, selectedExperience.length, selectedProjects.length],
  );

  useEffect(() => {
    if (!feedbackMessage) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setFeedbackMessage(""), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [feedbackMessage]);

  function moveStep(direction) {
    setCurrentStepIndex((currentIndex) => {
      const nextIndex = currentIndex + direction;
      return Math.max(0, Math.min(resumeSelectionSteps.length - 1, nextIndex));
    });
  }

  async function handleGenerateResume() {
    try {
      setIsGenerating(true);
      setErrorMessage("");

      const generatedResume = await generateStudentResume({
        templateCode: selectedTemplateCode,
        resumeTitle,
        selectedProjects,
        selectedCertifications,
        selectedExperience,
        selectedActivities,
      });

      const nextResumes = await fetchStudentResumes();
      setSavedResumes(nextResumes);
      setFeedbackMessage("Resume generated and saved successfully.");

      if (generatedResume?.id) {
        navigate(`/student-panel/resume/${generatedResume.id}/preview`);
      }
    } catch (error) {
      setErrorMessage(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to generate resume.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  function renderStep(stepKey) {
    switch (stepKey) {
      case "template":
        return (
          <TemplateSelectionStep
            templates={templates}
            selectedTemplateCode={selectedTemplateCode}
            onSelectTemplate={setSelectedTemplateCode}
          />
        );
      case "projects":
        return (
          <SectionSelectionStep
            title="Add projects"
            description="Choose the projects you want to highlight in this version of your resume."
            items={profile?.projects || []}
            selectedIds={selectedProjects}
            limit={resumeSelectionLimits.projects}
            onToggle={(itemId) =>
              setSelectedProjects((currentValues) =>
                clampSelection(currentValues, itemId, resumeSelectionLimits.projects),
              )
            }
            emptyText="No projects are available yet in your profile."
            getTitle={(item) => item.title}
            getSubtitle={(item) => item.techStack}
            getDescription={(item) => item.description}
          />
        );
      case "certifications":
        return (
          <SectionSelectionStep
            title="Add certifications"
            description="Pick the certifications that best fit this resume version."
            items={profile?.certifications || []}
            selectedIds={selectedCertifications}
            limit={resumeSelectionLimits.certifications}
            onToggle={(itemId) =>
              setSelectedCertifications((currentValues) =>
                clampSelection(currentValues, itemId, resumeSelectionLimits.certifications),
              )
            }
            emptyText="No certifications are available yet in your profile."
            getTitle={(item) => item.name}
            getSubtitle={(item) => item.platform}
          />
        );
      case "experience":
        return (
          <SectionSelectionStep
            title="Add experience"
            description="Select internships, training, or other experience entries for this resume."
            items={profile?.experience || []}
            selectedIds={selectedExperience}
            limit={resumeSelectionLimits.experience}
            onToggle={(itemId) =>
              setSelectedExperience((currentValues) =>
                clampSelection(currentValues, itemId, resumeSelectionLimits.experience),
              )
            }
            emptyText="No experience entries are available yet in your profile."
            getTitle={(item) => item.role || item.type || "Experience"}
            getSubtitle={(item) => [item.companyName, item.duration].filter(Boolean).join(" | ")}
            getDescription={(item) => item.description}
          />
        );
      case "activities":
        return (
          <SectionSelectionStep
            title="Add extra curricular activities"
            description="Choose the extra curricular items you want included in the final resume."
            items={profile?.activities || []}
            selectedIds={selectedActivities}
            limit={resumeSelectionLimits.activities}
            onToggle={(itemId) =>
              setSelectedActivities((currentValues) =>
                clampSelection(currentValues, itemId, resumeSelectionLimits.activities),
              )
            }
            emptyText="No activities are available yet in your profile."
            getTitle={(item) => item.title}
            getDescription={(item) => item.description}
          />
        );
      case "generate":
      default:
        return (
          <ResumeGenerationStep
            resumeTitle={resumeTitle}
            onResumeTitleChange={setResumeTitle}
            selectedTemplate={selectedTemplate}
            selectionSummary={selectionSummary}
          />
        );
    }
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[36px] border border-slate-200 bg-white shadow-[0_16px_42px_rgba(15,23,42,0.08)]">
        <div className="relative px-6 py-6 sm:px-8 lg:px-10 lg:py-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.18),_transparent_24%),linear-gradient(135deg,_#ffffff_0%,_#f8fbff_52%,_#eef7ff_100%)]" />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white">
                Resume Studio
              </span>
              <span className="rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-xs font-semibold text-cyan-700">
                Student Panel
              </span>
            </div>
            <h1 className="mt-5 text-3xl font-bold leading-tight text-slate-950 sm:text-4xl">
              Choose a template, pick your strongest sections, and save reusable resume versions.
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-[15px]">
              This builder lets you create different resume files for different opportunities while keeping previous versions available to open anytime.
            </p>
          </div>
        </div>
      </section>

      {feedbackMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {feedbackMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
          Loading resume workspace...
        </div>
      ) : (
        <>
          <ResumeHistoryList resumes={savedResumes} />

          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
            <div className="flex flex-wrap items-center gap-3">
              {resumeSelectionSteps.map((step, index) => {
                const isActive = currentStepIndex === index;
                const isCompleted = currentStepIndex > index;

                return (
                  <div
                    key={step.key}
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] ${
                      isActive
                        ? "border-cyan-200 bg-cyan-50 text-cyan-700"
                        : isCompleted
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-50 text-slate-500"
                    }`}
                  >
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px]">
                      {index + 1}
                    </span>
                    {step.label}
                  </div>
                );
              })}
            </div>

            <div className="mt-6 overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${currentStepIndex * 100}%)` }}
              >
                {resumeSelectionSteps.map((step) => (
                  <div key={step.key} className="min-w-full">
                    {renderStep(step.key)}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => moveStep(-1)}
                disabled={currentStepIndex === 0}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>

              <div className="flex flex-col items-center gap-3 text-sm text-slate-500">
                {currentStepIndex === resumeSelectionSteps.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleGenerateResume}
                    disabled={!selectedTemplate || isGenerating}
                    className="inline-flex rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {isGenerating ? "Generating Resume..." : "Generate Resume"}
                  </button>
                ) : null}
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-cyan-600" />
                  <span>
                    Step {currentStepIndex + 1} of {resumeSelectionSteps.length}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => moveStep(1)}
                disabled={currentStepIndex === resumeSelectionSteps.length - 1}
                className="inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-cyan-50 p-3 text-cyan-700">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">How this works</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  The two PDF files in the public folder are used as the first-choice reference templates. Your final generated resume file is saved on the server, so previous versions can be reopened directly later without rebuilding them again.
                </p>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
