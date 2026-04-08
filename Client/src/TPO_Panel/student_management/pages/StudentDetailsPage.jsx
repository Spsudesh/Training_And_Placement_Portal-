import { ArrowLeft, CircleAlert, Mail, MapPin, Phone } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import StatusBadge from "../components/StatusBadge";
import StudentProfileView from "../components/StudentProfileView";

export default function StudentDetailsPage({
  students,
  isLoading,
  errorMessage,
  getStudentRecord,
  selectedStudent,
  setSelectedStudent,
}) {
  const navigate = useNavigate();
  const { prn } = useParams();
  const [studentFromApi, setStudentFromApi] = useState(null);
  const [isLoadingStudent, setIsLoadingStudent] = useState(false);
  const [studentError, setStudentError] = useState("");
  const [photoPreviewOpen, setPhotoPreviewOpen] = useState(false);

  const currentStudent = useMemo(
    () =>
      selectedStudent?.prn === prn
        ? selectedStudent
        : students.find((student) => student.prn === prn) ?? studentFromApi ?? null,
    [prn, selectedStudent, studentFromApi, students],
  );

  useEffect(() => {
    if (currentStudent && currentStudent !== selectedStudent) {
      setSelectedStudent(currentStudent);
    }
  }, [currentStudent, selectedStudent, setSelectedStudent]);

  useEffect(() => {
    let isMounted = true;

    if (selectedStudent?.prn === prn || students.some((student) => student.prn === prn)) {
      setStudentFromApi(null);
      setStudentError("");
      return () => {
        isMounted = false;
      };
    }

    async function loadStudent() {
      try {
        setIsLoadingStudent(true);
        setStudentError("");
        const record = await getStudentRecord(prn);

        if (isMounted) {
          setStudentFromApi(record);
        }
      } catch (error) {
        if (isMounted) {
          setStudentFromApi(null);
          setStudentError(
            error?.response?.data?.message ||
              error?.response?.data?.error ||
              error?.message ||
              "Failed to load student profile.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingStudent(false);
        }
      }
    }

    loadStudent();

    return () => {
      isMounted = false;
    };
  }, [getStudentRecord, prn, selectedStudent, students]);

  if (isLoading || isLoadingStudent) {
    return (
      <section className="rounded-[28px] border border-slate-200/80 bg-white p-8 text-center shadow-lg shadow-slate-200/60">
        <p className="text-lg font-semibold text-slate-900">Loading student profile...</p>
        <p className="mt-2 text-sm text-slate-500">
          Fetching the latest record from the database.
        </p>
      </section>
    );
  }

  if (!currentStudent && (errorMessage || studentError)) {
    return (
      <section className="rounded-[28px] border border-slate-200/80 bg-white p-8 text-center shadow-lg shadow-slate-200/60">
        <p className="text-lg font-semibold text-rose-700">Unable to load student profile</p>
        <p className="mt-2 text-sm text-slate-500">{errorMessage || studentError}</p>
        <button
          type="button"
          onClick={() => navigate("/tpo-dashboard/students")}
          className="mt-6 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700"
        >
          Back to Student List
        </button>
      </section>
    );
  }

  if (!currentStudent) {
    return (
      <section className="rounded-[28px] border border-slate-200/80 bg-white p-8 text-center shadow-lg shadow-slate-200/60">
        <p className="text-lg font-semibold text-slate-900">Student not found</p>
        <p className="mt-2 text-sm text-slate-500">
          The selected student could not be loaded from the management list.
        </p>
        <button
          type="button"
          onClick={() => navigate("/tpo-dashboard/students")}
          className="mt-6 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700"
        >
          Back to Student List
        </button>
      </section>
    );
  }

  const isBlacklisted = currentStudent.status === "Blacklisted";

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate("/tpo-dashboard/students")}
        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Student List
      </button>

      <section className="rounded-[32px] border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-200/60">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => setPhotoPreviewOpen(true)}
              className="relative h-20 w-20 overflow-hidden rounded-3xl shadow-lg shadow-slate-200 transition hover:opacity-80"
            >
              <img
                src={currentStudent.avatar}
                alt={currentStudent.name}
                className="h-full w-full object-cover"
              />
            </button>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-600">
                Student Profile
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold text-slate-900">{currentStudent.name}</h1>
                <StatusBadge status={currentStudent.status} />
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-500">
                <span className="inline-flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {currentStudent.email}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {currentStudent.phone}
                </span>
                <span className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {currentStudent.location}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">PRN</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{currentStudent.prn}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Department</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {currentStudent.department}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Year</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{currentStudent.year}</p>
            </div>
          </div>
        </div>
      </section>

      {isBlacklisted ? (
        <section className="flex items-center gap-3 rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700 shadow-sm">
          <CircleAlert className="h-5 w-5" />
          This student is blacklisted.
        </section>
      ) : null}

      <StudentProfileView student={currentStudent} />

      {photoPreviewOpen && currentStudent.avatar ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4">
          <div className="relative flex h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <button
              type="button"
              onClick={() => setPhotoPreviewOpen(false)}
              className="absolute right-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-2xl font-semibold text-slate-700 shadow-lg transition hover:bg-slate-100"
              aria-label="Close preview"
            >
              X
            </button>

            <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-blue-50 to-cyan-50 px-6 py-4 pr-20">
              <p className="text-sm font-semibold text-slate-900">Photo Preview</p>
              <p className="mt-1 text-sm text-slate-600">{currentStudent.name}</p>
            </div>

            <div className="flex flex-1 items-center justify-center overflow-auto bg-slate-100 p-4">
              <img
                src={currentStudent.avatar}
                alt={currentStudent.name}
                className="rounded-2xl object-contain shadow-sm"
                style={{ maxHeight: "85vh", maxWidth: "100%", height: "auto", width: "auto" }}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
