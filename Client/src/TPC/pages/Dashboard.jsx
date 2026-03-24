import {
  BriefcaseBusiness,
  CalendarCheck2,
  ClipboardCheck,
  Users,
} from "lucide-react";
import StatCard from "../components/StatCard";
import PieChartBox from "../components/Charts/PieChartBox";
import BarChartBox from "../components/Charts/BarChartBox";
import LineChartBox from "../components/Charts/LineChartBox";
import RecentActivity from "../components/Table/RecentActivity";
import { useDashboardData } from "../hooks/useDashboardData";

const statConfig = [
  {
    key: "assignedStudents",
    title: "Assigned Students",
    subtitle: "Students currently managed by coordinator teams",
    icon: Users,
    accent: "from-slate-900 via-slate-800 to-blue-700",
    iconBg: "bg-white/15",
  },
  {
    key: "activeDrives",
    title: "Active Drives",
    subtitle: "Ongoing campus activities needing coordination",
    icon: CalendarCheck2,
    accent: "from-blue-500 via-sky-500 to-cyan-500",
    iconBg: "bg-white/20",
  },
  {
    key: "pendingReferrals",
    title: "Pending Tasks",
    subtitle: "Student follow-ups and execution items awaiting action",
    icon: ClipboardCheck,
    accent: "from-amber-500 via-orange-500 to-rose-500",
    iconBg: "bg-white/25",
  },
  {
    key: "placedStudents",
    title: "Students Supported",
    subtitle: "Placed students coordinated through the current cycle",
    icon: BriefcaseBusiness,
    accent: "from-sky-500 via-blue-500 to-indigo-600",
    iconBg: "bg-white/20",
  },
];

function LoadingCard() {
  return (
    <div className="h-40 animate-pulse rounded-[28px] border border-slate-200/70 bg-white/70" />
  );
}

export default function Dashboard() {
  const { data, isLoading, isError, error, refetch, isFetching } =
    useDashboardData();

  return (
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
            <PieChartBox data={data?.driveStatus ?? []} />
            <BarChartBox data={data?.departmentSupport ?? []} />
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
            <LineChartBox data={data?.weeklyTaskTrend ?? []} />

            <div className="rounded-[28px] border border-slate-200/70 bg-white p-6 shadow-lg shadow-slate-200/60">
              <p className="text-sm font-semibold text-slate-900">
                Quick Highlights
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Snapshot metrics to support faster coordinator decisions
              </p>

              <div className="mt-6 space-y-4">
                <div className="rounded-2xl bg-slate-950 p-5 text-white">
                  <p className="text-sm text-white/70">Task Closure Rate</p>
                  <p className="mt-2 text-3xl font-semibold">
                    {data
                      ? `${Math.round(
                          (data.overview.placedStudents /
                            data.overview.assignedStudents) *
                            100
                        )}%`
                      : "--"}
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                  <div className="rounded-2xl bg-blue-50 p-4">
                    <p className="text-sm text-blue-700">Focus Department</p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">
                      CSE
                    </p>
                  </div>
                  <div className="rounded-2xl bg-amber-50 p-4">
                    <p className="text-sm text-amber-700">Next Major Drive</p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">
                      Infosys
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
  );
}
