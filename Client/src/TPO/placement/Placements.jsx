import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, EyeOff, FileText, PlusCircle, SendHorizonal, Upload } from "lucide-react";
import { TpoLayout } from "../common";
import { Tabs } from "../common/ui";
import {
  buildPlacementPayload,
  emptyPlacementForm,
  formatPlacementDeadline,
  getPlacementFormFromJob,
  isPlacementActive,
  isPlacementFormValid,
  loadPlacementJobs,
  normalizePlacementAttachment,
  savePlacementJobs,
  splitLines,
} from "../../shared/placementJobs";

const listTabs = [
  { key: "all", label: "All Jobs" },
  { key: "ongoing", label: "Ongoing Jobs" },
];

const detailTabs = [
  { key: "job-description", label: "Job Description" },
  { key: "eligibility", label: "Eligibility Criteria" },
  { key: "workflow", label: "Hiring Workflow" },
];

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

export default function Placements({ onLogout }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const formRef = useRef(null);
  const [jobs, setJobs] = useState(() => loadPlacementJobs());
  const [selectedJobId, setSelectedJobId] = useState(() => loadPlacementJobs()[0]?.id ?? null);
  const [activeListTab, setActiveListTab] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingJobId, setEditingJobId] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [attachmentError, setAttachmentError] = useState("");
  const [activeDetailTab, setActiveDetailTab] = useState("job-description");
  const [formData, setFormData] = useState(emptyPlacementForm);

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

  useEffect(() => {
    savePlacementJobs(jobs);
  }, [jobs]);

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

  function handleInputChange(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function updateAttachmentNotice(index, value) {
    setFormData((prev) => ({
      ...prev,
      attachment: normalizePlacementAttachment(prev.attachment).map((item, itemIndex) =>
        itemIndex === index ? { ...item, notice: value } : item,
      ),
    }));
  }

  function handleDeviceUpload(event) {
    const files = Array.from(event.target.files ?? []);

    if (files.length === 0) {
      return;
    }

    const allowedExtensions = ["pdf", "doc", "docx"];
    const currentAttachments = normalizePlacementAttachment(formData.attachment);

    if (currentAttachments.length + files.length > 3) {
      setAttachmentError("You can attach up to 3 files only.");
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

    Promise.all(
      files.map(
        (file) =>
          new Promise((resolve, reject) => {
            const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
            const reader = new FileReader();

            reader.onload = () => {
              resolve({
                name: file.name,
                type: file.type || extension.toUpperCase(),
                url: typeof reader.result === "string" ? reader.result : "",
                notice: "",
              });
            };

            reader.onerror = () => {
              reject(new Error("Unable to read the selected file."));
            };

            reader.readAsDataURL(file);
          }),
      ),
    )
      .then((nextAttachments) => {
        setFormData((prev) => ({
          ...prev,
          attachment: [...normalizePlacementAttachment(prev.attachment), ...nextAttachments],
        }));
        setAttachmentError("");
      })
      .catch(() => {
        setAttachmentError("Unable to read the selected file.");
      });

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
    setEditingJobId(null);
    setShowAddForm(true);
  }

  function handleEditPlacement() {
    if (!selectedJob) {
      return;
    }

    setFormData(getPlacementFormFromJob(selectedJob));
    setEditingJobId(selectedJob.id);
    setShowAddForm(true);
  }

  function handleDeletePlacement() {
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
    const deletedIndex = jobs.findIndex((job) => job.id === deletedJobId);
    const updatedJobs = jobs.filter((job) => job.id !== deletedJobId);
    const nextJob =
      updatedJobs[deletedIndex] ??
      updatedJobs[Math.max(deletedIndex - 1, 0)] ??
      null;

    setJobs(updatedJobs);
    setSelectedJobId(nextJob?.id ?? null);
    setFeedbackMessage("Placement deleted");

    if (editingJobId === deletedJobId) {
      resetFormState();
    }
  }

  function handlePlacementSubmit(event) {
    event.preventDefault();

    if (!isPlacementFormValid(formData)) {
      return;
    }

    const jobPayload = buildPlacementPayload(formData);

    if (editingJobId) {
      setJobs((prev) =>
        prev.map((job) =>
          job.id === editingJobId ? { ...job, ...jobPayload, id: editingJobId } : job,
        ),
      );
      setSelectedJobId(editingJobId);
      setFeedbackMessage("Placement updated successfully");
    } else {
      const newJob = {
        id: `job-${Date.now()}`,
        ...jobPayload,
      };

      setJobs((prev) => [newJob, ...prev]);
      setSelectedJobId(newJob.id);
      setFeedbackMessage("Placement published successfully");
    }

    setActiveListTab("all");
    resetFormState();
  }

  function handleSidebarNavigate(pageLabel) {
    if (pageLabel === "Dashboard") {
      navigate("/tpo/dashboard");
      return;
    }

    if (pageLabel === "Placements") {
      navigate("/tpo/placements");
    }
  }

  function renderJobDetailsContent() {
    if (!selectedJob) {
      return null;
    }

    if (activeDetailTab === "eligibility") {
      return (
        <section className="py-8">
          <p className="text-sm leading-6 text-slate-500">Eligibility criteria will be added soon.</p>
        </section>
      );
    }

    if (activeDetailTab === "workflow") {
      return (
        <section className="py-8">
          <p className="text-sm leading-6 text-slate-500">Hiring workflow will be added soon.</p>
        </section>
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
    <TpoLayout
      pageTitle="Placements"
      activePage="Placements"
      onNavigate={handleSidebarNavigate}
      onLogout={onLogout}
    >
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
                    Required Skills & Attributes
                    <textarea
                      name="skills"
                      value={formData.skills}
                      onChange={handleInputChange}
                      rows={5}
                      placeholder="Describe the core skills and mindset expected."
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
                          Add notices alongside each uploaded file.
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

                              <button
                                type="button"
                                onClick={() => clearAttachment(index)}
                                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                              >
                                Remove
                              </button>
                            </div>

                            <textarea
                              value={item.notice}
                              onChange={(event) => updateAttachmentNotice(index, event.target.value)}
                              rows={3}
                              placeholder={`Add notice for attachment ${index + 1}.`}
                              className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-cyan-500"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white/70 px-4 py-6 text-center text-sm text-slate-500">
                        Upload documents to attach notices, brochures, or placement instructions.
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
                  className="inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700"
                >
                  <SendHorizonal className="h-4 w-4" />
                  {editingJobId ? "Update Placement" : "Publish Opportunity"}
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
                {filteredJobs.length === 0 ? (
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
                    <Tabs
                      tabs={detailTabs}
                      activeTab={activeDetailTab}
                      onChange={setActiveDetailTab}
                    />

                    <div className="mt-6">{renderJobDetailsContent()}</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </TpoLayout>
  );
}
