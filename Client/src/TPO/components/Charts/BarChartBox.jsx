import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function BarChartBox({ data }) {
  return (
    <article className="rounded-[28px] border border-slate-200/70 bg-white p-6 shadow-lg shadow-slate-200/60">
      <div className="mb-6">
        <p className="text-sm font-semibold text-slate-900">
          Department-wise Placements
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Offers versus confirmed placements by department
        </p>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={10}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="department" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip
              cursor={{ fill: "rgba(148, 163, 184, 0.08)" }}
              contentStyle={{
                borderRadius: "16px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
              }}
            />
            <Bar
              dataKey="offers"
              name="Offers"
              fill="#94a3b8"
              radius={[10, 10, 0, 0]}
              animationDuration={900}
            />
            <Bar
              dataKey="placed"
              name="Placed"
              fill="#06b6d4"
              radius={[10, 10, 0, 0]}
              animationDuration={1100}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

