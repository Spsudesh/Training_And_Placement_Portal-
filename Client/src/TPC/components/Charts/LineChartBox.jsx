import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function LineChartBox({ data }) {
  return (
    <article className="rounded-[28px] border border-slate-200/70 bg-white p-6 shadow-lg shadow-slate-200/60">
      <div className="mb-6">
        <p className="text-sm font-semibold text-slate-900">
          Weekly Application Activity
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Department-level application and placement activity over recent weeks
        </p>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="tpcUpdatesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1d4ed8" stopOpacity={0.42} />
                <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="week" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                borderRadius: "16px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
              }}
            />
            <Area
              type="monotone"
              dataKey="updates"
              name="Updates"
              stroke="#1d4ed8"
              strokeWidth={3}
              fill="url(#tpcUpdatesGradient)"
              animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}
