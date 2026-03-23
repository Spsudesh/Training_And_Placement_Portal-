import { ArrowLeft, CheckCheck, CircleAlert, MapPin, Mail, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import StatusBadge from "../components/StatusBadge";
import VerifySection from "../components/VerifySection";

function getAllFieldIds(student) {
  return student.sections.flatMap((section) =>
    section.fields
      .filter((field) => field.verifiable)
      .map((field) => field.id)
  );
}

function createVerifiedFieldMap(student) {
  return getAllFieldIds(student).reduce((accumulator, fieldId) => {
    accumulator[fieldId] = true;
    return accumulator;
  }, {});
}

export default function StudentDetailsPage({
  students,
  selectedStudent,
  setSelectedStudent,
  setStudents,
}) {
  const navigate = useNavigate();
  const { prn } = useParams();
  const [verifiedFields, setVerifiedFields] = useState({});
  const [isProfileVerified, setIsProfileVerified] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const matchedStudent =
      selectedStudent?.prn === prn
        ? selectedStudent
        : students.find((student) => student.prn === prn) ?? null;

    setSelectedStudent(matchedStudent);
    setVerifiedFields(matchedStudent?.verifiedFields ?? {});
    setIsProfileVerified(matchedStudent?.status === "Verified");
    setSuccessMessage(matchedStudent?.status === "Verified" ? "Profile Verified" : "");
  }, [prn, selectedStudent, setSelectedStudent, students]);

  if (!selectedStudent) {
    return (
      <section className="rounded-[28px] border border-slate-200/80 bg-white p-8 text-center shadow-lg shadow-slate-200/60">
        <p className="text-lg font-semibold text-slate-900">Student not found</p>
        <p className="mt-2 text-sm text-slate-500">
          The selected student could not be loaded from the verification queue.
        </p>
        <button
          type="button"
          onClick={() => navigate("/tpc-dashboard/student-verification")}
          className="mt-6 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Back to Student List
        </button>
      </section>
    );
  }

  const handleVerifyField = (fieldId) => {
    if (isProfileVerified) {
      return;
    }

    const nextVerifiedFields = {
      ...verifiedFields,
      [fieldId]: true,
    };

    setVerifiedFields(nextVerifiedFields);
    setStudents((currentStudents) =>
      currentStudents.map((student) =>
        student.prn === selectedStudent.prn
          ? { ...student, verifiedFields: nextVerifiedFields }
          : student
      )
    );
    setSelectedStudent((currentStudent) =>
      currentStudent ? { ...currentStudent, verifiedFields: nextVerifiedFields } : currentStudent
    );
  };

  const handleMarkProfileVerified = () => {
    if (isProfileVerified) {
      return;
    }

    const allVerifiedFields = createVerifiedFieldMap(selectedStudent);

    setVerifiedFields(allVerifiedFields);
    setIsProfileVerified(true);
    setSuccessMessage("Student profile marked as verified successfully.");

    setStudents((currentStudents) =>
      currentStudents.map((student) =>
        student.prn === selectedStudent.prn
          ? { ...student, status: "Verified", verifiedFields: allVerifiedFields }
          : student
      )
    );
    setSelectedStudent((currentStudent) =>
      currentStudent
        ? {
            ...currentStudent,
            status: "Verified",
            verifiedFields: allVerifiedFields,
          }
        : currentStudent
    );
  };

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate("/tpc-dashboard/student-verification")}
        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Student List
      </button>

      <section className="rounded-[32px] border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-200/60">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <img
              src={selectedStudent.avatar}
              alt={selectedStudent.name}
              className="h-20 w-20 rounded-3xl object-cover shadow-lg shadow-slate-200"
            />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-600">
                Student Details
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">
                {selectedStudent.name}
              </h1>
              <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-500">
                <span className="inline-flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {selectedStudent.email}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {selectedStudent.phone}
                </span>
                <span className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {selectedStudent.location}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">PRN</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {selectedStudent.prn}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Department
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {selectedStudent.department}
              </p>
            </div>
            <StatusBadge status={isProfileVerified ? "Verified" : selectedStudent.status} />
          </div>
        </div>
      </section>

      {successMessage ? (
        <section className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700 shadow-sm">
          {successMessage}
        </section>
      ) : null}

      {isProfileVerified ? (
        <section className="flex items-center gap-3 rounded-[24px] border border-blue-200 bg-blue-50 px-5 py-4 text-sm font-medium text-blue-700">
          <CircleAlert className="h-5 w-5" />
          Profile Verified
        </section>
      ) : null}

      <section className="grid gap-6">
        {selectedStudent.sections.map((section) => (
          <VerifySection
            key={section.id}
            section={section}
            verifiedFields={verifiedFields}
            isProfileVerified={isProfileVerified}
            onVerifyField={handleVerifyField}
          />
        ))}
      </section>

      <section className="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-200/60">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-lg font-semibold text-slate-900">Final Verification</p>
            <p className="mt-2 text-sm text-slate-500">
              Once approved, the profile is locked and all remaining verification
              actions are disabled for this simulation.
            </p>
          </div>
          <button
            type="button"
            onClick={handleMarkProfileVerified}
            disabled={isProfileVerified}
            className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition ${
              isProfileVerified
                ? "cursor-not-allowed bg-slate-200 text-slate-500"
                : "bg-slate-950 text-white hover:bg-emerald-600"
            }`}
          >
            <CheckCheck className="h-4 w-4" />
            Mark Profile as Verified
          </button>
        </div>
      </section>
    </div>
  );
}
