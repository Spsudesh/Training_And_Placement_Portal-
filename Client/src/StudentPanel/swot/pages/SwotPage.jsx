import { useMemo, useState } from "react";
import {
  ArrowRight,
  Brain,
  BriefcaseBusiness,
  CheckCircle2,
  Compass,
  Lightbulb,
  Loader2,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { generateStudentSwot } from "../services/swotApi";
import { getStudentProfile } from "../../profile/services/studentProfileApi";

const swotToneMap = {
  strengths: {
    title: "Strengths",
    icon: TrendingUp,
    cardClass: "border-emerald-200 bg-emerald-50/70",
    badgeClass: "bg-emerald-100 text-emerald-700",
  },
  weaknesses: {
    title: "Weaknesses",
    icon: ShieldAlert,
    cardClass: "border-amber-200 bg-amber-50/70",
    badgeClass: "bg-amber-100 text-amber-700",
  },
  opportunities: {
    title: "Opportunities",
    icon: Compass,
    cardClass: "border-sky-200 bg-sky-50/70",
    badgeClass: "bg-sky-100 text-sky-700",
  },
  threats: {
    title: "Threats",
    icon: Target,
    cardClass: "border-rose-200 bg-rose-50/70",
    badgeClass: "bg-rose-100 text-rose-700",
  },
};

const infoCards = [
  {
    title: "What this gives you",
    description:
      "A structured SWOT plus career direction, learning roadmap, and placement guidance based on your profile.",
    icon: Brain,
  },
  {
    title: "What we analyze",
    description:
      "Technical skills, projects, certifications, activities, experience, and inferred non-technical strengths.",
    icon: Lightbulb,
  },
  {
    title: "What to do next",
    description:
      "Use the output to sharpen your resume, select target roles, and close the most important learning gaps first.",
    icon: BriefcaseBusiness,
  },
];

function SummaryStat({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function SwotColumn({ sectionKey, items = [] }) {
  const tone = swotToneMap[sectionKey];
  const Icon = tone.icon;

  return (
    <section className={`rounded-[28px] border p-5 shadow-sm ${tone.cardClass}`}>
      <div className="flex items-center gap-3">
        <div className={`rounded-2xl p-3 ${tone.badgeClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">SWOT Lens</p>
          <h3 className="text-xl font-semibold text-slate-900">{tone.title}</h3>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {items.length ? (
          items.map((item, index) => (
            <div key={`${tone.title}-${index}`} className="rounded-2xl border border-white/70 bg-white/90 px-4 py-4">
              <p className="text-sm font-semibold text-slate-900">{item.title || tone.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail || "No detail available."}</p>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 px-4 py-6 text-sm text-slate-500">
            No items generated in this section yet.
          </div>
        )}
      </div>
    </section>
  );
}

function ActionListCard({ title, items, renderItem, icon: Icon }) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
      </div>

      <div className="mt-4 space-y-3">
        {items?.length ? (
          items.map((item, index) => (
            <div key={`${title}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              {renderItem(item)}
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            No recommendations available yet.
          </div>
        )}
      </div>
    </section>
  );
}

export default function SwotPage() {
  const [profile, setProfile] = useState(null);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const profileStats = useMemo(() => {
    const technicalCount =
      (profile?.skills?.languages?.length || 0) +
      (profile?.skills?.frameworks?.length || 0) +
      (profile?.skills?.tools?.length || 0);

    return {
      technicalCount,
      projectCount: profile?.projects?.length || 0,
      certificationCount: profile?.certifications?.length || 0,
      activityCount: profile?.activities?.length || 0,
    };
  }, [profile]);

  async function handleGenerate() {
    try {
      setErrorMessage("");
      setIsLoading(true);
      setResult(null);
      setIsPreparing(true);

      const studentProfile = await getStudentProfile("me");
      setProfile(studentProfile);
      setIsPreparing(false);

      const response = await generateStudentSwot();
      setResult(response);
    } catch (error) {
      setErrorMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to generate SWOT analysis right now.",
      );
    } finally {
      setIsLoading(false);
      setIsPreparing(false);
    }
  }

  const analysis = result?.analysis;

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-16">
      <section className="overflow-hidden rounded-[34px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,rgba(14,116,144,0.18),transparent_28%),linear-gradient(135deg,#0f172a_0%,#111827_48%,#164e63_100%)] px-6 py-7 text-white shadow-[0_24px_60px_rgba(15,23,42,0.18)] sm:px-7 sm:py-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">
              <Sparkles className="h-3.5 w-3.5" />
              AI SWOT Studio
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Turn your student profile into a focused career strategy
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-200">
              Get a practical SWOT analysis, suggested job roles, learning priorities, and placement guidance
              based on your real profile data. The result is designed to feel supportive, direct, and useful.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[360px]">
            <SummaryStat label="Technical Skills" value={profileStats.technicalCount} />
            <SummaryStat label="Projects" value={profileStats.projectCount} />
            <SummaryStat label="Certifications" value={profileStats.certificationCount} />
            <SummaryStat label="Activities" value={profileStats.activityCount} />
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_360px]">
        <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Start Here</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Do your SWOT in one click</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                We will read your summary, skills, projects, certifications, experience, and activities,
                then convert that into a career-ready report with strong next-step guidance.
              </p>
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={isLoading}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isPreparing ? "Preparing Profile..." : "Building SWOT..."}
                </>
              ) : (
                <>
                  Do My SWOT
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

          {errorMessage ? (
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm font-medium text-rose-700">
              {errorMessage}
            </div>
          ) : null}

          {analysis ? (
            <div className="mt-6 rounded-[28px] border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Career Snapshot</p>
                  <h3 className="mt-1 text-2xl font-semibold text-slate-900">{analysis.headline || "Your SWOT is ready"}</h3>
                  <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">{analysis.overview}</p>
                </div>
              </div>
            </div>
          ) : null}
        </section>

        <section className="grid gap-4">
          {infoCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="rounded-2xl bg-slate-100 p-3 text-slate-700 w-fit">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{card.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{card.description}</p>
              </div>
            );
          })}
        </section>
      </div>

      {analysis ? (
        <>
          <div className="grid gap-5 xl:grid-cols-2">
            <SwotColumn sectionKey="strengths" items={analysis.swot?.strengths || []} />
            <SwotColumn sectionKey="weaknesses" items={analysis.swot?.weaknesses || []} />
            <SwotColumn sectionKey="opportunities" items={analysis.swot?.opportunities || []} />
            <SwotColumn sectionKey="threats" items={analysis.swot?.threats || []} />
          </div>

          <div className="grid gap-5 xl:grid-cols-3">
            <ActionListCard
              title="Future Job Roles"
              items={analysis.futureRoles || []}
              icon={BriefcaseBusiness}
              renderItem={(item) => (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900">{item.role}</p>
                    <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
                      {item.fit || "Fit"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.reason}</p>
                </>
              )}
            />

            <ActionListCard
              title="Topics To Cover Next"
              items={analysis.nextTopics || []}
              icon={Lightbulb}
              renderItem={(item) => (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900">{item.topic}</p>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">
                      {item.priority || "Priority"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.reason}</p>
                </>
              )}
            />

            <ActionListCard
              title="Action Plan"
              items={analysis.actionPlan || []}
              icon={Target}
              renderItem={(item) => (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900">{item.step}</p>
                    <span className="rounded-full bg-sky-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-700">
                      {item.timeline || "Timeline"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
                </>
              )}
            />
          </div>

          <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                <Compass className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Mentor Guidance</p>
                <h3 className="text-2xl font-semibold text-slate-900">What to improve next</h3>
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Resume Advice</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{analysis.guidance?.resumeAdvice}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Interview Advice</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{analysis.guidance?.interviewAdvice}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Learning Advice</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{analysis.guidance?.learningAdvice}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Confidence Advice</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{analysis.guidance?.confidenceAdvice}</p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-cyan-200 bg-cyan-50 px-5 py-4">
              <p className="text-sm font-semibold text-cyan-900">Final Note</p>
              <p className="mt-2 text-sm leading-7 text-cyan-800">{analysis.encouragement}</p>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
