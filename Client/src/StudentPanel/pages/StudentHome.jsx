const opportunityFeed = [
  {
    id: 1,
    badge: "JP",
    badgeStyle: "from-emerald-300 via-teal-300 to-cyan-300",
    title: "Open for applications - JP Morgan Chase Internship Program",
    author: "Placement Cell",
    postedAt: "2 hours ago",
    summary:
      "Applications are now open for the summer internship track for final-year and pre-final-year students interested in software engineering and analytics roles.",
    eligibility: "B.E. Computer, IT, E&TC | CGPA 7.0+ | No active backlogs",
    process: "Online assessment, technical interview, HR interview",
    deadline: "March 28, 2026 - 11:59 PM",
    tone: "Open Now",
  },
  {
    id: 2,
    badge: "LT",
    badgeStyle: "from-orange-300 via-amber-300 to-yellow-300",
    title: "Deadline updated - L&T Technology Services Graduate Hiring",
    author: "Training Office",
    postedAt: "Today",
    summary:
      "The application window has been extended for eligible engineering branches. Students who have not completed registration can still apply before the revised deadline.",
    eligibility: "Mechanical, Electrical, Electronics, Computer | 60% throughout",
    process: "Aptitude test, technical screening, final discussion",
    deadline: "March 25, 2026 - 05:00 PM",
    tone: "Deadline Changed",
  },
  {
    id: 3,
    badge: "IN",
    badgeStyle: "from-blue-300 via-indigo-300 to-violet-300",
    title: "Internship opportunity - Product Design and Frontend Support",
    author: "Career Desk",
    postedAt: "1 day ago",
    summary:
      "A startup partner is looking for students who can support UI design systems, React component development, and product documentation during a 10-week internship.",
    eligibility: "Open to all branches with frontend project experience",
    process: "Portfolio review, assignment, founder interaction",
    deadline: "April 02, 2026 - 06:00 PM",
    tone: "Internship",
  },
  {
    id: 4,
    badge: "AC",
    badgeStyle: "from-pink-300 via-rose-300 to-red-300",
    title: "Assessment window live - Accenture Coding Round Preparation Slot",
    author: "Campus Drive Team",
    postedAt: "2 days ago",
    summary:
      "The preparation assessment for the upcoming Accenture drive is now live. Students are advised to complete it early to avoid last-hour traffic and submission issues.",
    eligibility: "All shortlisted students for the Accenture pool",
    process: "Mock coding round, practice analytics, performance review",
    deadline: "March 23, 2026 - 09:00 PM",
    tone: "Assessment Live",
  },
  {
    id: 5,
    badge: "MS",
    badgeStyle: "from-sky-300 via-cyan-300 to-teal-300",
    title: "New opportunity - Microsoft Learn Student Ambassador Cohort",
    author: "Opportunity Desk",
    postedAt: "3 days ago",
    summary:
      "Students interested in technical communities, workshops, and campus leadership can apply for the ambassador program and represent learning initiatives across campus.",
    eligibility: "Strong communication skills and active technical participation",
    process: "Application review, statement of interest, final selection",
    deadline: "April 05, 2026 - 08:00 PM",
    tone: "Leadership",
  },
  {
    id: 6,
    badge: "TS",
    badgeStyle: "from-fuchsia-300 via-purple-300 to-indigo-300",
    title: "Internship batch announced - Tata Technologies Industry Project",
    author: "Internship Cell",
    postedAt: "4 days ago",
    summary:
      "A new industry project batch has been announced for students interested in CAD support, embedded systems assistance, and software validation tasks.",
    eligibility: "Mechanical, Electronics, E&TC, Computer | Minimum 6.5 CGPA",
    process: "Resume screening, mentor round, project allocation",
    deadline: "March 30, 2026 - 04:00 PM",
    tone: "New Batch",
  },
];

function StudentHome() {
  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-[90rem] space-y-6">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-blue-950 via-blue-900 to-cyan-800 px-6 py-8 text-white shadow-[0_20px_50px_rgba(15,23,42,0.18)]">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-100/80">
            Student Panel
          </p>
          <h1 className="mt-3 text-3xl font-bold">Welcome to Training And PLacement Portal</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-blue-100/90">
            Your initial profile submission is complete. You can now explore the
            full student panel, track opportunities, and continue improving your
            placement profile from here.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
            <p className="text-sm font-semibold text-slate-500">Profile Status</p>
            <p className="mt-3 text-2xl font-bold text-emerald-600">Submitted</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Your onboarding form has been completed successfully.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
            <p className="text-sm font-semibold text-slate-500">Next Step</p>
            <p className="mt-3 text-2xl font-bold text-slate-900">Explore Panel</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Use the sidebar to access interviews, assessments, resume tools,
              and other student features.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
            <p className="text-sm font-semibold text-slate-500">Profile Updates</p>
            <p className="mt-3 text-2xl font-bold text-slate-900">Available Later</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              After onboarding, profile improvements and updates can be managed
              from the full panel experience.
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                Opportunity Feed
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">
                Latest placement and internship updates
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Stay updated with active hiring windows, internship announcements,
                assessment notices, and important placement deadlines.
              </p>
            </div>
            <div className="rounded-2xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
              {opportunityFeed.length} active updates
            </div>
          </div>

          <div className="mt-6 space-y-5">
            {opportunityFeed.map((item) => (
              <article
                key={item.id}
                className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)]"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex gap-4">
                    <div
                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${item.badgeStyle} text-lg font-bold text-slate-800`}
                    >
                      {item.badge}
                    </div>

                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-xl font-bold leading-snug text-slate-900">
                          {item.title}
                        </h3>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">
                          {item.tone}
                        </span>
                      </div>

                      <p className="text-sm text-slate-500">
                        {item.author} · {item.postedAt}
                      </p>

                      <p className="max-w-4xl text-sm leading-7 text-slate-600">
                        {item.summary}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Eligibility
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {item.eligibility}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Hiring Process
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {item.process}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Deadline
                    </p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">
                      {item.deadline}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentHome;
