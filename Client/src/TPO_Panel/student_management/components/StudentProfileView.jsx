import { X } from "lucide-react";
import { useMemo, useState } from "react";

const tabOptions = [
  { key: "personal", label: "Personal Details" },
  { key: "placement", label: "Placement Track" },
];

function ProfileSectionCard({ title, description, children }) {
  return (
    <div className="rounded-[24px] border border-slate-200/80 bg-white p-6 shadow-sm">
      <div className="mb-5 border-b border-slate-100 pb-5">
        <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
      </div>
      {children}
    </div>
  );
}

function FieldGrid({ items }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <div key={`${item.label}-${item.value}`} className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {item.label}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-800">{item.value || "-"}</p>
        </div>
      ))}
    </div>
  );
}

function isImageDocument(url) {
  const normalizedUrl = String(url || "").toLowerCase().split("?")[0];

  return [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg"].some((extension) =>
    normalizedUrl.endsWith(extension),
  );
}

function isPdfDocument(url) {
  const normalizedUrl = String(url || "").toLowerCase().split("?")[0];
  return normalizedUrl.endsWith(".pdf");
}

function DocumentButton({ document, onOpen }) {
  if (!document?.url) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => onOpen(document)}
      className="mt-4 inline-flex rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100"
    >
      {document.label || "View Document"}
    </button>
  );
}

function DocumentPreviewModal({ document, onClose }) {
  if (!document?.url) {
    return null;
  }

  const isImage = isImageDocument(document.url);
  const isPdf = isPdfDocument(document.url);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
      <button
        type="button"
        aria-label="Close document preview"
        onClick={onClose}
        className="absolute inset-0"
      />

      <div className="relative z-10 flex h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl shadow-slate-950/25">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">Document Preview</p>
            <p className="text-xs text-slate-500">
              Review the uploaded document inside this page.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
            aria-label="Close document preview"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-1 items-center justify-center overflow-auto bg-slate-100 p-4">
          {isImage ? (
            <div className="flex h-full w-full items-center justify-center rounded-2xl bg-white p-3">
              <img
                src={document.url}
                alt={document.label || "Document Preview"}
                className="block max-h-full max-w-full rounded-2xl object-contain shadow-sm"
              />
            </div>
          ) : isPdf ? (
            <object
              data={document.url}
              type="application/pdf"
              className="h-full w-full rounded-2xl border-0 bg-white"
            >
              <div className="flex h-full items-center justify-center rounded-2xl bg-white p-6 text-center text-sm text-slate-500">
                PDF preview is not available in this browser view.
              </div>
            </object>
          ) : (
            <iframe
              src={document.url}
              title={document.label || "Document Preview"}
              className="h-full w-full rounded-2xl border-0 bg-white"
            />
          )}
        </div>
      </div>
    </div>
  );
}

function getRoundStyles(status) {
  if (status === "completed") {
    return {
      dot: "border-emerald-500 bg-emerald-500",
      line: "bg-emerald-200",
      badge: "border border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  if (status === "current") {
    return {
      dot: "border-cyan-500 bg-cyan-500 ring-4 ring-cyan-100",
      line: "bg-slate-200",
      badge: "border border-cyan-200 bg-cyan-50 text-cyan-700",
    };
  }

  if (status === "rejected") {
    return {
      dot: "border-rose-500 bg-rose-500",
      line: "bg-rose-200",
      badge: "border border-rose-200 bg-rose-50 text-rose-700",
    };
  }

  return {
    dot: "border-slate-300 bg-white",
    line: "bg-slate-200",
    badge: "border border-slate-200 bg-slate-50 text-slate-600",
  };
}

function TimelineStep({ round, isLast }) {
  const styles = getRoundStyles(round.status);

  return (
    <div className="flex gap-4">
      <div className="flex w-5 flex-col items-center">
        <span className={`mt-1 h-4 w-4 rounded-full border-2 ${styles.dot}`} />
        {!isLast ? <span className={`mt-2 w-0.5 flex-1 ${styles.line}`} /> : null}
      </div>

      <div className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">{round.name}</p>
            <p className="mt-1 text-sm text-slate-500">{round.date}</p>
          </div>
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${styles.badge}`}>
            {round.status}
          </span>
        </div>
      </div>
    </div>
  );
}

function PlacementTrackView({ student }) {
  const driveHistory = student.placementTrack?.driveHistory ?? [];

  return (
    <div className="space-y-6">
      <ProfileSectionCard
        title="Drive Mindmap"
        description="A one-view company-wise placement map showing how far the student progressed in each drive, with dates on every step."
      >
        {driveHistory.length > 0 ? (
          <div className="space-y-8">
            {driveHistory.map((drive) => (
              <div
                key={`${drive.company}-${drive.role}-${drive.appliedOn}`}
                className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-6"
              >
                <div className="border-b border-slate-200 pb-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-xl font-semibold text-slate-900">{drive.company}</p>
                      <p className="mt-1 text-sm font-medium text-slate-600">{drive.role}</p>
                      <p className="mt-2 text-sm text-slate-500">Applied on {drive.appliedOn}</p>
                    </div>

                    <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">
                      {drive.outcome}
                    </span>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="h-px flex-1 bg-slate-200" />
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Progress Map
                    </p>
                    <div className="h-px flex-1 bg-slate-200" />
                  </div>

                  <div className="space-y-4">
                    {drive.rounds.map((round, index) => (
                      <TimelineStep
                        key={`${drive.company}-${round.name}-${index}`}
                        round={round}
                        isLast={index === drive.rounds.length - 1}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No drive history available for this student.</p>
        )}
      </ProfileSectionCard>
    </div>
  );
}

export default function StudentProfileView({ student }) {
  const [activeTab, setActiveTab] = useState("personal");
  const [previewDocument, setPreviewDocument] = useState(null);

  const personalSections = useMemo(
    () => (
      <div className="space-y-6">
        <ProfileSectionCard
          title="Profile Summary"
          description="A concise overview of the student's current placement profile."
        >
          <div className="rounded-2xl bg-slate-50 p-5 text-sm leading-7 text-slate-700">
            {student.profileSummary || "No profile summary available."}
          </div>
        </ProfileSectionCard>

        <ProfileSectionCard
          title="Personal Details"
          description="Basic identity, contact, and address information."
        >
          <FieldGrid items={student.personalDetails} />
        </ProfileSectionCard>

        <ProfileSectionCard
          title="Education Details"
          description="Academic performance and supporting documents submitted by the student."
        >
          <div className="grid gap-4 xl:grid-cols-3">
            {student.educationDetails.map((section) => (
              <div
                key={section.title}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
              >
                <p className="text-base font-semibold text-slate-900">{section.title}</p>
                <div className="mt-4 space-y-3">
                  {section.fields.map((field) => (
                    <div key={`${section.title}-${field.label}`}>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        {field.label}
                      </p>
                      <p className="mt-1 text-sm text-slate-700">{field.value}</p>
                    </div>
                  ))}
                </div>
                <DocumentButton document={section.document} onOpen={setPreviewDocument} />
              </div>
            ))}
          </div>
        </ProfileSectionCard>

        <ProfileSectionCard
          title="Skills"
          description="Grouped technical and placement-relevant skill areas."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(student.skills).map(([title, items]) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-600">
                  {title}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {items.length > 0 ? (
                    items.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700"
                      >
                        {item}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500">No items added.</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ProfileSectionCard>

        <ProfileSectionCard
          title="Projects"
          description="Project work, descriptions, and core technologies used by the student."
        >
          <div className="grid gap-4">
            {student.projects.length > 0 ? (
              student.projects.map((project) => (
                <div
                  key={project.title}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                >
                  <p className="text-lg font-semibold text-slate-900">{project.title}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-700">{project.description}</p>
                  <p className="mt-4 text-sm font-medium text-slate-600">
                    Tech Stack:{" "}
                    <span className="font-normal text-slate-700">{project.techStack}</span>
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No projects added.</p>
            )}
          </div>
        </ProfileSectionCard>

        <ProfileSectionCard
          title="Experience"
          description="Internship and work-experience records provided by the student."
        >
          <div className="grid gap-4">
            {student.experience.length > 0 ? (
              student.experience.map((entry) => (
                <div
                  key={`${entry.company}-${entry.role}`}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                >
                  <p className="text-lg font-semibold text-slate-900">{entry.company}</p>
                  <p className="mt-1 text-sm font-medium text-cyan-700">{entry.role}</p>
                  <p className="mt-2 text-sm text-slate-500">{entry.duration}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-700">{entry.description}</p>
                  <DocumentButton document={entry.document} onOpen={setPreviewDocument} />
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No experience entries added.</p>
            )}
          </div>
        </ProfileSectionCard>

        <ProfileSectionCard
          title="Certifications"
          description="Certification titles, issuing platforms, and supporting files."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {student.certifications.length > 0 ? (
              student.certifications.map((entry) => (
                <div
                  key={`${entry.title}-${entry.platform}`}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                >
                  <p className="text-lg font-semibold text-slate-900">{entry.title}</p>
                  <p className="mt-2 text-sm font-medium text-slate-600">{entry.platform}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-700">{entry.description}</p>
                  <DocumentButton document={entry.document} onOpen={setPreviewDocument} />
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No certifications added.</p>
            )}
          </div>
        </ProfileSectionCard>

        <ProfileSectionCard
          title="Activities"
          description="Co-curricular and extracurricular achievements highlighted for the placement profile."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {student.activities.length > 0 ? (
              student.activities.map((entry) => (
                <div
                  key={entry.title}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                >
                  <p className="text-base font-semibold text-slate-900">{entry.title}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-700">{entry.description}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No activities added.</p>
            )}
          </div>
        </ProfileSectionCard>
      </div>
    ),
    [student],
  );

  return (
    <section className="rounded-[30px] border border-slate-200/80 bg-gradient-to-br from-white via-slate-50 to-cyan-50/40 p-6 shadow-lg shadow-slate-200/60">
      <div className="border-b border-slate-200/80 pb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-600">
              Student Insights
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              Profile view and placement tracking
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Switch between the full student profile and a placement-focused
              tracking view from one unified section.
            </p>
          </div>

          <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
            {tabOptions.map((tab) => {
              const isActive = activeTab === tab.key;

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                    isActive
                      ? "bg-slate-950 text-white"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-6">
        {activeTab === "personal" ? personalSections : <PlacementTrackView student={student} />}
      </div>

      {previewDocument ? (
        <DocumentPreviewModal
          document={previewDocument}
          onClose={() => setPreviewDocument(null)}
        />
      ) : null}
    </section>
  );
}
