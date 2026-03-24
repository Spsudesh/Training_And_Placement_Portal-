import {
  BriefcaseBusiness,
  GraduationCap,
  Target,
  Users,
} from "lucide-react";
import StatCard from "../components/StatCard";
import PieChartBox from "../components/Charts/PieChartBox";
import BarChartBox from "../components/Charts/BarChartBox";
import LineChartBox from "../components/Charts/LineChartBox";
import RecentActivity from "../components/Table/RecentActivity";
import { useDashboardData } from "../hooks/useDashboardData";
import TpoSidebar from "./Tpo_sidebar";

function LoadingState() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, index) => (
          <div
            key={index}
            className="h-36 animate-pulse rounded-[28px] border border-slate-200 bg-white"
          />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="h-96 animate-pulse rounded-[28px] border border-slate-200 bg-white" />
        <div className="h-96 animate-pulse rounded-[28px] border border-slate-200 bg-white" />
      </div>
      <div className="h-96 animate-pulse rounded-[28px] border border-slate-200 bg-white" />
    </div>
  );
}

export default function Overview({ onLogout, onNavigate }) {
  const { data, isLoading, isError, refetch } = useDashboardData();
  const overview = data?.overview;

  return (
    <TpoSidebar
      pageTitle="TPO Dashboard"
      activePage="Dashboard"
      onNavigate={onNavigate}
      onLogout={onLogout}
    >
      {isLoading ? <LoadingState /> : null}

      {!isLoading && isError ? (
        <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-lg shadow-amber-100/60">
          <p className="text-sm font-semibold uppercase tracking-[0.24em]">
            Data Notice
          </p>
          <h2 className="mt-2 text-2xl font-bold">Showing fallback dashboard data</h2>
          <p className="mt-2 text-sm text-amber-800">
            The live dashboard API is not available right now, so the page is using the local snapshot.
          </p>
          <button
            type="button"
            onClick={refetch}
            className="mt-4 rounded-2xl border border-amber-300 bg-white px-4 py-3 text-sm font-semibold text-amber-900 transition hover:bg-amber-100"
          >
            Retry
          </button>
        </section>
      ) : null}

      {!isLoading && data ? (
        <div className="space-y-6">
          <section className="overflow-hidden rounded-[36px] border border-slate-200 bg-white shadow-xl shadow-slate-200/70">
            <div className="relative px-6 py-6 sm:px-8 lg:px-10 lg:py-7">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.18),_transparent_24%),radial-gradient(circle_at_left,_rgba(59,130,246,0.1),_transparent_30%),linear-gradient(135deg,_#ffffff_0%,_#f8fbff_45%,_#eef7ff_100%)]" />
              <div className="relative">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white">
                    TPO Workspace
                  </span>
                  <span className="rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-xs font-semibold text-cyan-700">
                    Placement Overview
                  </span>
                </div>

                <h1 className="mt-5 max-w-3xl text-3xl font-bold leading-tight text-slate-950 sm:text-4xl">
                  Track student readiness, placement momentum, and current campus drive performance.
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-[15px]">
                  Use this dashboard to monitor high-level placement health before moving into detailed notice publishing and drive communication.
                </p>
              </div>
            </div>
          </section>

          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total Students"
              value={overview?.totalStudents ?? 0}
              subtitle="Students tracked in the placement cycle"
              icon={Users}
              accent="from-slate-900 via-slate-800 to-blue-700"
              iconBg="bg-white/20"
            />
            <StatCard
              title="Eligible Students"
              value={overview?.eligibleStudents ?? 0}
              subtitle="Currently eligible for active drives"
              icon={GraduationCap}
              accent="from-cyan-500 via-sky-500 to-blue-500"
              iconBg="bg-white/20"
            />
            <StatCard
              title="Job Openings"
              value={overview?.jobOpenings ?? 0}
              subtitle="Open roles available for students"
              icon={BriefcaseBusiness}
              accent="from-amber-500 via-orange-500 to-rose-500"
              iconBg="bg-white/20"
            />
            <StatCard
              title="Students Placed"
              value={overview?.studentsPlaced ?? 0}
              subtitle="Confirmed placements in the current cycle"
              icon={Target}
              accent="from-sky-500 via-blue-500 to-indigo-600"
              iconBg="bg-white/20"
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <LineChartBox data={data.monthlyPlacementTrend} />
            <PieChartBox data={data.placementRatio} />
          </section>

          <BarChartBox data={data.departmentPlacements} />

          <RecentActivity data={data.recentActivities} />
        </div>
      ) : null}
    </TpoSidebar>
  );
}
