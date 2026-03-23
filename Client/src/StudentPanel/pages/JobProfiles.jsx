import { useEffect, useMemo, useState } from "react";
import {
  formatPlacementDeadline,
  isPlacementActive,
  loadPlacementJobs,
  PLACEMENTS_STORAGE_KEY,
  splitLines,
} from "../../shared/placementJobs";

function TextWithShowMore({ text, limit = 260 }) {
  const [expanded, setExpanded] = useState(false);

  if (!text) {
    return <p className="text-sm text-slate-500">No content available.</p>;
  }

  const isLong = text.length > limit;
  const content = expanded || !isLong ? text : `${text.slice(0, limit)}...`;

  return (
    <div>
      <p className="whitespace-pre-line text-sm leading-7 text-slate-700">{content}</p>
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

function SectionTitle({ children }) {
  return (
    <div className="border-b border-slate-200 pb-3">
      <h3 className="text-base font-semibold text-slate-900">{children}</h3>
    </div>
  );
}

function DetailLine({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-700">{value || "Not specified"}</p>
    </div>
  );
}

export default function JobProfiles() {
  const [jobs, setJobs] = useState(() => loadPlacementJobs());
  const [selectedJobId, setSelectedJobId] = useState(() => loadPlacementJobs()[0]?.id ?? null);

  useEffect(() => {
    function syncJobs() {
      const nextJobs = loadPlacementJobs();
      setJobs(nextJobs);
      setSelectedJobId((currentId) => {
        const stillExists = nextJobs.some((job) => job.id === currentId);
        return stillExists ? currentId : nextJobs[0]?.id ?? null;
      });
    }

    syncJobs();
    window.addEventListener("storage", syncJobs);
    window.addEventListener(PLACEMENTS_STORAGE_KEY, syncJobs);

    return () => {
      window.removeEventListener("storage", syncJobs);
      window.removeEventListener(PLACEMENTS_STORAGE_KEY, syncJobs);
    };
  }, []);

  const selectedJob = useMemo(
    () => jobs.find((job) => job.id === selectedJobId) ?? jobs[0] ?? null,
    [jobs, selectedJobId],
  );

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-[90rem] space-y-6">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:p-6">
          <div className="flex flex-col gap-5 lg:h-[78vh] lg:flex-row">
            <div className="min-w-0 lg:w-[30%] lg:border-r lg:border-slate-200 lg:pr-4">
              <div className="flex h-full flex-col overflow-hidden">
                <div className="border-b border-slate-200 pb-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Job Profiles
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900">
                    Active placements and internships
                  </h2>
                </div>

                <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
                  {jobs.length === 0 ? (
                    <p className="py-8 text-sm text-slate-500">No jobs available right now.</p>
                  ) : (
                    jobs.map((job) => {
                      const active = selectedJob?.id === job.id;
                      const status = isPlacementActive(job) ? "Active" : "Closed";

                      return (
                        <button
                          key={job.id}
                          type="button"
                          onClick={() => setSelectedJobId(job.id)}
                          className={`mb-2 w-full rounded-2xl px-4 py-3 text-left transition ${
                            active ? "bg-blue-50" : "hover:bg-slate-50"
                          }`}
                        >
                          <p className="text-sm font-semibold text-slate-900">
                            {job.company} | {job.title}
                          </p>
                          <p className="mt-1 text-xs text-slate-600">
                            {job.location} | {job.type}
                          </p>
                          <p
                            className={`mt-2 text-xs font-medium ${
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
              {!selectedJob ? (
                <p className="text-sm text-slate-500">Select a job to view details.</p>
              ) : (
                <div className="flex h-full flex-col overflow-hidden">
                  <header className="border-b border-slate-200 pb-4">
                    <h1 className="text-2xl font-bold text-slate-900">{selectedJob.title}</h1>
                    <p className="mt-2 text-sm text-slate-600">
                      {selectedJob.company} | {selectedJob.location} | {selectedJob.type}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Deadline: {formatPlacementDeadline(selectedJob.deadline)}
                    </p>
                  </header>

                  <div className="mt-6 min-h-0 flex-1 space-y-8 overflow-y-auto pr-1">
                    <section className="space-y-4">
                      <SectionTitle>Opening Overview</SectionTitle>
                      <div className="grid gap-4 md:grid-cols-2">
                        <DetailLine label="Category" value={selectedJob.overview.category} />
                        <DetailLine label="Level" value={selectedJob.overview.level} />
                        <DetailLine label="Job Functions" value={selectedJob.overview.functions} />
                        <DetailLine
                          label="CTC"
                          value={
                            selectedJob.overview.ctc
                              ? `${selectedJob.overview.ctc} LPA`
                              : "Not specified"
                          }
                        />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                          Other Info
                        </p>
                        <div className="mt-2">
                          <TextWithShowMore text={selectedJob.overview.otherInfo} />
                        </div>
                      </div>
                    </section>

                    <section className="space-y-4">
                      <SectionTitle>Job Description</SectionTitle>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Role Overview</p>
                        <div className="mt-2">
                          <TextWithShowMore text={selectedJob.description.roleOverview} />
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          Key Responsibilities
                        </p>
                        {splitLines(selectedJob.description.responsibilities).length > 0 ? (
                          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                            {splitLines(selectedJob.description.responsibilities).map(
                              (responsibility, index) => (
                                <li key={`${selectedJob.id}-responsibility-${index}`} className="flex gap-2">
                                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400" />
                                  <span>{responsibility}</span>
                                </li>
                              ),
                            )}
                          </ul>
                        ) : (
                          <p className="mt-2 text-sm text-slate-500">No responsibilities listed.</p>
                        )}
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          Required Skills & Attributes
                        </p>
                        <div className="mt-2">
                          <TextWithShowMore text={selectedJob.description.skills} />
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-slate-900">What We Offer</p>
                        <div className="mt-2">
                          <TextWithShowMore text={selectedJob.description.offer} />
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-slate-900">Disclaimer</p>
                        <div className="mt-2">
                          <TextWithShowMore text={selectedJob.description.disclaimer} />
                        </div>
                      </div>
                    </section>

                    <section className="space-y-4">
                      <SectionTitle>Required Skills</SectionTitle>
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
                    </section>

                    <section className="space-y-4">
                      <SectionTitle>Additional Information</SectionTitle>
                      <TextWithShowMore text={selectedJob.additional.extraInfo} />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Attached Documents</p>
                        <p className="mt-2 text-sm leading-6 text-slate-700">
                          {selectedJob.attachment || "No attachment provided."}
                        </p>
                      </div>
                    </section>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
