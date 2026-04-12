import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  CheckCheck,
  CircleDot,
  EyeOff,
  FileText,
  PlusCircle,
  SendHorizonal,
  Upload,
  XCircle,
} from "lucide-react";
import TpoSidebar from "./Tpo_sidebar";
import {
  emptyPlacementForm,
  formatPlacementDeadline,
  getPlacementFormFromJob,
  isPlacementActive,
  isPlacementFormValid,
  normalizePlacementAttachment,
  parsePlacementDepartments,
  placementDepartmentOptions,
  splitLines,
} from "../../shared/placementJobs";
import {
  createPlacement,
  deletePlacement,
  fetchPlacements,
  updatePlacement,
} from "../../shared/placementApi";
import { upsertStageResults } from "../application_tracking/services/applicationTrackingApi";

const listTabs = [
  { key: "all", label: "All Jobs" },
  { key: "ongoing", label: "Ongoing Jobs" },
];

const detailTabs = [
  { key: "job-description", label: "Job Description" },
  { key: "eligibility", label: "Eligibility Criteria" },
  { key: "workflow", label: "Hiring Workflow" },
];

function buildRoundTemplateCsv(stageName = "") {
  const rows = [
    ["PRN", "stage_result"],
    ["2453014", "cleared"],
    ["2453015", "rejected"],
  ];

  return rows
    .map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(","))
    .join("\n");
}

function downloadRoundTemplate(stageName, fileNamePrefix = "workflow") {
  const blob = new Blob([buildRoundTemplateCsv(stageName)], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safePrefix = String(fileNamePrefix || "workflow").trim().replace(/\s+/g, "_");
  const safeStage = String(stageName || "round").trim().replace(/\s+/g, "_");

  link.href = url;
  link.download = `${safePrefix}_${safeStage}_template.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function parseCsvRow(rowText) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < rowText.length; index += 1) {
    const char = rowText[index];
    const nextChar = rowText[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values.map((value) => value.trim());
}

function parseRoundImportCsv(csvText) {
  const rows = String(csvText || "")
    .split(/\r?\n/)
    .map((row) => row.trim())
    .filter(Boolean);

  if (rows.length <= 1) {
    return [];
  }

  const header = parseCsvRow(rows[0]).map((item) => item.toLowerCase());

  return rows
    .slice(1)
    .map((rowText) => {
      const cells = parseCsvRow(rowText);
      const record = {};

      header.forEach((key, index) => {
        record[key] = cells[index] ?? "";
      });

      return {
        prn: extractNormalizedPrns(record.prn || record.student_prn || "")[0] || "",
        stage_result: record.stage_result || record.result || "cleared",
      };
    })
    .filter((item) => item.prn);
}

function extractNormalizedPrns(value) {
  return String(value || "")
    .split(/[\s,;]+/)
    .map((item) => item.trim().toUpperCase().replace(/[^A-Z0-9]/g, ""))
    .filter(Boolean);
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
          className="mt-2 text-sm font-medium text-cyan-700 hover:text-cyan-800"
        >
          {expanded ? "Show Less" : "Show More"}
        </button>
      ) : null}
    </div>
  );
}

function DetailBlock({ label, text, bullets = false }) {
  const lines = bullets ? splitLines(text) : [];

  return (
    <div>
      <h4 className="text-sm font-semibold text-slate-900">{label}</h4>
      <div className="mt-2">
        {bullets ? (
          lines.length > 0 ? (
            <ul className="space-y-2 text-sm leading-6 text-slate-700">
              {lines.map((line, index) => (
                <li key={`${label}-${index}`} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No content available.</p>
          )
        ) : (
          <TextWithShowMore text={text} />
        )}
      </div>
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

function AttachmentDetails({ attachment }) {
  const attachmentData = normalizePlacementAttachment(attachment);

  if (attachmentData.length === 0) {
    return <p className="text-sm text-slate-500">No documents attached.</p>;
  }

  return (
    <div className="space-y-3">
      {attachmentData.map((item, index) => (
        <div key={`${item.name}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-white p-2 text-slate-500 shadow-sm">
              <FileText className="h-4 w-4" />
            </div>

            <div className="min-w-0 flex-1">
              {item.name ? (
                item.url ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate text-sm font-semibold text-cyan-700 hover:text-cyan-800"
                  >
                    {item.name}
                  </a>
                ) : (
                  <p className="truncate text-sm font-semibold text-slate-900">{item.name}</p>
                )
              ) : null}
              {item.type ? (
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                  {item.type}
                </p>
              ) : null}
              {item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex text-sm font-medium text-cyan-700 hover:text-cyan-800"
                >
                  Open attached file
                </a>
              ) : null}
              {item.notice ? (
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">
                  {item.notice}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ))}
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

function getWorkflowStyles(status) {
  if (status === "completed") {
    return {
      dot: "border-emerald-500 bg-emerald-500",
      line: "bg-emerald-200",
      badge: "border border-emerald-200 bg-emerald-50 text-emerald-700",
      card: "border-emerald-200 bg-emerald-50/60",
    };
  }

  if (status === "current") {
    return {
      dot: "border-cyan-500 bg-cyan-500 ring-4 ring-cyan-100",
      line: "bg-slate-200",
      badge: "border border-cyan-200 bg-cyan-50 text-cyan-700",
      card: "border-cyan-200 bg-cyan-50/60",
    };
  }

  return {
    dot: "border-slate-300 bg-white",
    line: "bg-slate-200",
    badge: "border border-slate-200 bg-slate-50 text-slate-600",
    card: "border-slate-200 bg-slate-50/60",
  };
}

function getWorkflowIcon(status) {
  if (status === "completed") {
    return CheckCheck;
  }

  if (status === "current") {
    return CircleDot;
  }

  if (status === "rejected") {
    return XCircle;
  }

  return Calendar;
}

function HiringWorkflowMindmap({
  workflow = [],
  isActive = false,
  onEditWorkflow,
  onImportRound,
  onTypePrn,
  onDownloadTemplate,
  typingStageId,
  manualPrnDraft,
  manualPrnEntries,
  onManualPrnDraftChange,
  onManualPrnDraftKeyDown,
  onAddManualPrn,
  onRemoveManualPrn,
  onSubmitManualPrns,
  isSubmittingManualPrns = false,
}) {
  if (!workflow.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-6">
        <p className="text-sm leading-6 text-slate-500">No workflow data available.</p>
        {typeof onEditWorkflow === "function" ? (
          <button
            type="button"
            onClick={onEditWorkflow}
            className="mt-4 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-2.5 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100"
          >
            Edit Workflow
          </button>
        ) : null}
      </div>
    );
  }

  const currentStage = workflow.find((item) => item.status === "current")?.stage || "Completed";
  const completedStages = workflow.filter((item) => item.status === "completed").length;
  const upcomingStages = workflow.filter((item) => item.status === "upcoming").length;
  const hasSelectionCounts = workflow.some(
    (item) => item.selectedCount !== null && item.selectedCount !== undefined,
  );
  const firstStageCount = hasSelectionCounts ? workflow[0]?.selectedCount ?? 0 : 0;
  const finalStageCount = hasSelectionCounts ? workflow[workflow.length - 1]?.selectedCount ?? 0 : 0;
  const conversionRate = hasSelectionCounts && firstStageCount > 0
    ? `${Math.round((finalStageCount / firstStageCount) * 100)}%`
    : null;

  return (
    <section className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            {isActive ? "Workflow Plan" : "Process History"}
          </p>
          <h4 className="mt-2 text-lg font-semibold text-slate-900">
            {isActive ? "Planned hiring roadmap" : "Stage-wise student selection flow"}
          </h4>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {isActive
              ? "This plan shows the expected hiring journey for the currently active drive."
              : "This map shows how many students progressed at each step of the hiring process."}
          </p>
          <div className="mt-5 space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Workflow Notes
            </p>
            <p className="text-sm leading-6 text-slate-600">
              Note 1: `Import` is used to upload the dummy Excel/CSV format and bulk update the
              next round records.
            </p>
            <p className="text-sm leading-6 text-slate-600">
              Note 2: `Type PRN` can be used to manually enter selected student PRNs for a completed round.
            </p>
            <button
              type="button"
              onClick={() => onDownloadTemplate?.()}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Download Dummy Excel Template
            </button>
          </div>
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
              Completed
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{completedStages}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {conversionRate ? "Selection Rate" : "Upcoming"}
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {conversionRate || upcomingStages}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          Completed
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700">
          <span className="h-2.5 w-2.5 rounded-full bg-cyan-500" />
          Current
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
          <span className="h-2.5 w-2.5 rounded-full border border-slate-300 bg-white" />
          Upcoming
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">
          Current Focus: {currentStage}
        </span>
      </div>

      <div className="space-y-4">
        {workflow.map((item, index) => {
          const styles = getWorkflowStyles(item.status);
          const Icon = getWorkflowIcon(item.status);
          const isLast = index === workflow.length - 1;
          const isTypingOpen = typingStageId === item.id;
          const stageEntries = isTypingOpen ? manualPrnEntries : [];

          return (
            <div key={`${item.stage}-${item.date}-${index}`} className="flex gap-4">
              <div className="flex w-5 flex-col items-center">
                <span className={`mt-2 h-4 w-4 rounded-full border-2 ${styles.dot}`} />
                {!isLast ? <span className={`mt-2 w-0.5 flex-1 ${styles.line}`} /> : null}
              </div>

              <div className={`flex-1 rounded-2xl border p-5 ${styles.card}`}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
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

                  {item.status === "completed" ? (
                    <div className="flex justify-start lg:justify-center">
                      <div className="min-w-[108px] rounded-2xl border border-cyan-100 bg-white/95 px-4 py-3 text-center shadow-sm">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Cleared
                        </p>
                        <p className="mt-1 text-2xl font-semibold text-cyan-700">
                          {item.selectedCount ?? 0}
                        </p>
                      </div>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    {item.status === "completed" ? (
                      <>
                        <button
                          type="button"
                          onClick={() => onImportRound?.(item, index)}
                          className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 transition hover:bg-slate-50"
                        >
                          Import
                        </button>
                        <button
                          type="button"
                          onClick={() => onTypePrn?.(item, index)}
                          className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 transition hover:bg-slate-50"
                        >
                          {isTypingOpen ? "Close PRN Entry" : "Type PRN"}
                        </button>
                      </>
                    ) : null}
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${styles.badge}`}>
                      {item.status}
                    </span>
                  </div>
                </div>

                {isTypingOpen ? (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Manual PRN Entry
                    </p>
                    <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                      <input
                        type="text"
                        value={manualPrnDraft}
                        onChange={(event) => onManualPrnDraftChange?.(event.target.value)}
                        onKeyDown={(event) => onManualPrnDraftKeyDown?.(event, item)}
                        placeholder="Enter one PRN and press Enter"
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-cyan-500"
                      />
                      <button
                        type="button"
                        onClick={() => onAddManualPrn?.(item)}
                        className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100"
                      >
                        Add PRN
                      </button>
                    </div>

                    <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Added PRNs
                      </p>
                      {stageEntries.length ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {stageEntries.map((prn) => (
                            <span
                              key={`${item.id}-${prn}`}
                              className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-cyan-700"
                            >
                              {prn}
                              <button
                                type="button"
                                onClick={() => onRemoveManualPrn?.(item, prn)}
                                className="text-cyan-700 transition hover:text-cyan-900"
                              >
                                x
                              </button>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-slate-500">
                          Enter a PRN above and press Enter to build the selected list.
                        </p>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => onSubmitManualPrns?.(item)}
                        disabled={!stageEntries.length || isSubmittingManualPrns}
                        className="rounded-2xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        {isSubmittingManualPrns ? "Submitting..." : "Submit PRNs"}
                      </button>
                      <p className="text-sm text-slate-500">
                        These PRNs will be added into the round result table after submit.
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function Placements({ onLogout }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const formRef = useRef(null);
  const workflowSectionRef = useRef(null);
  const workflowImportInputRef = useRef(null);
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [activeListTab, setActiveListTab] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingJobId, setEditingJobId] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [attachmentError, setAttachmentError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState("job-description");
  const [formData, setFormData] = useState(emptyPlacementForm);
  const [departmentPickerValue, setDepartmentPickerValue] = useState("");
  const [shouldScrollToWorkflow, setShouldScrollToWorkflow] = useState(false);
  const [pendingImportStage, setPendingImportStage] = useState(null);
  const [typingStageId, setTypingStageId] = useState(null);
  const [manualPrnDraft, setManualPrnDraft] = useState("");
  const [manualPrnEntries, setManualPrnEntries] = useState([]);

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

  async function reloadPlacements() {
    const nextJobs = await fetchPlacements();

    setJobs(nextJobs);
    setSelectedJobId((currentId) => {
      const stillExists = nextJobs.some((job) => String(job.id) === String(currentId));
      return stillExists ? currentId : nextJobs[0]?.id ?? null;
    });
    setLoadError("");

    return nextJobs;
  }

  useEffect(() => {
    let isMounted = true;

    async function loadJobs() {
      try {
        const nextJobs = await fetchPlacements();

        if (!isMounted) {
          return;
        }

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
          setIsLoading(false);
        }
      }
    }

    loadJobs();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!feedbackMessage) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setFeedbackMessage(""), 2500);
    return () => window.clearTimeout(timeoutId);
  }, [feedbackMessage]);

  useEffect(() => {
    if (!attachmentError) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setAttachmentError(""), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [attachmentError]);

  useEffect(() => {
    if (!showAddForm) {
      return;
    }

    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [editingJobId, showAddForm]);

  useEffect(() => {
    if (!showAddForm || !shouldScrollToWorkflow) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      workflowSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      setShouldScrollToWorkflow(false);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [showAddForm, shouldScrollToWorkflow, editingJobId]);

  function handleInputChange(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleWorkflowChange(index, field, value) {
    setFormData((prev) => ({
      ...prev,
      workflow: (prev.workflow ?? []).map((item, itemIndex) => (
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )),
    }));
  }

  function addWorkflowStage() {
    setFormData((prev) => ({
      ...prev,
      workflow: [...(prev.workflow ?? []), { roundName: "", roundDate: "" }],
    }));
  }

  function removeWorkflowStage(index) {
    setFormData((prev) => {
      const nextWorkflow = (prev.workflow ?? []).filter((_, itemIndex) => itemIndex !== index);

      return {
        ...prev,
        workflow: nextWorkflow.length > 0 ? nextWorkflow : [{ roundName: "", roundDate: "" }],
      };
    });
  }

  function openAttachmentInWindow(url) {
    if (!url) {
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer,width=1100,height=800");
  }

  function handleDeviceUpload(event) {
    const files = Array.from(event.target.files ?? []);

    if (files.length === 0) {
      return;
    }

    const allowedExtensions = ["pdf", "doc", "docx"];
    const currentAttachments = normalizePlacementAttachment(formData.attachment);

    if (currentAttachments.length + files.length > 6) {
      setAttachmentError("You can attach up to 6 documents for one placement.");
      event.target.value = "";
      return;
    }

    const invalidFile = files.find((file) => {
      const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
      return !allowedExtensions.includes(extension);
    });

    if (invalidFile) {
      setAttachmentError("Only PDF, DOC, and DOCX files are allowed.");
      event.target.value = "";
      return;
    }

    const nextAttachments = files.map((file) => {
      const extension = file.name.split(".").pop()?.toLowerCase() ?? "";

      return {
        name: file.name,
        type: file.type || extension.toUpperCase(),
        url: URL.createObjectURL(file),
        notice: "",
        file,
      };
    });

    setFormData((prev) => ({
      ...prev,
      attachment: [...normalizePlacementAttachment(prev.attachment), ...nextAttachments],
    }));
    setAttachmentError("");

    event.target.value = "";
  }

  function clearAttachment(index) {
    setFormData((prev) => {
      const nextAttachments = normalizePlacementAttachment(prev.attachment).filter(
        (_, itemIndex) => itemIndex !== index,
      );

      return {
        ...prev,
        attachment: nextAttachments.length > 0 ? nextAttachments : null,
      };
    });
    setAttachmentError("");
  }

  function resetFormState() {
    setFormData(emptyPlacementForm);
    setDepartmentPickerValue("");
    setAttachmentError("");
    setShowAddForm(false);
    setEditingJobId(null);
  }

  function handleToggleForm() {
    if (showAddForm && !editingJobId) {
      resetFormState();
      return;
    }

    setFormData(emptyPlacementForm);
    setDepartmentPickerValue("");
    setEditingJobId(null);
    setShowAddForm(true);
  }

  function handleEditPlacement() {
    if (!selectedJob) {
      return;
    }

    setFormData(getPlacementFormFromJob(selectedJob));
    setDepartmentPickerValue("");
    setEditingJobId(selectedJob.id);
    setShowAddForm(true);
  }

  function handleEditWorkflow() {
    if (!selectedJob) {
      return;
    }

    setFormData(getPlacementFormFromJob(selectedJob));
    setDepartmentPickerValue("");
    setEditingJobId(selectedJob.id);
    setShowAddForm(true);
    setShouldScrollToWorkflow(true);
  }

  function handleDownloadWorkflowTemplate() {
    downloadRoundTemplate(
      pendingImportStage?.stage || selectedJob?.workflow?.find((item) => item.status === "completed")?.stage || "round",
      `${selectedJob?.company || "company"}_${selectedJob?.title || "drive"}`,
    );
  }

  function handleImportRound(stage) {
    if (!stage?.id) {
      setLoadError("This hiring round is missing a valid stage id.");
      return;
    }

    setPendingImportStage(stage);
    workflowImportInputRef.current?.click();
  }

  async function handleWorkflowImportChange(event) {
    const file = event.target.files?.[0];

    if (!file || !pendingImportStage?.id) {
      event.target.value = "";
      return;
    }

    try {
      setIsSubmitting(true);
      setLoadError("");

      const csvText = await file.text();
      const results = parseRoundImportCsv(csvText);

      if (!results.length) {
        throw new Error("The selected file does not contain any valid PRN rows.");
      }

      const response = await upsertStageResults(pendingImportStage.id, results);
      await reloadPlacements();

      const missingPrnText = Array.isArray(response?.missingPrns) && response.missingPrns.length
        ? ` Missing PRNs: ${response.missingPrns.join(", ")}.`
        : "";
      const duplicatePrnText = Array.isArray(response?.duplicatePrns) && response.duplicatePrns.length
        ? ` Duplicate PRNs skipped: ${response.duplicatePrns.join(", ")}.`
        : "";
      const failedPrnText = Array.isArray(response?.failedPrns) && response.failedPrns.length
        ? ` Failed PRNs: ${response.failedPrns.map((item) => item.prn).join(", ")}.`
        : "";

      if (!response?.updatedCount) {
        setLoadError(
          `${response?.message || "No round results were updated."}${missingPrnText}${duplicatePrnText}${failedPrnText}`,
        );
        return;
      }

      setFeedbackMessage(
        `${response?.updatedCount || results.length} applicant records updated for ${pendingImportStage.stage}.${missingPrnText}${duplicatePrnText}${failedPrnText}`,
      );
    } catch (error) {
      setLoadError(error.response?.data?.message || error.message || "Unable to import round results.");
    } finally {
      setIsSubmitting(false);
      setPendingImportStage(null);
      event.target.value = "";
    }
  }

  function handleTypePrn(stage) {
    if (!stage?.id) {
      setLoadError("This hiring round is missing a valid stage id.");
      return;
    }

    setLoadError("");
    setFeedbackMessage("");
    setManualPrnDraft("");
    setManualPrnEntries([]);
    setTypingStageId((currentStageId) => (currentStageId === stage.id ? null : stage.id));
  }

  function addManualPrnToStage() {
    const nextPrns = extractNormalizedPrns(manualPrnDraft);

    if (!nextPrns.length) {
      return;
    }

    setManualPrnEntries((currentEntries) => {
      const nextEntries = [...currentEntries];

      nextPrns.forEach((prn) => {
        if (!nextEntries.includes(prn)) {
          nextEntries.push(prn);
        }
      });

      return nextEntries;
    });
    setManualPrnDraft("");
  }

  function handleManualPrnDraftKeyDown(event) {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    addManualPrnToStage();
  }

  function handleRemoveManualPrn(stage, prnToRemove) {
    if (stage?.id !== typingStageId) {
      return;
    }

    setManualPrnEntries((currentEntries) => (
      currentEntries.filter((prn) => prn !== prnToRemove)
    ));
  }

  async function handleSubmitManualPrns(stage) {
    if (!stage?.id) {
      setLoadError("This hiring round is missing a valid stage id.");
      return;
    }

    if (!manualPrnEntries.length) {
      setLoadError("Enter at least one PRN to update this round.");
      return;
    }

    try {
      setIsSubmitting(true);
      setLoadError("");

      const response = await upsertStageResults(
        stage.id,
        manualPrnEntries.map((prn) => ({
          prn,
          stage_result: "cleared",
        })),
      );

      await reloadPlacements();

      const missingPrnText = Array.isArray(response?.missingPrns) && response.missingPrns.length
        ? ` Missing PRNs: ${response.missingPrns.join(", ")}.`
        : "";
      const duplicatePrnText = Array.isArray(response?.duplicatePrns) && response.duplicatePrns.length
        ? ` Duplicate PRNs skipped: ${response.duplicatePrns.join(", ")}.`
        : "";
      const failedPrnText = Array.isArray(response?.failedPrns) && response.failedPrns.length
        ? ` Failed PRNs: ${response.failedPrns.map((item) => item.prn).join(", ")}.`
        : "";

      if (!response?.updatedCount) {
        setLoadError(
          `${response?.message || "No round results were updated."}${missingPrnText}${duplicatePrnText}${failedPrnText}`,
        );
        return;
      }

      setFeedbackMessage(
        `${response?.updatedCount || manualPrnEntries.length} applicant records updated for ${stage.stage}.${missingPrnText}${duplicatePrnText}${failedPrnText}`,
      );
      setTypingStageId(null);
      setManualPrnDraft("");
      setManualPrnEntries([]);
    } catch (error) {
      setLoadError(error.response?.data?.message || "Unable to update round results.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleAddAllowedDepartment(department) {
    const nextDepartment = String(department ?? "").trim();

    if (!nextDepartment) {
      return;
    }

    setFormData((prev) => {
      const currentDepartments = parsePlacementDepartments(prev.allowedDepartments);

      if (currentDepartments.includes(nextDepartment)) {
        return prev;
      }

      return {
        ...prev,
        allowedDepartments: [...currentDepartments, nextDepartment],
      };
    });
    setDepartmentPickerValue("");
  }

  function handleRemoveAllowedDepartment(departmentToRemove) {
    setFormData((prev) => ({
      ...prev,
      allowedDepartments: parsePlacementDepartments(prev.allowedDepartments).filter(
        (department) => department !== departmentToRemove,
      ),
    }));
  }

  async function handleDeletePlacement() {
    if (!selectedJob) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this placement?",
    );

    if (!confirmed) {
      return;
    }

    const deletedJobId = selectedJob.id;

    try {
      await deletePlacement(deletedJobId);

      const deletedIndex = jobs.findIndex((job) => job.id === deletedJobId);
      const updatedJobs = jobs.filter((job) => job.id !== deletedJobId);
      const nextJob =
        updatedJobs[deletedIndex] ??
        updatedJobs[Math.max(deletedIndex - 1, 0)] ??
        null;

      setJobs(updatedJobs);
      setSelectedJobId(nextJob?.id ?? null);
      setFeedbackMessage("Placement deleted");
      setLoadError("");

      if (editingJobId === deletedJobId) {
        resetFormState();
      }
    } catch (error) {
      setLoadError(error.response?.data?.message || "Unable to delete placement.");
    }
  }

  async function handlePlacementSubmit(event) {
    event.preventDefault();

    if (!isPlacementFormValid(formData) || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingJobId) {
        const existingPlacement = jobs.find((job) => String(job.id) === String(editingJobId)) ?? null;
        const updatedPlacement = await updatePlacement(editingJobId, formData, existingPlacement);

        setJobs((prev) =>
          prev.map((job) => (String(job.id) === String(editingJobId) ? updatedPlacement : job)),
        );
        setSelectedJobId(updatedPlacement.id);
        setFeedbackMessage("Placement updated successfully");
      } else {
        const createdPlacement = await createPlacement(formData);

        setJobs((prev) => [createdPlacement, ...prev]);
        setSelectedJobId(createdPlacement.id);
        setFeedbackMessage("Placement published successfully");
      }

      setActiveListTab("all");
      setLoadError("");
      resetFormState();
    } catch (error) {
      setLoadError(error.response?.data?.message || "Unable to save placement.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function renderJobDetailsContent() {
    if (!selectedJob) {
      return null;
    }

    if (activeDetailTab === "eligibility") {
      return (
        <section className="space-y-6 py-2">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <EligibilityMetricCard
              label="Min CGPA"
              value={selectedJob.additional?.minCgpa}
            />
            <EligibilityMetricCard
              label="Max Backlogs"
              value={selectedJob.additional?.maxBacklogs}
            />
            <EligibilityMetricCard
              label="Allowed Departments"
              value={selectedJob.additional?.allowedDepartments}
            />
            <EligibilityMetricCard
              label="Passing Year"
              value={selectedJob.additional?.passingYear}
            />
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
                        className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700"
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
      return (
        <HiringWorkflowMindmap
          workflow={selectedJob.workflow}
          isActive={isPlacementActive(selectedJob)}
          onEditWorkflow={handleEditWorkflow}
          onImportRound={handleImportRound}
          onTypePrn={handleTypePrn}
          onDownloadTemplate={handleDownloadWorkflowTemplate}
          typingStageId={typingStageId}
          manualPrnDraft={manualPrnDraft}
          manualPrnEntries={manualPrnEntries}
          onManualPrnDraftChange={setManualPrnDraft}
          onManualPrnDraftKeyDown={handleManualPrnDraftKeyDown}
          onAddManualPrn={addManualPrnToStage}
          onRemoveManualPrn={handleRemoveManualPrn}
          onSubmitManualPrns={handleSubmitManualPrns}
          isSubmittingManualPrns={isSubmitting}
        />
      );
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
            <ul className="space-y-3 text-sm leading-6 text-slate-700">
              {splitLines(selectedJob.description.responsibilities).map((item, index) => (
                <li key={`${item}-${index}`} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No content available.</p>
          )}
        </div>

        <div className="space-y-3 border-b border-slate-200/70 pb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            Required Skills & Attributes
          </p>
          {splitLines(selectedJob.description.skills).length > 0 ? (
            <ul className="space-y-3 text-sm leading-6 text-slate-700">
              {splitLines(selectedJob.description.skills).map((item, index) => (
                <li key={`${item}-${index}`} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No content available.</p>
          )}
        </div>

        <div className="space-y-3 border-b border-slate-200/70 pb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            What We Offer
          </p>
          <TextWithShowMore text={selectedJob.description.offer} />
        </div>

        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            Disclaimer
          </p>
          <TextWithShowMore text={selectedJob.description.disclaimer} />
        </div>

        <div className="space-y-3 border-t border-slate-200/70 pt-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            Required Skills
          </p>
          {selectedJob.additional.requiredSkills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedJob.additional.requiredSkills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No skills listed.</p>
          )}
        </div>

        <div className="space-y-3 border-t border-slate-200/70 pt-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            Additional Information
          </p>
          <TextWithShowMore text={selectedJob.additional.extraInfo} />
        </div>

        <div className="space-y-3 border-t border-slate-200/70 pt-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            Attached Documents
          </p>
          <AttachmentDetails attachment={selectedJob.attachment} />
        </div>
      </section>
    );
  }

  return (
    <TpoSidebar
      pageTitle="Placements"
      onLogout={onLogout}
    >
      <input
        ref={workflowImportInputRef}
        type="file"
        accept=".csv"
        onChange={handleWorkflowImportChange}
        className="hidden"
      />
      <section className="mt-4 rounded-[28px] border border-slate-200 bg-white px-5 py-6 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-600">
              Placement Publisher
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">
              Add a new campus opportunity
            </h2>
            <p className="mt-2 text-base text-slate-500">
              Capture structured hiring details once and keep the placement board
              updated in a clean, readable format.
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggleForm}
            className="inline-flex items-center gap-2 self-start rounded-2xl bg-[#02081f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#081231]"
          >
            {showAddForm ? <EyeOff className="h-4 w-4" /> : <PlusCircle className="h-4 w-4" />}
            {showAddForm ? "Hide Form" : "Add Placement"}
          </button>
        </div>

        {feedbackMessage ? (
          <p className="mt-4 text-sm font-medium text-emerald-600">{feedbackMessage}</p>
        ) : null}
        {loadError ? (
          <p className="mt-2 text-sm font-medium text-rose-600">{loadError}</p>
        ) : null}

        {showAddForm ? (
          <form
            ref={formRef}
            className="mt-6 border-t border-slate-200 pt-6"
            onSubmit={handlePlacementSubmit}
          >
            <div className="space-y-8">
              <section>
                <SectionHeader title="Basic Info" />
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  <label className="text-sm font-medium text-slate-700">
                    Company Name
                    <input
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      placeholder="Accenture"
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-cyan-500"
                    />
                  </label>

                  <label className="text-sm font-medium text-slate-700">
                    Job Title
                    <input
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Associate Software Engineer"
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-cyan-500"
                    />
                  </label>

                  <label className="text-sm font-medium text-slate-700">
                    Location
                    <input
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="Bengaluru"
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-cyan-500"
                    />
                  </label>

                  <label className="text-sm font-medium text-slate-700">
                    Job Type
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-cyan-500"
                    >
                      <option>Full-time</option>
                      <option>Internship</option>
                    </select>
                  </label>

                  <label className="text-sm font-medium text-slate-700">
                    Deadline
                    <div className="relative mt-2">
                      <input
                        name="deadline"
                        type="date"
                        value={formData.deadline}
                        onChange={handleInputChange}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-cyan-500"
                      />
                      <Calendar className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                    </div>
                  </label>
                </div>
              </section>

              <section>
                <SectionHeader title="Opening Overview" />
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <label className="text-sm font-medium text-slate-700">
                    Category
                    <input
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      placeholder="Engineering Hiring"
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-cyan-500"
                    />
                  </label>

                  <label className="text-sm font-medium text-slate-700">
                    Level
                    <select
                      name="level"
                      value={formData.level}
                      onChange={handleInputChange}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-cyan-500"
                    >
                      <option value="">Select level</option>
                      <option>Internship</option>
                      <option>Entry Level</option>
                      <option>Graduate</option>
                      <option>Experienced</option>
                    </select>
                  </label>

                  <label className="text-sm font-medium text-slate-700">
                    Job Functions
                    <input
                      name="functions"
                      value={formData.functions}
                      onChange={handleInputChange}
                      placeholder="Development, Testing, Support"
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-cyan-500"
                    />
                  </label>

                  <label className="text-sm font-medium text-slate-700">
                    CTC
                    <input
                      name="ctc"
                      type="number"
                      step="0.01"
                      value={formData.ctc}
                      onChange={handleInputChange}
                      placeholder="6.5"
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-cyan-500"
                    />
                  </label>
                </div>

                <label className="mt-4 block text-sm font-medium text-slate-700">
                  Other Info
                  <textarea
                    name="otherInfo"
                    value={formData.otherInfo}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Include relocation, process notes, or any important opening overview details."
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-cyan-500"
                  />
                </label>
              </section>

              <section>
                <SectionHeader title="Job Description" />
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <label className="text-sm font-medium text-slate-700">
                    Role Overview
                    <textarea
                      name="roleOverview"
                      value={formData.roleOverview}
                      onChange={handleInputChange}
                      rows={5}
                      placeholder="Summarize the role and team context."
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-cyan-500"
                    />
                  </label>

                  <label className="text-sm font-medium text-slate-700">
                    Key Responsibilities
                    <textarea
                      name="responsibilities"
                      value={formData.responsibilities}
                      onChange={handleInputChange}
                      rows={5}
                      placeholder="Add one responsibility per line for automatic bullets."
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-cyan-500"
                    />
                  </label>

                  <label className="text-sm font-medium text-slate-700">
                    What We Offer
                    <textarea
                      name="offer"
                      value={formData.offer}
                      onChange={handleInputChange}
                      rows={5}
                      placeholder="Highlight learning, compensation, or growth benefits."
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-cyan-500"
                    />
                  </label>
                </div>

                <label className="mt-4 block text-sm font-medium text-slate-700">
                  Disclaimer
                  <textarea
                    name="disclaimer"
                    value={formData.disclaimer}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Add policy, eligibility, or process disclaimer."
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-cyan-500"
                  />
                </label>
              </section>

              <section>
                <SectionHeader title="Eligibility Criteria" />
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <label className="text-sm font-medium text-slate-700">
                    Minimum CGPA
                    <input
                      name="minCgpa"
                      type="number"
                      step="0.01"
                      value={formData.minCgpa}
                      onChange={handleInputChange}
                      placeholder="6.5"
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-cyan-500"
                    />
                  </label>

                  <label className="text-sm font-medium text-slate-700">
                    Maximum Backlogs
                    <input
                      name="maxBacklogs"
                      type="number"
                      value={formData.maxBacklogs}
                      onChange={handleInputChange}
                      placeholder="0"
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-cyan-500"
                    />
                  </label>

                  <label className="text-sm font-medium text-slate-700">
                    Allowed Departments
                    <div className="mt-2 grid gap-3 md:grid-cols-[minmax(220px,0.9fr)_minmax(0,1.1fr)]">
                      <select
                        value={departmentPickerValue}
                        onChange={(event) => handleAddAllowedDepartment(event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-cyan-500"
                      >
                        <option value="">Select a department</option>
                        {placementDepartmentOptions.map((department) => (
                          <option
                            key={department}
                            value={department}
                            disabled={parsePlacementDepartments(formData.allowedDepartments).includes(department)}
                          >
                            {department}
                          </option>
                        ))}
                      </select>

                      <input
                        value={parsePlacementDepartments(formData.allowedDepartments).join(", ")}
                        readOnly
                        placeholder="Selected departments will appear here"
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                      />
                    </div>
                    {parsePlacementDepartments(formData.allowedDepartments).length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {parsePlacementDepartments(formData.allowedDepartments).map((department) => (
                          <span
                            key={department}
                            className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700"
                          >
                            {department}
                            <button
                              type="button"
                              onClick={() => handleRemoveAllowedDepartment(department)}
                              className="text-cyan-700 transition hover:text-cyan-900"
                            >
                              x
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </label>

                  <label className="text-sm font-medium text-slate-700">
                    Passing Year
                    <input
                      name="passingYear"
                      type="number"
                      value={formData.passingYear}
                      onChange={handleInputChange}
                      placeholder="2026"
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-cyan-500"
                    />
                  </label>
                </div>
              </section>

              <section>
                <SectionHeader title="Additional Details" />
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <label className="text-sm font-medium text-slate-700">
                    Required Skills
                    <input
                      name="requiredSkills"
                      value={formData.requiredSkills}
                      onChange={handleInputChange}
                      placeholder="Java, SQL, Communication"
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-cyan-500"
                    />
                  </label>
                </div>

                <div className="mt-6 text-sm font-medium text-slate-700">
                  Attach Documents
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    multiple
                    onChange={handleDeviceUpload}
                    className="hidden"
                  />

                  <div className="mt-2 rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          Upload placement documents
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Attach multiple PDF, DOC, or DOCX files for this opportunity.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
                      >
                        <Upload className="h-4 w-4" />
                        Upload Files
                      </button>
                    </div>

                    {normalizePlacementAttachment(formData.attachment).length > 0 ? (
                      <div className="mt-4 space-y-3">
                        {normalizePlacementAttachment(formData.attachment).map((item, index) => (
                          <div
                            key={`${item.name}-${index}`}
                            className="rounded-2xl border border-slate-200 bg-white p-4"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-900">
                                  {item.url ? (
                                    <a
                                      href={item.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-cyan-700 hover:text-cyan-800"
                                    >
                                      {item.name || `Attachment ${index + 1}`}
                                    </a>
                                  ) : (
                                    item.name || `Attachment ${index + 1}`
                                  )}
                                </p>
                                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                                  {item.type || "Document"}
                                </p>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => openAttachmentInWindow(item.url)}
                                  disabled={!item.url}
                                  className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-50 disabled:cursor-not-allowed disabled:text-slate-400"
                                >
                                  View
                                </button>

                                <button
                                  type="button"
                                  onClick={() => clearAttachment(index)}
                                  className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>

                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white/70 px-4 py-6 text-center text-sm text-slate-500">
                        Upload placement documents for students.
                      </div>
                    )}

                    {attachmentError ? (
                      <p className="mt-3 text-sm font-medium text-rose-600">{attachmentError}</p>
                    ) : null}
                  </div>
                </div>

                <label className="mt-4 block text-sm font-medium text-slate-700">
                  Additional Information
                  <textarea
                    name="extraInfo"
                    value={formData.extraInfo}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Add eligibility, process notes, or anything students should know."
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-cyan-500"
                  />
                </label>
              </section>

              <section ref={workflowSectionRef}>
                <SectionHeader title="Hiring Workflow" />
                <div className="mt-4 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Add hiring rounds</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Enter each round name and its scheduled date in order.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={addWorkflowStage}
                      className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
                    >
                      <PlusCircle className="h-4 w-4" />
                      Add Round
                    </button>
                  </div>

                  <div className="space-y-3">
                    {(formData.workflow ?? []).map((item, index) => (
                      <div
                        key={`workflow-stage-${index}`}
                        className="rounded-3xl border border-slate-200 bg-white p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="grid min-w-0 flex-1 gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
                            <label className="text-sm font-medium text-slate-700">
                              Round Name
                              <input
                                value={item.roundName}
                                onChange={(event) => handleWorkflowChange(index, "roundName", event.target.value)}
                                placeholder="Technical Interview"
                                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-cyan-500"
                              />
                            </label>

                            <label className="text-sm font-medium text-slate-700">
                              Round Date
                              <div className="relative mt-2">
                                <input
                                  type="date"
                                  value={item.roundDate}
                                  onChange={(event) => handleWorkflowChange(index, "roundDate", event.target.value)}
                                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-cyan-500"
                                />
                                <Calendar className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                              </div>
                            </label>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeWorkflowStage(index)}
                            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
              <p className="text-sm text-slate-500">
                {editingJobId
                  ? "Update the selected placement and the revised sections will appear immediately."
                  : "New postings are added to the top of the list and selected automatically."}
              </p>

              <div className="flex items-center gap-2">
                {editingJobId ? (
                  <button
                    type="button"
                    onClick={resetFormState}
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                ) : null}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700"
                >
                  <SendHorizonal className="h-4 w-4" />
                  {isSubmitting
                    ? "Saving..."
                    : editingJobId
                      ? "Update Placement"
                      : "Publish Opportunity"}
                </button>
              </div>
            </div>
          </form>
        ) : null}
      </section>

      <section className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-5 lg:h-[78vh] lg:flex-row">
          <div className="min-w-0 lg:w-[30%] lg:border-r lg:border-slate-200/80 lg:pr-4">
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
                          ? "border-cyan-600 text-cyan-700"
                          : "border-transparent text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {tab.label} ({count})
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 min-h-0 flex-1 overflow-y-auto scroll-smooth pr-1">
                {isLoading ? (
                  <p className="py-8 text-sm text-slate-500">Loading placements...</p>
                ) : null}
                {!isLoading && filteredJobs.length === 0 ? (
                  <p className="py-8 text-sm text-slate-500">No jobs available.</p>
                ) : (
                  filteredJobs.map((job) => {
                    const active = selectedJob?.id === job.id;
                    const status = isPlacementActive(job) ? "Active" : "Closed";

                    return (
                      <button
                        key={job.id}
                        type="button"
                        onClick={() => setSelectedJobId(job.id)}
                        className={`mb-1.5 w-full rounded-lg px-3 py-2 text-left transition ${
                          active
                            ? "bg-cyan-50 text-slate-900"
                            : "text-slate-700 hover:bg-slate-100/80"
                        }`}
                      >
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {job.company} | {job.title}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-slate-600">
                          {job.location}
                        </p>
                        <p
                          className={`mt-1 text-xs font-medium ${
                            status === "Active" ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          {status}
                        </p>
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
                  <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200/80 pb-4">
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

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/tpo-dashboard/placements/${selectedJob.id}/applicants`)}
                        className="ml-2 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-sm font-medium text-cyan-700 transition hover:bg-cyan-100"
                      >
                        View Applicants
                      </button>
                      <button
                        type="button"
                        onClick={handleEditPlacement}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={handleDeletePlacement}
                        className="rounded-lg border border-rose-200 px-3 py-1.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                      >
                        Delete
                      </button>
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
                                ? "border-b-2 border-cyan-600 text-cyan-700"
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
    </TpoSidebar>
  );
}
