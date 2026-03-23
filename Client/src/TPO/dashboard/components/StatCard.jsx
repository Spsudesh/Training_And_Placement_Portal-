export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  accent = "from-cyan-500 to-blue-500",
  iconBg = "bg-white/20",
}) {
  const Icon = icon;

  return (
    <article
      className={`group relative overflow-hidden rounded-[28px] bg-gradient-to-br ${accent} p-5 text-white shadow-lg shadow-slate-200/70 transition duration-300 hover:-translate-y-1 hover:shadow-2xl`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.25),_transparent_40%)] opacity-90" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-white/80">{title}</p>
          <h3 className="mt-4 text-3xl font-semibold tracking-tight">{value}</h3>
          <p className="mt-2 text-sm text-white/80">{subtitle}</p>
        </div>

        <div
          className={`rounded-2xl ${iconBg} p-3 shadow-inner shadow-white/10 transition duration-300 group-hover:scale-110`}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </article>
  );
}

