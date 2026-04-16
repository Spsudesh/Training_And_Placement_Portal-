import { CheckCircle2, Clock3, ShieldCheck, Users } from "lucide-react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import StudentTable from "../components/StudentTable";

export default function StudentListPage({
  students,
  tpcDepartment = "",
  isLoading = false,
  errorMessage = "",
  setSelectedStudent,
}) {
  const navigate = useNavigate();

  const handleViewStudent = (student) => {
    setSelectedStudent(student);
    navigate(`/tpc-dashboard/student-verification/${student.prn}`);
  };

  const sortedStudents = useMemo(() => {
    const departmentMatchedStudents = students.filter(
      (student) =>
        String(student?.department || "").trim().toLowerCase() ===
        String(tpcDepartment || "").trim().toLowerCase(),
    );
    const unverified = departmentMatchedStudents.filter((student) => student.status !== "Verified");
    const verified = departmentMatchedStudents.filter((student) => student.status === "Verified");
    return [...unverified, ...verified];
  }, [students, tpcDepartment]);

  const verifiedCount = sortedStudents.filter((student) => student.status === "Verified").length;
  const remainingCount = sortedStudents.length - verifiedCount;

  if (isLoading) {
    return (
      <section className="rounded-[28px] border border-slate-200/80 bg-white p-8 shadow-lg shadow-slate-200/60">
        <p className="text-lg font-semibold text-slate-900">Loading students...</p>
        <p className="mt-2 text-sm text-slate-500">
          Fetching student verification records from the database.
        </p>
      </section>
    );
  }

  if (errorMessage) {
    return (
      <section className="rounded-[28px] border border-red-200 bg-red-50 p-8 shadow-lg shadow-red-100/60">
        <p className="text-lg font-semibold text-red-700">Unable to load students</p>
        <p className="mt-2 text-sm text-red-600">{errorMessage}</p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-200/60">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-600">
              Student Verification
            </p>
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">
                Student profile review
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Inspect submitted details, complete field-level verification, and
                mark each profile as approved once the record is fully validated.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-950 p-5 text-white">
              <div className="flex items-center justify-between">
                <p className="text-sm text-white/70">Total students</p>
                <Users className="h-5 w-5 text-white/70" />
              </div>
              <p className="mt-2 text-3xl font-semibold">{sortedStudents.length}</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-emerald-700">Profiles verified</p>
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                {verifiedCount}
              </p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-amber-700">Remaining</p>
                <Clock3 className="h-5 w-5 text-amber-600" />
              </div>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                {remainingCount}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-200/60">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Department
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {tpcDepartment || "Department not assigned"}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Current Academic Year
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-900">2024-25</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <StudentTable students={sortedStudents} onView={handleViewStudent} />

        <div className="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-200/60">
          <div className="flex items-start gap-3">
            <span className="rounded-2xl bg-blue-100 p-3 text-blue-700">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Verification tips
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Open a student profile, verify each submitted field, review
                supporting documents where available, and lock the profile only
                after the complete record is validated.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
