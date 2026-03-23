export const PLACEMENTS_STORAGE_KEY = "training-placement-jobs";

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
      extraInfo:
        "BE/BTech students from CS and IT-related branches with no active backlogs are preferred.",
    },
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
      extraInfo:
        "BE/BTech and MCA students with consistent academics and no significant education gap are eligible.",
    },
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
      extraInfo:
        "Students should not have active backlogs at the time of joining and must meet final eligibility checks.",
    },
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
  extraInfo: "",
  attachment: null,
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
      }))
      .filter((item) => item.name || item.type || item.url || item.notice);
  }

  return [
    {
      name: attachment.name ?? "",
      type: attachment.type ?? "",
      url: attachment.url ?? "",
      notice: attachment.notice ?? "",
    },
  ].filter((item) => item.name || item.type || item.url || item.notice);
}

export function loadPlacementJobs() {
  if (typeof window === "undefined") {
    return initialPlacementJobs;
  }

  const storedJobs = window.localStorage.getItem(PLACEMENTS_STORAGE_KEY);

  if (!storedJobs) {
    return initialPlacementJobs;
  }

  try {
    const parsedJobs = JSON.parse(storedJobs);
    return Array.isArray(parsedJobs) && parsedJobs.length > 0
      ? parsedJobs
      : initialPlacementJobs;
  } catch {
    return initialPlacementJobs;
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
    extraInfo: job.additional?.extraInfo ?? "",
    attachment: normalizePlacementAttachment(job.attachment),
  };
}

export function buildPlacementPayload(formData) {
  const attachment = normalizePlacementAttachment(formData.attachment);

  return {
    company: formData.company.trim(),
    title: formData.title.trim(),
    location: formData.location.trim(),
    type: formData.type,
    deadline: formData.deadline,
    attachment: attachment.length > 0 ? attachment : null,
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
