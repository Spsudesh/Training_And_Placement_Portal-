import { ArrowLeft, CircleAlert, Mail, MapPin, Phone } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import StatusBadge from "../components/StatusBadge";
import StudentProfileView from "../components/StudentProfileView";

export default function StudentDetailsPage({
  students,
  selectedStudent,
  setSelectedStudent,
}) {
  const navigate = useNavigate();
  const { prn } = useParams();

  const currentStudent = useMemo(
    () =>
      selectedStudent?.prn === prn
        ? selectedStudent
        : students.find((student) => student.prn === prn) ?? null,
    [prn, selectedStudent, students],
  );

  useEffect(() => {
    if (currentStudent && currentStudent !== selectedStudent) {
      setSelectedStudent(currentStudent);
    }
  }, [currentStudent, selectedStudent, setSelectedStudent]);

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
            <img
              src={currentStudent.avatar}
              alt={currentStudent.name}
              className="h-20 w-20 rounded-3xl object-cover shadow-lg shadow-slate-200"
            />
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
    </div>
  );
}
