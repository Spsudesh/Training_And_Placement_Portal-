import { CheckCircle2, Clock3, ShieldBan, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import BlacklistModal from "../components/BlacklistModal";
import FilterBar from "../components/FilterBar";
import StudentTable from "../components/StudentTable";

const departmentOptions = [
  "All",
  "Computer Engineering",
  "Computer Engineering and Information Technology",
  "Artificial Intelligence and Machine Learning",
  "Mechatronics Engineering",
  "Robotics Engineering",
  "Mechanical Engineering",
  "Electrical Engineering",
  "Civil Engineering",
];

const initialFilters = {
  year: "All",
  department: "All",
  search: "",
};

export default function StudentListPage({
  students,
  isLoading,
  errorMessage,
  setStudents,
  setSelectedStudent,
}) {
  const navigate = useNavigate();
  const [filters, setFilters] = useState(initialFilters);
  const [blacklistTarget, setBlacklistTarget] = useState(null);
  const yearOptions = useMemo(
    () => ["All", ...new Set(students.map((student) => student.year).filter(Boolean))],
    [students],
  );

  const filteredStudents = useMemo(() => {
    const searchValue = filters.search.trim().toLowerCase();

    return students.filter((student) => {
      const matchesYear = filters.year === "All" || student.year === filters.year;
      const matchesDepartment =
        filters.department === "All" || student.department === filters.department;
      const matchesSearch =
        !searchValue ||
        student.name.toLowerCase().includes(searchValue) ||
        student.prn.toLowerCase().includes(searchValue);

      return matchesYear && matchesDepartment && matchesSearch;
    });
  }, [filters, students]);

  const stats = useMemo(
    () => ({
      total: students.length,
      verified: students.filter((student) => student.status === "Verified").length,
      pending: students.filter((student) => student.status === "Pending").length,
      blacklisted: students.filter((student) => student.status === "Blacklisted").length,
    }),
    [students],
  );

  function handleFilterChange(field, value) {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleResetFilters() {
    setFilters(initialFilters);
  }

  function handleView(student) {
    setSelectedStudent(student);
    navigate(`/tpo-dashboard/students/${student.prn}`);
  }

  function handleConfirmBlacklist() {
    if (!blacklistTarget) {
      return;
    }

    setStudents((currentStudents) =>
      currentStudents.map((student) =>
        student.prn === blacklistTarget.prn
          ? { ...student, status: "Blacklisted" }
          : student,
      ),
    );
    setSelectedStudent((currentSelectedStudent) =>
      currentSelectedStudent?.prn === blacklistTarget.prn
        ? { ...currentSelectedStudent, status: "Blacklisted" }
        : currentSelectedStudent,
    );
    setBlacklistTarget(null);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[34px] border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-200/60">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-600">
              Student Management
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900">
              TPO student management panel
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
              Monitor student readiness, review complete profiles, and manage
              blacklist status from a clean placement operations workspace.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl bg-slate-950 p-5 text-white">
              <div className="flex items-center justify-between">
                <p className="text-sm text-white/70">Total Students</p>
                <Users className="h-5 w-5 text-white/70" />
              </div>
              <p className="mt-2 text-3xl font-semibold">{stats.total}</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-emerald-700">Verified</p>
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{stats.verified}</p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-amber-700">Pending</p>
                <Clock3 className="h-5 w-5 text-amber-600" />
              </div>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{stats.pending}</p>
            </div>
            <div className="rounded-2xl bg-rose-50 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-rose-700">Blacklisted</p>
                <ShieldBan className="h-5 w-5 text-rose-600" />
              </div>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{stats.blacklisted}</p>
            </div>
          </div>
        </div>
      </section>

      <FilterBar
        filters={filters}
        years={yearOptions}
        departments={departmentOptions}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      <section>
        <StudentTable
          students={filteredStudents}
          isLoading={isLoading}
          errorMessage={errorMessage}
          onView={handleView}
          onBlacklist={setBlacklistTarget}
        />
      </section>

      <BlacklistModal
        student={blacklistTarget}
        isOpen={Boolean(blacklistTarget)}
        onClose={() => setBlacklistTarget(null)}
        onConfirm={handleConfirmBlacklist}
      />
    </div>
  );
}
