import { useNavigate } from "react-router-dom";

export default function ResumeHistoryList({ resumes = [] }) {
  const navigate = useNavigate();

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Previous Resumes
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Saved versions</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Open any previously generated resume directly from the saved file on the server.
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {resumes.length ? (
          resumes.map((resume) => (
            <div
              key={resume.id}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">{resume.title}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                  {resume.templateCode} | {resume.createdLabel}
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate(`/student-panel/resume/${resume.id}/preview`)}
                className="inline-flex items-center justify-center rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-2.5 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100"
              >
                Open Resume
              </button>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            No saved resumes yet. Generate your first version below.
          </div>
        )}
      </div>
    </section>
  );
}
