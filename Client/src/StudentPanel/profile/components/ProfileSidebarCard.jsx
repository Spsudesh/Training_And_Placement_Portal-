import { AlertCircle, BadgeCheck } from "lucide-react";

function getInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function ProfileSidebarCard({ profile, links }) {
  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-orange-200 via-rose-200 to-blue-200 text-2xl font-bold text-slate-800">
          {getInitials(profile.fullName)}
        </div>
        <div className="mt-5 flex justify-center">
          {profile.verification?.isProfileVerified ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm">
              <BadgeCheck className="h-4 w-4" />
              Verified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 shadow-sm">
              <AlertCircle className="h-4 w-4" />
              Unverified by TPC
            </span>
          )}
        </div>
        <h2 className="mt-4 text-2xl font-bold leading-tight text-slate-900">
          {profile.fullName}
        </h2>
        <p className="mt-2 text-sm text-slate-500">PRN: {profile.prn}</p>
        <p className="mt-2 text-sm font-medium text-blue-700">{profile.department}</p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
        <p className="px-2 pb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
          Sections
        </p>
        <div className="space-y-1">
          {links.map((link, index) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              className={`flex items-center rounded-2xl px-4 py-3 text-sm font-medium transition ${
                index === 0
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ProfileSidebarCard;
