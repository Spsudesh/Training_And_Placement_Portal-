import {
  BriefcaseBusiness,
  GraduationCap,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { TpoLayout } from "../common";
import StatCard from "./components/StatCard";
import PieChartBox from "./components/charts/PieChartBox";
import BarChartBox from "./components/charts/BarChartBox";
import LineChartBox from "./components/charts/LineChartBox";
import RecentActivity from "./components/table/RecentActivity";
import { useDashboardData } from "./hooks/useDashboardData";

const statConfig = [
  {
    key: "totalStudents",
    title: "Total Students",
    subtitle: "Registered across all active departments",
    icon: Users,
    accent: "from-slate-900 via-slate-800 to-cyan-700",
    iconBg: "bg-white/15",
  },
  {
    key: "eligibleStudents",
    title: "Eligible Students",
    subtitle: "Meeting current placement eligibility criteria",
    icon: ShieldCheck,
    accent: "from-emerald-500 via-teal-500 to-cyan-500",
    iconBg: "bg-white/20",
  },
  {
    key: "jobOpenings",
    title: "Job Openings",
    subtitle: "Live opportunities shared with students",
    icon: BriefcaseBusiness,
    accent: "from-amber-500 via-orange-500 to-rose-500",
    iconBg: "bg-white/25",
  },
  {
    key: "studentsPlaced",
    title: "Students Placed",
    subtitle: "Confirmed placements in the ongoing cycle",
    icon: GraduationCap,
    accent: "from-cyan-500 via-blue-500 to-indigo-600",
    iconBg: "bg-white/20",
  },
];

function LoadingCard() {
  return (
    <div className="h-40 animate-pulse rounded-[28px] border border-slate-200/70 bg-white/70" />
  );
}

export default function Dashboard({ onLogout }) {
  const navigate = useNavigate();
  const { data, isLoading, isError, error, refetch, isFetching } =
    useDashboardData();

  function handleSidebarNavigate(pageLabel) {
    if (pageLabel === "Placements") {
      navigate("/tpo/placements");
      return;
    }

    if (pageLabel === "Dashboard") {
      navigate("/tpo/dashboard");
    }
  }

  return (
    <TpoLayout
      pageTitle="TPO Dashboard"
      activePage="Dashboard"
      onNavigate={handleSidebarNavigate}
      onLogout={onLogout}
    >
      <div className="space-y-6">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, index) => (
                <LoadingCard key={index} />
              ))
            : statConfig.map((item) => (
                <StatCard
                  key={item.key}
                  title={item.title}
                  value={data?.overview[item.key] ?? 0}
                  subtitle={item.subtitle}
                  icon={item.icon}
                  accent={item.accent}
                  iconBg={item.iconBg}
                />
              ))}
        </section>

        {isError ? (
          <section className="rounded-[28px] border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-lg shadow-rose-100/60">
            <p className="text-lg font-semibold">Unable to load dashboard data</p>
            <p className="mt-2 text-sm">
              {error?.message ?? "Something went wrong while fetching the data."}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-4 rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
            >
              Try again
            </button>
          </section>
        ) : (
          <>
            <section className="grid gap-6 xl:grid-cols-[1.1fr_1.35fr]">
              <PieChartBox data={data?.placementRatio ?? []} />
              <BarChartBox data={data?.departmentPlacements ?? []} />
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
              <LineChartBox data={data?.monthlyPlacementTrend ?? []} />

              <div className="rounded-[28px] border border-slate-200/70 bg-white p-6 shadow-lg shadow-slate-200/60">
                <p className="text-sm font-semibold text-slate-900">
                  Quick Highlights
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Snapshot metrics to support faster TPO decisions
                </p>

                <div className="mt-6 space-y-4">
                  <div className="rounded-2xl bg-slate-950 p-5 text-white">
                    <p className="text-sm text-white/70">Placement Rate</p>
                    <p className="mt-2 text-3xl font-semibold">
                      {data
                        ? `${Math.round(
                            (data.overview.studentsPlaced /
                              data.overview.totalStudents) *
                              100
                          )}%`
                        : "--"}
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                    <div className="rounded-2xl bg-cyan-50 p-4">
                      <p className="text-sm text-cyan-700">Top Department</p>
                      <p className="mt-2 text-xl font-semibold text-slate-900">
                        CSE
                      </p>
                    </div>
                    <div className="rounded-2xl bg-amber-50 p-4">
                      <p className="text-sm text-amber-700">Most Active Recruiter</p>
                      <p className="mt-2 text-xl font-semibold text-slate-900">
                        TCS
                      </p>
                    </div>
                    <div className="rounded-2xl bg-emerald-50 p-4">
                      <p className="text-sm text-emerald-700">Live Cache Status</p>
                      <p className="mt-2 text-xl font-semibold text-slate-900">
                        {isFetching ? "Refreshing..." : "Up to date"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <RecentActivity data={data?.recentActivities ?? []} />
          </>
        )}
      </div>
    </TpoLayout>
  );
}

