import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Download, FileText, Printer } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchStudentResumeById } from "../services/resumeApi";

export default function StudentResumePreviewPage() {
  const navigate = useNavigate();
  const { resumeId } = useParams();
  const iframeRef = useRef(null);
  const [resume, setResume] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadResume() {
      try {
        setIsLoading(true);
        setErrorMessage("");
        const response = await fetchStudentResumeById(resumeId);

        if (!isMounted) {
          return;
        }

        setResume(response);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(
          error?.response?.data?.message ||
            error?.response?.data?.error ||
            error?.message ||
            "Failed to load generated resume.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadResume();

    return () => {
      isMounted = false;
    };
  }, [resumeId]);

  function handlePrintPdf() {
    const iframeWindow = iframeRef.current?.contentWindow;

    if (!iframeWindow) {
      return;
    }

    iframeWindow.focus();
    iframeWindow.print();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_16px_42px_rgba(15,23,42,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Resume Preview
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">
              {resume?.title || "Generated Resume"}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Preview the generated structure here, then download it as Word or use print to save as PDF.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate("/student-panel/resume")}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Resume
            </button>
            {resume?.wordFileUrl ? (
              <a
                href={resume.wordFileUrl}
                download={resume.wordFileName || undefined}
                className="inline-flex items-center gap-2 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100"
              >
                <Download className="h-4 w-4" />
                Download Word
              </a>
            ) : null}
            <button
              type="button"
              onClick={handlePrintPdf}
              className="inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700"
            >
              <Printer className="h-4 w-4" />
              Download PDF
            </button>
          </div>
        </div>
      </section>

      {isLoading ? (
        <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
          Loading generated resume preview...
        </div>
      ) : errorMessage ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {errorMessage}
        </div>
      ) : (
        <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <FileText className="h-4 w-4 text-cyan-700" />
            This preview reflects the generated resume layout and content selection.
          </div>
          <div className="h-[920px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
            <iframe
              ref={iframeRef}
              title={resume?.title || "Resume Preview"}
              src={resume?.previewFileUrl || resume?.fileUrl}
              className="h-full w-full bg-white"
            />
          </div>
        </section>
      )}
    </div>
  );
}
