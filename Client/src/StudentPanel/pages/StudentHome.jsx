import { useEffect, useMemo, useState } from "react";
import { fetchNotices } from "../../TPO/services/noticeApi";

const typeToneMap = {
  announcement: "Announcement",
  placement: "Placement",
  internship: "Internship",
};

const badgeStyleMap = {
  announcement: "from-sky-300 via-cyan-300 to-teal-300",
  placement: "from-emerald-300 via-teal-300 to-cyan-300",
  internship: "from-orange-300 via-amber-300 to-yellow-300",
};

function formatRelativeTime(value) {
  if (!value) {
    return "Recently";
  }

  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) {
    return "Just now";
  }

  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);

  if (diffDays === 1) {
    return "1 day ago";
  }

  return `${diffDays} days ago`;
}

function formatDeadline(value) {
  if (!value) {
    return "No deadline specified";
  }

  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildEligibilityText(item) {
  if (item.type === "announcement") {
    return "General notice for the selected student groups.";
  }

  const parts = [];

  if (item.departments?.length) {
    parts.push(item.departments.join(", "));
  } else if (item.department) {
    parts.push(item.department);
  }

  if (item.minCgpa) {
    parts.push(`CGPA ${item.minCgpa}+`);
  }

  if (item.maxBacklogs !== "" && item.maxBacklogs !== null && item.maxBacklogs !== undefined) {
    parts.push(`Max ${item.maxBacklogs} backlogs`);
  }

  if (item.year) {
    parts.push(`Year ${item.year}`);
  }

  return parts.length ? parts.join(" | ") : "Check the notice for eligibility details.";
}

function buildBadge(item) {
  const text = item.companyName || item.title || "NT";
  return text
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || "")
    .join("")
    .toUpperCase();
}

function StudentHome() {
  const [notices, setNotices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeAttachment, setActiveAttachment] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadNotices() {
      try {
        const records = await fetchNotices("tpo", { status: "published" });

        if (!isMounted) {
          return;
        }

        setNotices(records);
        setErrorMessage("");
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setNotices([]);
        setErrorMessage(error.response?.data?.message || "Unable to load notices from the server.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadNotices();

    return () => {
      isMounted = false;
    };
  }, []);

  const opportunityFeed = useMemo(
    () =>
      notices.map((item) => ({
        ...item,
        badge: buildBadge(item),
        badgeStyle: badgeStyleMap[item.type] || badgeStyleMap.announcement,
        tone: typeToneMap[item.type] || "Notice",
        postedAt: formatRelativeTime(item.updatedAt || item.createdAt),
        eligibility: buildEligibilityText(item),
        allowedDepartments: item.departments?.length ? item.departments.join(", ") : item.department,
        passingYear: item.year || "All Years",
        deadlineLabel: formatDeadline(item.deadline),
      })),
    [notices],
  );

  function openAttachmentPreview(item) {
    if (!item?.attachmentUrl) {
      return;
    }

    setActiveAttachment({
      url: item.attachmentUrl,
      title: item.title || "Attachment Preview",
    });
  }

  function closeAttachmentPreview() {
    setActiveAttachment(null);
  }

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-[90rem] space-y-6">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-blue-950 via-blue-900 to-cyan-800 px-6 py-8 text-white shadow-[0_20px_50px_rgba(15,23,42,0.18)]">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-100/80">
            Student Panel
          </p>
          <h1 className="mt-3 text-3xl font-bold">Welcome to Training And PLacement Portal</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-blue-100/90">
            Your initial profile submission is complete. You can now explore the
            full student panel, track opportunities, and continue improving your
            placement profile from here.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
            <p className="text-sm font-semibold text-slate-500">Profile Status</p>
            <p className="mt-3 text-2xl font-bold text-emerald-600">Submitted</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Your onboarding form has been completed successfully.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
            <p className="text-sm font-semibold text-slate-500">Next Step</p>
            <p className="mt-3 text-2xl font-bold text-slate-900">Explore Panel</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Use the sidebar to access interviews, assessments, resume tools,
              and other student features.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
            <p className="text-sm font-semibold text-slate-500">Published Notices</p>
            <p className="mt-3 text-2xl font-bold text-slate-900">{opportunityFeed.length}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Live updates from the placement office and notice board.
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                Opportunity Feed
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">
                Latest placement and internship updates
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Stay updated with active hiring windows, internship announcements,
                assessment notices, and important placement deadlines.
              </p>
            </div>
            <div className="rounded-2xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
              {opportunityFeed.length} active updates
            </div>
          </div>

          <div className="mt-6 space-y-5">
            {isLoading ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
                Loading notices...
              </div>
            ) : null}

            {!isLoading && errorMessage ? (
              <div className="rounded-3xl border border-rose-200 bg-rose-50 px-6 py-10 text-center text-sm font-medium text-rose-700">
                {errorMessage}
              </div>
            ) : null}

            {!isLoading && !errorMessage && opportunityFeed.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
                No published notices available right now.
              </div>
            ) : null}

            {!isLoading &&
              !errorMessage &&
              opportunityFeed.map((item) => (
                <article
                  key={item.id}
                  className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)]"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex gap-4">
                      <div
                        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${item.badgeStyle} text-lg font-bold text-slate-800`}
                      >
                        {item.badge}
                      </div>

                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-xl font-bold leading-snug text-slate-900">
                            {item.title}
                          </h3>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">
                            {item.tone}
                          </span>
                        </div>

                        <p className="text-sm text-slate-500">
                          {item.createdByRole || "Notice Board"} | {item.postedAt}
                        </p>

                        <p className="max-w-4xl text-sm leading-7 text-slate-600">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Eligibility
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        {item.eligibility}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4 md:col-span-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Eligibility Details
                      </p>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                            Min CGPA
                          </p>
                          <p className="mt-2 text-sm font-semibold text-slate-900">
                            {item.minCgpa || "N/A"}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                            Max Backlogs
                          </p>
                          <p className="mt-2 text-sm font-semibold text-slate-900">
                            {item.maxBacklogs || "N/A"}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                            Allowed Departments
                          </p>
                          <p className="mt-2 text-sm leading-6 text-slate-700">
                            {item.allowedDepartments || "N/A"}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                            Passing Year
                          </p>
                          <p className="mt-2 text-sm font-semibold text-slate-900">
                            {item.passingYear || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Role Details
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        {item.type === "announcement"
                          ? "General announcement for students."
                          : `${item.companyName || "Company not specified"} | ${item.role || "Role not specified"} | ${item.location || "Location not specified"}`}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Deadline
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <p className="text-sm font-semibold leading-6 text-slate-900">
                          {item.deadlineLabel}
                        </p>

                        {item.attachmentUrl ? (
                          <button
                            type="button"
                            onClick={() => openAttachmentPreview(item)}
                            className="inline-flex items-center rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 hover:text-blue-800"
                          >
                            Open attachment
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
          </div>
        </div>
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

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={closeAttachmentPreview}
                  className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Close
                </button>
              </div>
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
    </div>
  );
}

export default StudentHome;
