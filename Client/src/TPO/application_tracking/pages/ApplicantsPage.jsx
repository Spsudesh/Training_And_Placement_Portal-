import { ArrowLeft, BriefcaseBusiness, Clock3, Search, UserCheck, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  fetchOpportunityApplicants,
  rejectAllOpportunityApplicants,
  rejectOpportunityApplicant,
  verifyAllOpportunityApplicants,
  verifyOpportunityApplicant,
} from "../services/applicationTrackingApi";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function MetricCard({ icon: Icon, label, value, tone = "slate" }) {
  const toneClasses =
    tone === "cyan"
      ? "bg-cyan-50 text-cyan-700"
      : tone === "emerald"
      ? "bg-emerald-50 text-emerald-700"
      : tone === "amber"
      ? "bg-amber-50 text-amber-700"
      : "bg-slate-100 text-slate-700";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{label}</p>
        <span className={`rounded-xl p-2 ${toneClasses}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function exportApplicantsToCsv(opportunity, applicants) {
  const rows = [
    [
      "PRN",
      "Name",
      "Phone",
      "Department",
      "Passing Year",
      "Status",
      "Current Stage",
    ],
    ...applicants.map((applicant) => [
      applicant.prn || "",
      applicant.name || "",
      applicant.phone || "",
      applicant.department || "",
      applicant.passingYear || "",
      applicant.applicationStatus || "",
      applicant.currentStage || "TPO Verification",
    ]),
  ];

  const csvContent = rows
    .map((row) =>
      row
        .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)
        .join(","),
    )
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const companyName = String(opportunity?.company || "opportunity").trim().replace(/\s+/g, "_");
  const roleName = String(opportunity?.title || "applicants").trim().replace(/\s+/g, "_");

  link.href = url;
  link.download = `${companyName}_${roleName}_applicants.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function ApplicantsPage() {
  const navigate = useNavigate();
  const { placementId } = useParams();
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [activeApplicationId, setActiveApplicationId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [pageData, setPageData] = useState({
    opportunity: null,
    summary: {
      totalApplicants: 0,
      pendingVerification: 0,
      inProcess: 0,
      selected: 0,
    },
    applicants: [],
  });

  async function loadApplicants(options = {}) {
    const { silent = false } = options;

    if (!silent) {
      setIsLoading(true);
    }

    try {
      setErrorMessage("");
      const data = await fetchOpportunityApplicants(placementId);
      setPageData(data);
    } catch (error) {
      setErrorMessage(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to fetch opportunity applicants.",
      );
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }

  useEffect(() => {
    loadApplicants();
  }, [placementId]);

  const filteredApplicants = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    if (!searchValue) {
      return pageData.applicants;
    }

    return pageData.applicants.filter((applicant) =>
      [applicant.name, applicant.prn, applicant.department, applicant.applicationStatus]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(searchValue)),
    );
  }, [pageData.applicants, search]);

  const totalPages = Math.max(1, Math.ceil(filteredApplicants.length / pageSize));

  const paginatedApplicants = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredApplicants.slice(startIndex, startIndex + pageSize);
  }, [currentPage, filteredApplicants, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, pageSize, pageData.applicants.length]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  async function handleVerifyAll() {
    const confirmed = window.confirm("Verify all pending applications for this opportunity?");

    if (!confirmed) {
      return;
    }

    try {
      setIsSubmittingAction(true);
      await verifyAllOpportunityApplicants(placementId);
      await loadApplicants({ silent: true });
    } catch (error) {
      setErrorMessage(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to verify all applications.",
      );
    } finally {
      setIsSubmittingAction(false);
    }
  }

  async function handleRejectAll() {
    const confirmed = window.confirm("Reject all pending applications for this opportunity?");

    if (!confirmed) {
      return;
    }

    try {
      setIsSubmittingAction(true);
      await rejectAllOpportunityApplicants(placementId);
      await loadApplicants({ silent: true });
    } catch (error) {
      setErrorMessage(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to reject all applications.",
      );
    } finally {
      setIsSubmittingAction(false);
    }
  }

  async function handleVerifyApplicant(applicationId) {
    try {
      setActiveApplicationId(applicationId);
      await verifyOpportunityApplicant(applicationId);
      await loadApplicants({ silent: true });
    } catch (error) {
      setErrorMessage(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to verify application.",
      );
    } finally {
      setActiveApplicationId(null);
    }
  }

  async function handleRejectApplicant(applicationId) {
    try {
      setActiveApplicationId(applicationId);
      await rejectOpportunityApplicant(applicationId);
      await loadApplicants({ silent: true });
    } catch (error) {
      setErrorMessage(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to reject application.",
      );
    } finally {
      setActiveApplicationId(null);
    }
  }

  function handleExportExcel() {
    exportApplicantsToCsv(pageData.opportunity, filteredApplicants);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[34px] border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-200/60">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <button
              type="button"
              onClick={() => navigate("/tpo-dashboard/placements")}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Opportunities
            </button>

            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.35em] text-cyan-600">
              Application Tracking
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900">
              {pageData.opportunity?.company || "Opportunity Applicants"}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {pageData.opportunity?.title || "Applicants list"}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {pageData.opportunity?.location || "-"} | {pageData.opportunity?.type || "-"} | Deadline:{" "}
              {formatDateTime(pageData.opportunity?.deadline)}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard icon={Users} label="Total Applicants" value={pageData.summary.totalApplicants} tone="slate" />
            <MetricCard
              icon={Clock3}
              label="Pending Verification"
              value={pageData.summary.pendingVerification}
              tone="amber"
            />
            <MetricCard icon={BriefcaseBusiness} label="In Process" value={pageData.summary.inProcess} tone="cyan" />
            <MetricCard icon={UserCheck} label="Selected" value={pageData.summary.selected} tone="emerald" />
          </div>
        </div>
      </section>

      <section className="rounded-[30px] border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-200/60">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Applicants</h2>
              <p className="mt-1 text-sm text-slate-500">
                Review students who submitted applications for this company drive.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={filteredApplicants.length === 0}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Export Excel
              </button>
              <button
                type="button"
                onClick={handleVerifyAll}
                disabled={isSubmittingAction}
                className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmittingAction ? "Working..." : "Allow All"}
              </button>
              <button
                type="button"
                onClick={handleRejectAll}
                disabled={isSubmittingAction}
                className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmittingAction ? "Working..." : "Reject All"}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Search, paginate, and review applicant records efficiently.
              </p>
            </div>

            <div className="flex w-full max-w-2xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <label className="relative block w-full sm:max-w-md">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by name, PRN, department, or status"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-11 py-3 text-sm text-slate-700 outline-none transition focus:border-cyan-500"
                />
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <span className="whitespace-nowrap font-medium text-slate-500">Rows</span>
                <select
                  value={pageSize}
                  onChange={(event) => setPageSize(Number(event.target.value))}
                  className="bg-transparent outline-none"
                >
                  {PAGE_SIZE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
            Loading applicants...
          </div>
        ) : errorMessage ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                    <th className="px-6 py-4">PRN</th>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Phone</th>
                    <th className="px-6 py-4">Department</th>
                    <th className="px-6 py-4">Passing Year</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Current Stage</th>
                    <th className="px-6 py-4">View Student</th>
                    <th className="px-6 py-4">Allow</th>
                    <th className="px-6 py-4">Reject</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {paginatedApplicants.length > 0 ? (
                    paginatedApplicants.map((applicant) => (
                      <tr key={applicant.applicationId} className="align-top text-sm text-slate-700">
                        <td className="px-6 py-4 font-medium text-slate-900">{applicant.prn || "-"}</td>
                        <td className="px-6 py-4">{applicant.name || "-"}</td>
                        <td className="px-6 py-4">{applicant.phone || "-"}</td>
                        <td className="px-6 py-4">{applicant.department || "-"}</td>
                        <td className="px-6 py-4">{applicant.passingYear || "-"}</td>
                        <td className="px-6 py-4">
                          <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                            {String(applicant.applicationStatus || "").replaceAll("_", " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4">{applicant.currentStage || "TPO Verification"}</td>
                        <td className="px-6 py-4">
                          <button
                            type="button"
                            onClick={() => navigate(`/tpo-dashboard/students/${applicant.prn}`)}
                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            View Student
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            type="button"
                            onClick={() => handleVerifyApplicant(applicant.applicationId)}
                            disabled={
                              activeApplicationId === applicant.applicationId ||
                              applicant.applicationStatus !== "pending_verification"
                            }
                            className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {activeApplicationId === applicant.applicationId ? "Allowing..." : "Allow"}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            type="button"
                            onClick={() => handleRejectApplicant(applicant.applicationId)}
                            disabled={
                              activeApplicationId === applicant.applicationId ||
                              applicant.applicationStatus !== "pending_verification"
                            }
                            className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {activeApplicationId === applicant.applicationId ? "Rejecting..." : "Reject"}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} className="px-6 py-8 text-center text-sm text-slate-500">
                        No applicants found for this search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Showing{" "}
                <span className="font-medium text-slate-700">
                  {filteredApplicants.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium text-slate-700">
                  {Math.min(currentPage * pageSize, filteredApplicants.length)}
                </span>{" "}
                of <span className="font-medium text-slate-700">{filteredApplicants.length}</span> applicants
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Previous
                </button>
                <span className="px-3 text-sm font-medium text-slate-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
