import { useEffect, useMemo, useState } from "react";
import {
  Award,
  Calendar,
  CheckCheck,
  CheckCircle2,
  CircleDot,
  FileText,
  Sparkles,
  Users,
  XCircle,
} from "lucide-react";
import {
  formatPlacementDeadline,
  hydratePlacementJob,
  isPlacementActive,
  splitLines,
} from "../../shared/placementJobs";
import { applyForPlacement, fetchPlacements } from "../../shared/placementApi";
import { getStudentProfile } from "../profile/services/studentProfileApi";

const STUDENT_ID_STORAGE_KEY = "training-placement-active-student";

const listTabs = [
  { key: "all", label: "All Jobs" },
  { key: "ongoing", label: "Ongoing Jobs" },
];

const detailTabs = [
  { key: "job-description", label: "Job Description" },
  { key: "eligibility", label: "Eligibility Criteria" },
  { key: "workflow", label: "Hiring Workflow" },
];

function isPlacedApplication(application) {
  return application?.status === "placed" || application?.finalOutcome === "placed";
}

function getCelebrationStorageKey(application) {
  return `training-placement-celebrated-${application?.id || application?.opportunityId || "placed"}`;
}

function TextWithShowMore({ text, limit = 240 }) {
  const [expanded, setExpanded] = useState(false);

  if (!text) {
    return <p className="text-sm text-slate-500">No content available.</p>;
  }

  const isLong = text.length > limit;
  const content = expanded || !isLong ? text : `${text.slice(0, limit)}...`;

  return (
    <div>
      <p className="whitespace-pre-line text-sm leading-6 text-slate-700">{content}</p>
      {isLong ? (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-2 text-sm font-medium text-blue-700 hover:text-blue-800"
        >
          {expanded ? "Show Less" : "Show More"}
        </button>
      ) : null}
    </div>
  );
}

function InlineDetail({ label, value }) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[150px_1fr] sm:gap-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
        {label}
      </p>
      <p className="text-sm leading-6 text-slate-700">{value || "Not specified"}</p>
    </div>
  );
}

function SectionHeader({ title }) {
  return (
    <div className="border-b border-slate-200/80 pb-3">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
    </div>
  );
}

function EligibilityMetricCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value || "Not specified"}</p>
    </div>
  );
}

function parseAllowedDepartments(value) {
  if (!value) {
    return [];
  }

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeDepartment(value) {
  return String(value || "").trim().toLowerCase();
}

function evaluateJobEligibility(profile, job) {
  if (!profile || !job) {
    return {
      isEligible: false,
      reason: "Student profile is still loading.",
    };
  }

  const allowedDepartments = parseAllowedDepartments(job.additional?.allowedDepartments);
  const minCgpa = job.additional?.minCgpa === "" ? null : Number(job.additional?.minCgpa);
  const maxBacklogs = job.additional?.maxBacklogs === "" ? null : Number(job.additional?.maxBacklogs);
  const passingYear = job.additional?.passingYear === "" ? null : Number(job.additional?.passingYear);

  const checks = {
    department:
      allowedDepartments.length === 0 ||
      allowedDepartments.map(normalizeDepartment).includes(normalizeDepartment(profile.department)),
    cgpa: minCgpa === null || Number(profile.currentCgpa) >= minCgpa,
    backlogs: maxBacklogs === null || Number(profile.backlogs) <= maxBacklogs,
    passingYear: passingYear === null || Number(profile.passingYear) === passingYear,
  };

  if (!checks.department) {
    return { isEligible: false, reason: "Your department is not in the allowed departments list." };
  }

  if (!checks.cgpa) {
    return { isEligible: false, reason: "Your current CGPA does not meet the minimum requirement." };
  }

  if (!checks.backlogs) {
    return { isEligible: false, reason: "Your active backlog count is above the allowed limit." };
  }

  if (!checks.passingYear) {
    return { isEligible: false, reason: "Your passing year does not match this opportunity." };
  }

  return { isEligible: true, reason: "You are eligible to apply for this opportunity." };
}

function getStudentWorkflowStyles(status) {
  if (status === "qualified") {
    return {
      dot: "border-emerald-500 bg-emerald-500",
      line: "bg-emerald-200",
      badge: "border border-emerald-200 bg-emerald-50 text-emerald-700",
      card: "border-emerald-200 bg-emerald-50/60",
    };
  }

  if (status === "rejected") {
    return {
      dot: "border-rose-500 bg-rose-500",
      line: "bg-rose-200",
      badge: "border border-rose-200 bg-rose-50 text-rose-700",
      card: "border-rose-200 bg-rose-50/60",
    };
  }

  return {
    dot: "border-amber-400 bg-amber-400",
    line: "bg-slate-200",
    badge: "border border-amber-200 bg-amber-50 text-amber-700",
    card: "border-slate-200 bg-slate-50/60",
  };
}

function getStudentWorkflowIcon(status) {
  if (status === "qualified") {
    return CheckCheck;
  }

  if (status === "rejected") {
    return XCircle;
  }

  if (status === "pending") {
    return CircleDot;
  }

  return Calendar;
}

function StudentWorkflowTimeline({ workflow = [] }) {
  if (!workflow.length) {
    return <p className="text-sm leading-6 text-slate-500">No workflow data available.</p>;
  }

  const qualifiedCount = workflow.filter((item) => item.studentStatus === "qualified").length;
  const pendingCount = workflow.filter((item) => item.studentStatus === "pending").length;
  const rejectedStage = workflow.find((item) => item.studentStatus === "rejected")?.stage || "None";

  return (
    <section className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            Personal Progress
          </p>
          <h4 className="mt-2 text-lg font-semibold text-slate-900">
            Your stage-wise application journey
          </h4>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Each round below shows your current result for that stage, based on your personal workflow record.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Total Rounds
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{workflow.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Qualified
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{qualifiedCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Pending
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{pendingCount}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          Qualified
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          Pending
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-rose-700">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
          Rejected
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">
          Rejection Stage: {rejectedStage}
        </span>
      </div>

      <div className="space-y-4">
        {workflow.map((item, index) => {
          const styles = getStudentWorkflowStyles(item.studentStatus);
          const Icon = getStudentWorkflowIcon(item.studentStatus);
          const isLast = index === workflow.length - 1;

          return (
            <div key={`${item.stage}-${item.date}-${index}`} className="flex gap-4">
              <div className="flex w-5 flex-col items-center">
                <span className={`mt-2 h-4 w-4 rounded-full border-2 ${styles.dot}`} />
                {!isLast ? <span className={`mt-2 w-0.5 flex-1 ${styles.line}`} /> : null}
              </div>

              <div className={`flex-1 rounded-2xl border p-5 ${styles.card}`}>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-3">
                    <span className="rounded-2xl bg-white p-3 text-slate-600 shadow-sm">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-base font-semibold text-slate-900">{item.stage}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Round Date: {item.date || "Date not scheduled"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${styles.badge}`}>
                      {item.studentStatus || "pending"}
                    </span>
                    {item.studentUpdatedAt ? (
                      <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">
                        <Users className="h-3.5 w-3.5" />
                        Updated
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PlacementCelebrationModal({ placement, onClose }) {
  const confettiPieces = Array.from({ length: 120 }, (_, index) => index);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-hidden bg-slate-950/75 px-4 py-6">
      <style>
        {`
          @keyframes placement-paper-fall {
            0% { transform: translate3d(0, -125vh, 0) rotate(0deg); opacity: 0; }
            6% { opacity: 1; }
            100% { transform: translate3d(var(--placement-sway), 125vh, 0) rotate(var(--placement-spin)); opacity: 0.95; }
          }

          @keyframes placement-ribbon-fall {
            0% { transform: translate3d(0, -120vh, 0) rotate(0deg) scaleY(1); opacity: 0; }
            8% { opacity: 1; }
            55% { transform: translate3d(calc(var(--placement-sway) * 0.55), 15vh, 0) rotate(calc(var(--placement-spin) * 0.55)) scaleY(1.25); }
            100% { transform: translate3d(var(--placement-sway), 125vh, 0) rotate(var(--placement-spin)) scaleY(0.9); opacity: 0.9; }
          }

          @keyframes placement-card-rise {
            0% { transform: translateY(18px) scale(0.96); opacity: 0; }
            100% { transform: translateY(0) scale(1); opacity: 1; }
          }
        `}
      </style>

      <div className="pointer-events-none absolute inset-0">
        {confettiPieces.map((piece) => {
          const colors = ["#fbbf24", "#34d399", "#38bdf8", "#fb7185", "#a3e635", "#f97316"];
          const isRibbon = piece % 4 === 0;
          const size = 10 + (piece % 7) * 4;
          const delay = -(piece % 30) * 0.22;
          const duration = 4.2 + (piece % 8) * 0.42;
          const opacity = 0.72 + (piece % 5) * 0.06;

          return (
            <span
              key={piece}
              className={`absolute ${isRibbon ? "rounded-full" : "rounded-[3px]"}`}
              style={{
                left: `${(piece * 37) % 100}%`,
                top: `${-35 - (piece % 12) * 6}%`,
                width: `${isRibbon ? size * 0.46 : size}px`,
                height: `${isRibbon ? size * 2.25 : size * 0.68}px`,
                backgroundColor: colors[piece % colors.length],
                opacity,
                animation: `${isRibbon ? "placement-ribbon-fall" : "placement-paper-fall"} ${duration}s linear ${delay}s infinite`,
                "--placement-sway": `${piece % 2 === 0 ? "" : "-"}${80 + (piece % 9) * 28}px`,
                "--placement-spin": `${piece % 2 === 0 ? "" : "-"}${560 + (piece % 8) * 120}deg`,
              }}
            />
          );
        })}
      </div>

      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-[36px] border border-amber-200 bg-white shadow-2xl shadow-amber-950/30"
        style={{ animation: "placement-card-rise 420ms ease-out both" }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.28),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(20,184,166,0.2),transparent_38%)]" />
        <div className="relative px-6 py-8 text-center sm:px-10 sm:py-10">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-600 shadow-lg shadow-amber-200/70">
            <Award className="h-10 w-10" />
          </div>

          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
            <Sparkles className="h-4 w-4" />
            Placed
          </div>

          <h2 className="mt-5 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Congratulations, you are placed!
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">
            Your final round is cleared and your placement has been confirmed
            {placement?.company ? ` at ${placement.company}` : ""}. This is a proud milestone.
          </p>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-white/85 p-5 text-left shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Placement Details
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-950">
              {placement?.company || "Company"} {placement?.title ? `| ${placement.title}` : ""}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              You can continue viewing opportunities and process details, but new applications are locked now because your status is marked as placed.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-7 inline-flex items-center justify-center rounded-2xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Close and view opportunities
          </button>
        </div>
      </div>
    </div>
  );
}

export default function JobProfiles() {
  const [jobs, setJobs] = useState([]);
  const [studentProfile, setStudentProfile] = useState(null);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [applyMessage, setApplyMessage] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [activeListTab, setActiveListTab] = useState("all");
  const [activeDetailTab, setActiveDetailTab] = useState("job-description");
  const [activeAttachment, setActiveAttachment] = useState(null);
  const [celebrationPlacement, setCelebrationPlacement] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadJobs() {
      try {
        const studentPrn = window.localStorage.getItem(STUDENT_ID_STORAGE_KEY) || "";
        const [profileData, nextJobs] = await Promise.all([
          getStudentProfile(),
          fetchPlacements("student", studentPrn ? { studentPrn } : {}),
        ]);

        if (!isMounted) {
          return;
        }

        setStudentProfile(profileData);
        setJobs(nextJobs);
        setSelectedJobId((currentId) => {
          const stillExists = nextJobs.some((job) => String(job.id) === String(currentId));
          return stillExists ? currentId : nextJobs[0]?.id ?? null;
        });
        setLoadError("");
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setJobs([]);
        setLoadError(error.response?.data?.message || "Unable to load placements from the server.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadJobs();

    return () => {
      isMounted = false;
    };
  }, []);

  const ongoingCount = useMemo(
    () => jobs.filter((job) => isPlacementActive(job)).length,
    [jobs],
  );

  const filteredJobs = useMemo(() => {
    if (activeListTab === "ongoing") {
      return jobs.filter((job) => isPlacementActive(job));
    }

    return jobs;
  }, [activeListTab, jobs]);

  const selectedJob = useMemo(() => {
    const bySelection = jobs.find((job) => job.id === selectedJobId);
    return bySelection ?? filteredJobs[0] ?? null;
  }, [filteredJobs, jobs, selectedJobId]);

  const selectedJobEligibility = useMemo(
    () => evaluateJobEligibility(studentProfile, selectedJob),
    [selectedJob, studentProfile],
  );

  const selectedAttachment = selectedJob ? hydratePlacementJob(selectedJob).attachment?.[0] : null;

  const placedJob = useMemo(
    () => jobs.find((job) => isPlacedApplication(job.application)) || null,
    [jobs],
  );
  const isStudentPlaced = Boolean(placedJob);

  useEffect(() => {
    setApplyMessage("");
  }, [selectedJobId]);

  useEffect(() => {
    const placement = placedJob?.application;

    if (!placement) {
      return;
    }

    const storageKey = getCelebrationStorageKey(placement);

    if (window.localStorage.getItem(storageKey) === "true") {
      return;
    }

    setCelebrationPlacement({
      ...placement,
      company: placedJob.company,
      title: placedJob.title,
    });
  }, [placedJob]);

  function openAttachmentPreview() {
    if (!selectedAttachment?.url) {
      return;
    }

    setActiveAttachment({
      url: selectedAttachment.url,
      title: selectedAttachment.name || selectedJob?.title || "Attachment Preview",
    });
  }

  function closeAttachmentPreview() {
    setActiveAttachment(null);
  }

  async function handleApplyNow() {
    if (
      !selectedJob ||
      isApplying ||
      !selectedJobEligibility.isEligible ||
      selectedJob.application ||
      isStudentPlaced
    ) {
      return;
    }

    const confirmed = window.confirm(
      "Submit this application? Your application will be sent to TPO for verification before it moves ahead in the company process.",
    );

    if (!confirmed) {
      return;
    }

    try {
      setIsApplying(true);
      const application = await applyForPlacement(selectedJob.id);

      setJobs((prev) =>
        prev.map((job) =>
          String(job.id) === String(selectedJob.id)
            ? {
                ...job,
                application,
              }
            : job,
        ),
      );
      setApplyMessage("Application submitted. It has been sent to TPO for verification.");
      window.alert("Application submitted successfully. It has been sent to TPO for verification.");
    } catch (error) {
      const message = error.response?.data?.message || "Unable to submit your application right now.";
      setApplyMessage(message);
      window.alert(message);
    } finally {
      setIsApplying(false);
    }
  }

  function closeCelebrationModal() {
    if (celebrationPlacement) {
      window.localStorage.setItem(getCelebrationStorageKey(celebrationPlacement), "true");
    }

    setCelebrationPlacement(null);
  }

  function renderJobDetailsContent() {
    if (!selectedJob) {
      return null;
    }

    if (activeDetailTab === "eligibility") {
      return (
        <section className="space-y-6 py-2">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <EligibilityMetricCard label="Min CGPA" value={selectedJob.additional?.minCgpa} />
            <EligibilityMetricCard label="Max Backlogs" value={selectedJob.additional?.maxBacklogs} />
            <EligibilityMetricCard label="Allowed Departments" value={selectedJob.additional?.allowedDepartments} />
            <EligibilityMetricCard label="Passing Year" value={selectedJob.additional?.passingYear} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
              <h4 className="text-sm font-semibold text-slate-900">Required Skills</h4>
              <div className="mt-3">
                {selectedJob.additional?.requiredSkills?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.additional.requiredSkills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No skills specified.</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
              <h4 className="text-sm font-semibold text-slate-900">Additional Eligibility Notes</h4>
              <div className="mt-3">
                <TextWithShowMore text={selectedJob.additional?.extraInfo} limit={180} />
              </div>
            </div>
          </div>
        </section>
      );
    }

    if (activeDetailTab === "workflow") {
      return <StudentWorkflowTimeline workflow={selectedJob.workflow} />;
    }

    return (
      <section className="space-y-8">
        <div className="space-y-4 border-b border-slate-200/70 pb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            Opening Overview
          </p>
          <div className="divide-y divide-slate-200/70">
            <InlineDetail label="Category" value={selectedJob.overview.category} />
            <InlineDetail label="Level" value={selectedJob.overview.level} />
            <InlineDetail label="Job Functions" value={selectedJob.overview.functions} />
            <InlineDetail
              label="CTC"
              value={selectedJob.overview.ctc ? `${selectedJob.overview.ctc} LPA` : ""}
            />
            <InlineDetail label="Other Info" value={selectedJob.overview.otherInfo} />
          </div>
        </div>

        <div className="space-y-3 border-b border-slate-200/70 pb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            Role Overview
          </p>
          <TextWithShowMore text={selectedJob.description.roleOverview} />
        </div>

        <div className="space-y-3 border-b border-slate-200/70 pb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            Key Responsibilities
          </p>
          {splitLines(selectedJob.description.responsibilities).length > 0 ? (
            <ul className="space-y-2 text-sm leading-6 text-slate-700">
              {splitLines(selectedJob.description.responsibilities).map((item, index) => (
                <li key={`${selectedJob.id}-responsibility-${index}`} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No responsibilities listed.</p>
          )}
        </div>

        <div className="space-y-3 border-b border-slate-200/70 pb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            Required Skills & Attributes
          </p>
          <TextWithShowMore text={selectedJob.description.skills} />
        </div>

        <div className="space-y-3 border-b border-slate-200/70 pb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            What We Offer
          </p>
          <TextWithShowMore text={selectedJob.description.offer} />
        </div>

        <div className="space-y-3 border-b border-slate-200/70 pb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            Disclaimer
          </p>
          <TextWithShowMore text={selectedJob.description.disclaimer} />
        </div>

        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            Attached Documents
          </p>
          {selectedAttachment?.url ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-white p-2 text-slate-500 shadow-sm">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={openAttachmentPreview}
                    className="text-sm font-semibold text-blue-700 hover:text-blue-800"
                  >
                    {selectedAttachment.name || "Open attached document"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No attachment provided.</p>
          )}
        </div>
      </section>
    );
  }

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-[90rem] space-y-6">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:p-6">
          <div className="flex flex-col gap-5 lg:h-[78vh] lg:flex-row">
            <div className="min-w-0 lg:w-[30%] lg:border-r lg:border-slate-200 lg:pr-4">
              <div className="flex h-full flex-col overflow-hidden">
                <div className="flex items-center gap-4 border-b border-slate-200/80 pb-2">
                  {listTabs.map((tab) => {
                    const count = tab.key === "all" ? jobs.length : ongoingCount;
                    const active = activeListTab === tab.key;

                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveListTab(tab.key)}
                        className={`border-b-2 pb-2 text-sm font-medium transition ${
                          active
                            ? "border-blue-600 text-blue-700"
                            : "border-transparent text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        {tab.label} ({count})
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 min-h-0 flex-1 overflow-y-auto scroll-smooth pr-1">
                  {loading ? (
                    <p className="py-8 text-sm text-slate-500">Loading jobs...</p>
                  ) : null}
                  {!loading && loadError ? (
                    <p className="py-8 text-sm text-rose-600">{loadError}</p>
                  ) : null}
                  {!loading && !loadError && filteredJobs.length === 0 ? (
                    <p className="py-8 text-sm text-slate-500">No jobs available right now.</p>
                  ) : (
                    filteredJobs.map((job) => {
                      const active = selectedJob?.id === job.id;
                      const status = isPlacementActive(job) ? "Active" : "Closed";
                      const eligibility = evaluateJobEligibility(studentProfile, job);
                      const isJobPlaced = isPlacedApplication(job.application);

                      return (
                        <button
                          key={job.id}
                          type="button"
                          onClick={() => setSelectedJobId(job.id)}
                          className={`mb-1.5 w-full rounded-lg px-3 py-2 text-left transition ${
                            active
                              ? "bg-blue-50 text-slate-900"
                              : "text-slate-700 hover:bg-slate-100/80"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {job.company} | {job.title}
                            </p>
                            {eligibility.isEligible ? (
                              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                            ) : null}
                          </div>
                          <p className="mt-0.5 truncate text-xs text-slate-600">{job.location}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <p
                              className={`text-xs font-medium ${
                                status === "Active" ? "text-emerald-600" : "text-rose-600"
                              }`}
                            >
                              {status}
                            </p>
                            {job.application ? (
                              <span
                                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                                  isJobPlaced
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : "border-blue-200 bg-blue-50 text-blue-700"
                                }`}
                              >
                                {isJobPlaced ? "Placed" : "Applied"}
                              </span>
                            ) : null}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="min-w-0 lg:w-[70%]">
              <div className="flex h-full flex-col overflow-hidden">
                {!selectedJob ? (
                  <p className="text-sm text-slate-500">Select a job to view details.</p>
                ) : (
                  <>
                    <header className="border-b border-slate-200/80 pb-4">
                      <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              {isStudentPlaced ? (
                                <Award className="h-5 w-5 text-amber-600" />
                              ) : selectedJobEligibility.isEligible ? (
                                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                              ) : (
                                <XCircle className="h-5 w-5 text-rose-500" />
                              )}
                              <p
                                className={`text-sm font-semibold ${
                                  isStudentPlaced
                                    ? "text-amber-700"
                                    : selectedJobEligibility.isEligible
                                      ? "text-emerald-700"
                                      : "text-rose-700"
                                }`}
                              >
                                {isStudentPlaced
                                  ? `You are placed${placedJob?.company ? ` at ${placedJob.company}` : ""}.`
                                  : selectedJobEligibility.isEligible
                                    ? "You are eligible. Apply here."
                                    : "You are not eligible."}
                              </p>
                            </div>
                            <p className="mt-1 text-sm text-slate-600">
                              {isStudentPlaced
                                ? "You can view opportunities, but applying is disabled after placement confirmation."
                                : selectedJobEligibility.reason}
                            </p>
                            {selectedJob.application ? (
                              <p className="mt-2 text-sm font-medium text-blue-700">
                                You have already applied. Current status:{" "}
                                {selectedJob.application.status?.replaceAll("_", " ") || "pending verification"}.
                              </p>
                            ) : null}
                            {applyMessage ? (
                              <p className="mt-2 text-sm font-medium text-blue-700">{applyMessage}</p>
                            ) : null}
                          </div>

                          <button
                            type="button"
                            onClick={handleApplyNow}
                            disabled={
                              isApplying ||
                              !selectedJobEligibility.isEligible ||
                              !isPlacementActive(selectedJob) ||
                              Boolean(selectedJob.application) ||
                              isStudentPlaced
                            }
                            className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                          >
                            {isPlacedApplication(selectedJob.application)
                              ? "Placed"
                              : isStudentPlaced
                                ? "View Only"
                                : selectedJob.application
                                  ? "Already Applied"
                                  : isApplying
                                    ? "Applying..."
                                    : "Apply Now"}
                          </button>
                        </div>
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate text-xl font-semibold text-slate-900">
                          {selectedJob.title}
                        </h3>
                        <p className="mt-1 truncate text-sm text-slate-600">
                          {selectedJob.company} | {selectedJob.location} | {selectedJob.type}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Deadline: {formatPlacementDeadline(selectedJob.deadline)}
                        </p>
                      </div>
                    </header>

                    <div className="mt-5 min-h-0 flex-1 overflow-y-auto scroll-smooth pr-1">
                      <div className="flex flex-wrap gap-6 border-b border-slate-200/80 pb-3">
                        {detailTabs.map((tab) => {
                          const active = activeDetailTab === tab.key;

                          return (
                            <button
                              key={tab.key}
                              type="button"
                              onClick={() => setActiveDetailTab(tab.key)}
                              className={`pb-2 text-sm font-medium transition ${
                                active
                                  ? "border-b-2 border-blue-600 text-blue-700"
                                  : "border-b-2 border-transparent text-slate-500 hover:text-slate-700"
                              }`}
                            >
                              {tab.label}
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-6">{renderJobDetailsContent()}</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {activeAttachment ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6">
          <div className="flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Attachment Preview
                </p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">
                  {activeAttachment.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={closeAttachmentPreview}
                className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            <div className="min-h-0 flex-1 bg-slate-100 p-4">
              <iframe
                src={activeAttachment.url}
                title={activeAttachment.title}
                className="h-full w-full rounded-2xl border border-slate-200 bg-white"
              />
            </div>
          </div>
        </div>
      ) : null}
      {celebrationPlacement ? (
        <PlacementCelebrationModal
          placement={celebrationPlacement}
          onClose={closeCelebrationModal}
        />
      ) : null}
    </div>
  );
}
