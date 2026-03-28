import { ArrowLeft, BadgeCheck, CheckCheck, CircleAlert, MapPin, Mail, Phone } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import StatusBadge from "../components/StatusBadge";
import VerifySection from "../components/VerifySection";
import {
  verifyStudentField,
  verifyStudentProfile,
} from "../services/studentVerificationApi";

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
  isLoading = false,
  errorMessage = "",
  selectedStudent,
  setSelectedStudent,
  setStudents,
}) {
  const navigate = useNavigate();
  const { prn } = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentStudent = useMemo(
    () =>
      selectedStudent?.prn === prn
        ? selectedStudent
        : students.find((student) => student.prn === prn) ?? null,
    [prn, selectedStudent, students],
  );

  useEffect(() => {
    if (selectedStudent !== currentStudent) {
      setSelectedStudent(currentStudent);
    }
  }, [currentStudent, selectedStudent, setSelectedStudent]);

  if (isLoading) {
    return (
      <section className="rounded-[28px] border border-slate-200/80 bg-white p-8 text-center shadow-lg shadow-slate-200/60">
        <p className="text-lg font-semibold text-slate-900">Loading student details...</p>
        <p className="mt-2 text-sm text-slate-500">
          Fetching student verification data from the database.
        </p>
      </section>
    );
  }

  if (errorMessage) {
    return (
      <section className="rounded-[28px] border border-red-200 bg-red-50 p-8 text-center shadow-lg shadow-red-100/60">
        <p className="text-lg font-semibold text-red-700">Unable to load student details</p>
        <p className="mt-2 text-sm text-red-600">{errorMessage}</p>
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

  if (!currentStudent) {
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

  const verifiedFields = currentStudent.verifiedFields ?? {};
  const isProfileVerified = currentStudent.status === "Verified";

  const handleVerifyField = (fieldId) => {
    if (isProfileVerified || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    verifyStudentField(currentStudent.prn, fieldId)
      .then(() => {
        const nextVerifiedFields = {
          ...verifiedFields,
          [fieldId]: true,
        };

        setStudents((currentStudents) =>
          currentStudents.map((student) =>
            student.prn === currentStudent.prn
              ? { ...student, verifiedFields: nextVerifiedFields }
              : student
          )
        );
        setSelectedStudent((currentStudentValue) =>
          currentStudentValue
            ? { ...currentStudentValue, verifiedFields: nextVerifiedFields }
            : currentStudentValue
        );
      })
      .catch((error) => {
        window.alert(
          error?.response?.data?.message ||
            error?.response?.data?.error ||
            error?.message ||
            "Failed to verify the selected field.",
        );
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const handleMarkProfileVerified = () => {
    if (isProfileVerified || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    verifyStudentProfile(currentStudent.prn)
      .then(() => {
        const allVerifiedFields = createVerifiedFieldMap(currentStudent);

        setStudents((currentStudents) =>
          currentStudents.map((student) =>
            student.prn === currentStudent.prn
              ? {
                  ...student,
                  status: "Verified",
                  isProfileVerified: true,
                  verifiedFields: allVerifiedFields,
                }
              : student
          )
        );
        setSelectedStudent((currentStudentValue) =>
          currentStudentValue
            ? {
                ...currentStudentValue,
                status: "Verified",
                isProfileVerified: true,
                verifiedFields: allVerifiedFields,
              }
            : currentStudentValue
        );
      })
      .catch((error) => {
        window.alert(
          error?.response?.data?.message ||
            error?.response?.data?.error ||
            error?.message ||
            "Failed to mark the profile as verified.",
        );
      })
      .finally(() => {
        setIsSubmitting(false);
      });
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
              src={currentStudent.avatar}
              alt={currentStudent.name}
              className="h-20 w-20 rounded-3xl object-cover shadow-lg shadow-slate-200"
            />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-600">
                Student Details
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold text-slate-900">
                  {currentStudent.name}
                </h1>
                {currentStudent.isProfileVerified ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700">
                    <BadgeCheck className="h-4 w-4" />
                    Verified
                  </span>
                ) : null}
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
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {currentStudent.prn}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Department
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {currentStudent.department}
              </p>
            </div>
            <StatusBadge status={isProfileVerified ? "Verified" : currentStudent.status} />
          </div>
        </div>
      </section>

      {isProfileVerified ? (
        <section className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700 shadow-sm">
          Student profile marked as verified successfully.
        </section>
      ) : null}

      {isProfileVerified ? (
        <section className="flex items-center gap-3 rounded-[24px] border border-blue-200 bg-blue-50 px-5 py-4 text-sm font-medium text-blue-700">
          <CircleAlert className="h-5 w-5" />
          Profile Verified
        </section>
      ) : null}

      <section className="grid gap-6">
        {currentStudent.sections.map((section) => (
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
