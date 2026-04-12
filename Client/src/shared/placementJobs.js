export const PLACEMENTS_STORAGE_KEY = "training-placement-jobs";

export const placementDepartmentOptions = [
  "Computer Engineering",
  "Computer Engineering and Information Technology",
  "Artificial Intelligence and Machine Learning",
  "Mechatronics Engineering",
  "Robotics Engineering",
  "Mechanical Engineering",
  "Electrical Engineering",
  "Civil Engineering",
];

function addDays(dateString, days) {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatWorkflowDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function toWorkflowInputDate(dateString) {
  if (!dateString) {
    return "";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function createEmptyWorkflowStage() {
  return {
    roundName: "",
    roundDate: "",
  };
}

export function parsePlacementDepartments(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item ?? "").trim()).filter(Boolean);
  }

  if (typeof value !== "string") {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function inferWorkflowStatuses(workflowEntries) {
  const today = normalizePlacementDate(new Date().toISOString());
  const datedEntries = workflowEntries
    .map((entry, index) => ({
      index,
      date: entry.roundDate ? normalizePlacementDate(entry.roundDate) : null,
    }))
    .filter((entry) => entry.date);

  const firstUpcomingIndex = datedEntries.find((entry) => entry.date >= today)?.index ?? -1;

  return workflowEntries.map((entry, index) => {
    if (!entry.roundDate) {
      return index === 0 ? "current" : "upcoming";
    }

    if (firstUpcomingIndex === -1) {
      return "completed";
    }

    if (index < firstUpcomingIndex) {
      return "completed";
    }

    if (index === firstUpcomingIndex) {
      return "current";
    }

    return "upcoming";
  });
}

export function normalizePlacementWorkflow(workflow) {
  if (!Array.isArray(workflow)) {
    return [];
  }

  const sanitizedWorkflow = workflow
    .map((item) => ({
      id: item?.id ?? item?.stageId ?? item?.stage_id ?? null,
      roundName: String(item?.roundName ?? item?.stage ?? item?.stage_name ?? "").trim(),
      roundDate: toWorkflowInputDate(item?.roundDate ?? item?.rawDate ?? item?.date ?? item?.stage_date),
      selectedCount:
        item?.selectedCount === null || item?.selectedCount === undefined || item?.selectedCount === ""
          ? null
          : Number(item.selectedCount),
      status: String(item?.status ?? item?.stageStatus ?? item?.stage_status ?? "").trim().toLowerCase(),
      studentStatus: String(item?.studentStatus ?? item?.student_status ?? "").trim().toLowerCase(),
      studentUpdatedAt: item?.studentUpdatedAt ?? item?.student_updated_at ?? null,
    }))
    .filter((item) => item.roundName || item.roundDate);

  if (!sanitizedWorkflow.length) {
    return [];
  }

  const inferredStatuses = inferWorkflowStatuses(sanitizedWorkflow);

  return sanitizedWorkflow.map((item, index) => ({
    id: item.id,
    roundName: item.roundName,
    roundDate: item.roundDate,
    stage: item.roundName,
    date: item.roundDate ? formatWorkflowDate(item.roundDate) : "Date not scheduled",
    rawDate: item.roundDate,
    selectedCount: item.selectedCount,
    status: item.status || inferredStatuses[index],
    studentStatus: item.studentStatus || "pending",
    studentUpdatedAt: item.studentUpdatedAt,
  }));
}

function buildDefaultWorkflow(job) {
  const isClosed = !isPlacementActive(job);
  const selectedBase = isClosed ? 420 : 520;

  if (isClosed) {
    return [
      {
        stage: "Applications Received",
        date: formatWorkflowDate(addDays(job.deadline, -14)),
        selectedCount: selectedBase,
        status: "completed",
      },
      {
        stage: "Eligibility Screening",
        date: formatWorkflowDate(addDays(job.deadline, -11)),
        selectedCount: Math.round(selectedBase * 0.68),
        status: "completed",
      },
      {
        stage: "Assessment Round",
        date: formatWorkflowDate(addDays(job.deadline, -8)),
        selectedCount: Math.round(selectedBase * 0.36),
        status: "completed",
      },
      {
        stage: "Technical Interview",
        date: formatWorkflowDate(addDays(job.deadline, -5)),
        selectedCount: Math.round(selectedBase * 0.18),
        status: "completed",
      },
      {
        stage: "Final HR Round",
        date: formatWorkflowDate(addDays(job.deadline, -2)),
        selectedCount: Math.round(selectedBase * 0.09),
        status: "completed",
      },
      {
        stage: "Students Selected",
        date: formatWorkflowDate(job.deadline),
        selectedCount: Math.round(selectedBase * 0.05),
        status: "completed",
      },
    ];
  }

  return [
    {
      stage: "Applications Opened",
      date: formatWorkflowDate(addDays(job.deadline, -16)),
      selectedCount: selectedBase,
      status: "completed",
    },
    {
      stage: "Eligibility Screening",
      date: formatWorkflowDate(addDays(job.deadline, -10)),
      selectedCount: Math.round(selectedBase * 0.7),
      status: "completed",
    },
    {
      stage: "Online Assessment",
      date: formatWorkflowDate(addDays(job.deadline, -5)),
      selectedCount: Math.round(selectedBase * 0.42),
      status: "current",
    },
    {
      stage: "Technical Interview",
      date: formatWorkflowDate(addDays(job.deadline, -2)),
      selectedCount: 0,
      status: "upcoming",
    },
    {
      stage: "Final Selection",
      date: formatWorkflowDate(job.deadline),
      selectedCount: 0,
      status: "upcoming",
    },
  ];
}

function normalizeWorkflow(job) {
  if (Array.isArray(job?.workflow)) {
    return job.workflow.length > 0 ? normalizePlacementWorkflow(job.workflow) : [];
  }

  return buildDefaultWorkflow(job);
}

export const initialPlacementJobs = [
  {
    id: "job-1",
    company: "Infosys",
    title: "Associate Software Engineer",
    location: "Pune",
    type: "Full-time",
    deadline: "2026-04-10",
    attachment: [
      {
        name: "Campus Hiring Brochure",
        type: "application/pdf",
        url: "",
        notice: "Brochure available with TPO office",
      },
    ],
    overview: {
      category: "Engineering Hiring",
      level: "Entry Level",
      functions: "Application Development, QA Support, Deployment Coordination",
      ctc: "6.5",
      otherInfo:
        "Candidates should be available for relocation across delivery centers after onboarding.",
    },
    description: {
      roleOverview:
        "Infosys is hiring entry-level software engineers for campus placements. The role includes application development, testing, and deployment support across enterprise projects.",
      responsibilities:
        "Build and maintain assigned modules.\nSupport testing and release coordination.\nWork with project mentors on delivery milestones.\nDocument implementation updates and fixes.",
      skills:
        "Comfort with problem-solving, programming fundamentals, and collaborative delivery practices is expected.",
      offer:
        "Structured onboarding, project-based learning, mentoring support, and exposure to enterprise delivery workflows.",
      disclaimer:
        "Final selection and onboarding timelines are subject to company policy and internal verification.",
    },
    additional: {
      requiredSkills: ["Java", "Python", "SQL", "Problem Solving"],
      minCgpa: "6.5",
      maxBacklogs: "0",
      allowedDepartments: "CSE, IT",
      passingYear: "2026",
      extraInfo:
        "BE/BTech students from CS and IT-related branches with no active backlogs are preferred.",
    },
    workflow: buildDefaultWorkflow({
      deadline: "2026-04-10",
      id: "job-1",
    }),
  },
  {
    id: "job-2",
    company: "TCS",
    title: "System Engineer",
    location: "Mumbai",
    type: "Full-time",
    deadline: "2026-03-28",
    attachment: null,
    overview: {
      category: "Graduate Hiring",
      level: "Entry Level",
      functions: "System Support, Delivery Operations, Engineering Services",
      ctc: "7.0",
      otherInfo:
        "The hiring team may schedule online assessments in multiple slots depending on registration volume.",
    },
    description: {
      roleOverview:
        "TCS is opening system engineer roles for graduating students. Selected candidates will work on digital transformation projects with cross-functional teams.",
      responsibilities:
        "Assist with delivery workflows.\nParticipate in technical problem analysis.\nSupport project reporting and operational readiness.",
      skills:
        "Strong communication, analytical thinking, and readiness to work in collaborative teams are important for this role.",
      offer:
        "Learning pathways, structured project allocation, and exposure to large-scale enterprise programs.",
      disclaimer:
        "Offer rollout is contingent on assessment scores, interview performance, and document verification.",
    },
    additional: {
      requiredSkills: ["Communication", "Analytical Thinking", "Engineering Basics"],
      minCgpa: "6.0",
      maxBacklogs: "1",
      allowedDepartments: "CSE, IT, ECE, EE, MCA",
      passingYear: "2026",
      extraInfo:
        "BE/BTech and MCA students with consistent academics and no significant education gap are eligible.",
    },
    workflow: [
      {
        stage: "Applications Received",
        date: "12 Mar 2026",
        selectedCount: 620,
        status: "completed",
      },
      {
        stage: "Eligibility Screening",
        date: "15 Mar 2026",
        selectedCount: 438,
        status: "completed",
      },
      {
        stage: "NQT Assessment",
        date: "19 Mar 2026",
        selectedCount: 214,
        status: "completed",
      },
      {
        stage: "Technical Interview",
        date: "23 Mar 2026",
        selectedCount: 96,
        status: "completed",
      },
      {
        stage: "Managerial Round",
        date: "26 Mar 2026",
        selectedCount: 42,
        status: "completed",
      },
      {
        stage: "Offer Released",
        date: "28 Mar 2026",
        selectedCount: 28,
        status: "completed",
      },
    ],
  },
  {
    id: "job-3",
    company: "Capgemini",
    title: "Analyst",
    location: "Bengaluru",
    type: "Full-time",
    deadline: "2026-03-10",
    attachment: null,
    overview: {
      category: "Analyst Hiring",
      level: "Graduate",
      functions: "Client Delivery, Documentation, Support Coordination",
      ctc: "5.5",
      otherInfo:
        "Shortlisted students should be ready for quick interview turnarounds after the assessment stage.",
    },
    description: {
      roleOverview:
        "Capgemini analyst role focused on client delivery support, business analysis documentation, and coordination for enterprise accounts.",
      responsibilities:
        "Prepare support documentation.\nCoordinate with project stakeholders.\nTrack delivery updates and escalations.",
      skills:
        "Good written communication, documentation habits, and structured problem-solving are important.",
      offer:
        "Exposure to consulting-style delivery environments with mentoring support from account teams.",
      disclaimer:
        "The company reserves the right to update process steps or role allocations based on business needs.",
    },
    additional: {
      requiredSkills: ["Documentation", "Communication", "Client Coordination"],
      minCgpa: "6.0",
      maxBacklogs: "0",
      allowedDepartments: "CSE, IT, AIDS",
      passingYear: "2026",
      extraInfo:
        "Students should not have active backlogs at the time of joining and must meet final eligibility checks.",
    },
    workflow: [
      {
        stage: "Applications Received",
        date: "22 Feb 2026",
        selectedCount: 410,
        status: "completed",
      },
      {
        stage: "Profile Shortlisting",
        date: "25 Feb 2026",
        selectedCount: 268,
        status: "completed",
      },
      {
        stage: "Assessment Round",
        date: "01 Mar 2026",
        selectedCount: 140,
        status: "completed",
      },
      {
        stage: "Technical Discussion",
        date: "05 Mar 2026",
        selectedCount: 64,
        status: "completed",
      },
      {
        stage: "Final HR Round",
        date: "08 Mar 2026",
        selectedCount: 31,
        status: "completed",
      },
      {
        stage: "Students Selected",
        date: "10 Mar 2026",
        selectedCount: 18,
        status: "completed",
      },
    ],
  },
];

export const emptyPlacementForm = {
  company: "",
  title: "",
  location: "",
  type: "Full-time",
  deadline: "",
  category: "",
  level: "",
  functions: "",
  ctc: "",
  otherInfo: "",
  roleOverview: "",
  responsibilities: "",
  skills: "",
  offer: "",
  disclaimer: "",
  requiredSkills: "",
  minCgpa: "",
  maxBacklogs: "",
  allowedDepartments: [],
  passingYear: "",
  extraInfo: "",
  attachment: null,
  workflow: [createEmptyWorkflowStage()],
};

export function normalizePlacementAttachment(attachment) {
  if (!attachment) {
    return [];
  }

  if (typeof attachment === "string") {
    const value = attachment.trim();

    return value
      ? [
          {
            name: "",
            type: "",
            url: "",
            notice: value,
          },
        ]
      : [];
  }

  if (Array.isArray(attachment)) {
    return attachment
      .map((item) => ({
        name: item?.name ?? "",
        type: item?.type ?? "",
        url: item?.url ?? "",
        notice: item?.notice ?? "",
        file: item?.file ?? null,
      }))
      .filter((item) => item.name || item.type || item.url || item.notice || item.file);
  }

  return [
    {
      name: attachment.name ?? "",
      type: attachment.type ?? "",
      url: attachment.url ?? "",
      notice: attachment.notice ?? "",
      file: attachment.file ?? null,
    },
  ].filter((item) => item.name || item.type || item.url || item.notice || item.file);
}

export function hydratePlacementJob(job) {
  if (!job) {
    return job;
  }

  return {
    ...job,
    workflow: normalizeWorkflow(job),
    attachment: normalizePlacementAttachment(job.attachment),
  };
}

export function loadPlacementJobs() {
  if (typeof window === "undefined") {
    return initialPlacementJobs.map(hydratePlacementJob);
  }

  const storedJobs = window.localStorage.getItem(PLACEMENTS_STORAGE_KEY);

  if (!storedJobs) {
    return initialPlacementJobs.map(hydratePlacementJob);
  }

  try {
    const parsedJobs = JSON.parse(storedJobs);
    const jobs = Array.isArray(parsedJobs) && parsedJobs.length > 0
      ? parsedJobs
      : initialPlacementJobs;

    return jobs.map(hydratePlacementJob);
  } catch {
    return initialPlacementJobs.map(hydratePlacementJob);
  }
}

export function savePlacementJobs(jobs) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(PLACEMENTS_STORAGE_KEY, JSON.stringify(jobs));
  window.dispatchEvent(new Event(PLACEMENTS_STORAGE_KEY));
}

export function getPlacementFormFromJob(job) {
  if (!job) {
    return emptyPlacementForm;
  }

  const workflow = normalizePlacementWorkflow(job.workflow).map((item) => ({
    roundName: item.roundName,
    roundDate: item.roundDate,
  }));

  return {
    company: job.company ?? "",
    title: job.title ?? "",
    location: job.location ?? "",
    type: job.type ?? "Full-time",
    deadline: job.deadline ?? "",
    category: job.overview?.category ?? "",
    level: job.overview?.level ?? "",
    functions: job.overview?.functions ?? "",
    ctc: job.overview?.ctc ?? "",
    otherInfo: job.overview?.otherInfo ?? "",
    roleOverview: job.description?.roleOverview ?? "",
    responsibilities: job.description?.responsibilities ?? "",
    skills: job.description?.skills ?? "",
    offer: job.description?.offer ?? "",
    disclaimer: job.description?.disclaimer ?? "",
    requiredSkills: (job.additional?.requiredSkills ?? []).join(", "),
    minCgpa: job.additional?.minCgpa ?? "",
    maxBacklogs: job.additional?.maxBacklogs ?? "",
    allowedDepartments: parsePlacementDepartments(job.additional?.allowedDepartments),
    passingYear: job.additional?.passingYear ?? "",
    extraInfo: job.additional?.extraInfo ?? "",
    attachment: normalizePlacementAttachment(job.attachment),
    workflow: workflow.length > 0 ? workflow : [createEmptyWorkflowStage()],
  };
}

export function buildPlacementPayload(formData) {
  const attachment = normalizePlacementAttachment(formData.attachment);
  const workflow = normalizePlacementWorkflow(formData.workflow).map((item, index) => ({
    stage: item.roundName,
    date: item.roundDate,
    status: item.status,
    order: index + 1,
  }));

  return {
    company: formData.company.trim(),
    title: formData.title.trim(),
    location: formData.location.trim(),
    type: formData.type,
    deadline: formData.deadline,
    attachment: attachment.length > 0 ? attachment : null,
    workflow,
    overview: {
      category: formData.category.trim(),
      level: formData.level.trim(),
      functions: formData.functions.trim(),
      ctc: formData.ctc.trim(),
      otherInfo: formData.otherInfo.trim(),
    },
    description: {
      roleOverview: formData.roleOverview.trim(),
      responsibilities: formData.responsibilities.trim(),
      skills: formData.skills.trim(),
      offer: formData.offer.trim(),
      disclaimer: formData.disclaimer.trim(),
    },
    additional: {
      requiredSkills: formData.requiredSkills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),
      minCgpa: formData.minCgpa.trim(),
      maxBacklogs: formData.maxBacklogs.trim(),
      allowedDepartments: parsePlacementDepartments(formData.allowedDepartments).join(", "),
      passingYear: formData.passingYear.trim(),
      extraInfo: formData.extraInfo.trim(),
    },
  };
}

export function isPlacementFormValid(formData) {
  return Boolean(
    formData.company.trim() &&
      formData.title.trim() &&
      formData.location.trim() &&
      formData.deadline &&
      formData.roleOverview.trim(),
  );
}

export function normalizePlacementDate(dateString) {
  const date = new Date(dateString);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function isPlacementActive(job) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today < normalizePlacementDate(job.deadline);
}

export function formatPlacementDeadline(dateString) {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function splitLines(text) {
  return String(text ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}
