import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  BriefcaseBusiness,
  ExternalLink,
  FileCheck2,
  FileText,
  FolderKanban,
  Grip,
  HelpCircle,
  LayoutList,
  Loader2,
  ShieldCheck,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { generateAtsResume, getAtsResumeHistory } from '../services/atsResumeApi';
import { getStudentProfile } from '../../profile/services/studentProfileApi';

const SECTION_CATALOG = [
  { key: 'summary', title: 'Profile Summary', description: 'A short introduction that gives recruiters quick context.', type: 'static', icon: FileText, accent: 'from-sky-500/20 via-cyan-500/10 to-transparent' },
  { key: 'education', title: 'Education', description: 'Academic background, degree details, and key scores.', type: 'static', icon: ShieldCheck, accent: 'from-emerald-500/20 via-teal-500/10 to-transparent' },
  { key: 'experience', title: 'Experience', description: 'Internships and practical work experience to highlight impact.', type: 'items', icon: BriefcaseBusiness, accent: 'from-orange-500/20 via-amber-500/10 to-transparent' },
  { key: 'projects', title: 'Projects', description: 'Selected project work that best supports your application.', type: 'items', icon: FolderKanban, accent: 'from-violet-500/20 via-fuchsia-500/10 to-transparent' },
  { key: 'skills', title: 'Technical Skills', description: 'Languages, frameworks, tools, and technical strengths.', type: 'static', icon: Sparkles, accent: 'from-blue-500/20 via-indigo-500/10 to-transparent' },
  { key: 'certifications', title: 'Certifications', description: 'Certifications and validated learning credentials.', type: 'items', icon: FileCheck2, accent: 'from-rose-500/20 via-pink-500/10 to-transparent' },
  { key: 'activities', title: 'Activities', description: 'Leadership, volunteering, clubs, and extracurricular work.', type: 'items', icon: Trophy, accent: 'from-yellow-500/20 via-lime-500/10 to-transparent' },
];

const DEFAULT_SECTION_ORDER = SECTION_CATALOG.map((section) => section.key);

function normalizeHistory(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  return [];
}

function getItemId(item, keys) {
  for (const key of keys) {
    const value = item?.[key];
    if (value !== null && value !== undefined && value !== '') return value;
  }
  return null;
}

function resolveFileUrl(url) {
  const value = String(url || '').trim();
  if (!value) return '';
  if (/^https?:\/\//i.test(value) || value.startsWith('blob:')) return value;
  return `http://localhost:3000${value.startsWith('/') ? value : `/${value}`}`;
}

function hasMeaningfulText(value) {
  return String(value || '').trim().length > 0;
}

function hasEducationDetails(profile) {
  return Boolean(
    profile?.department ||
      profile?.currentCgpa ||
      profile?.passingYear ||
      profile?.education?.tenth?.year ||
      profile?.education?.twelfth?.year ||
      profile?.education?.diploma?.year,
  );
}

function hasSkills(profile) {
  return Boolean(
    profile?.skills?.languages?.length ||
      profile?.skills?.frameworks?.length ||
      profile?.skills?.tools?.length ||
      profile?.skills?.otherLanguages?.length,
  );
}

function buildSelectableItems(profile) {
  return {
    projects: (profile?.projects || []).map((item) => ({
      id: getItemId(item, ['id', 'projectNumber']),
      title: item.title || 'Untitled Project',
      subtitle: item.techStack || 'Project',
      description: item.description || 'No project description added yet.',
    })),
    experience: (profile?.experience || []).map((item) => ({
      id: getItemId(item, ['id', 'expNumber']),
      title: item.role || item.type || 'Experience',
      subtitle: item.companyName || '',
      description: item.duration || item.description || 'No experience description added yet.',
    })),
    certifications: (profile?.certifications || []).map((item) => ({
      id: getItemId(item, ['id', 'certNumber']),
      title: item.name || 'Certification',
      subtitle: item.platform || '',
      description: item.link || 'Certificate link not added.',
    })),
    activities: (profile?.activities || []).map((item) => ({
      id: getItemId(item, ['id', 'actNumber']),
      title: item.title || 'Activity',
      subtitle: item.link || '',
      description: item.description || 'No activity description added yet.',
    })),
  };
}

function buildInitialSectionOrder(profile, selectableItems) {
  return DEFAULT_SECTION_ORDER.filter((sectionKey) => {
    if (sectionKey === 'summary') return hasMeaningfulText(profile?.summary);
    if (sectionKey === 'education') return hasEducationDetails(profile);
    if (sectionKey === 'skills') return hasSkills(profile);
    return Boolean(selectableItems[sectionKey]?.length);
  });
}

function ItemSelectionCarousel({ section, items, selectedIds, onToggle }) {
  const Icon = section.icon;

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={`rounded-2xl bg-gradient-to-br ${section.accent} p-3 text-slate-900 ring-1 ring-slate-200`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{section.title}</h3>
            <p className="mt-1 text-sm text-slate-500">{section.description}</p>
          </div>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          {selectedIds.length}/{items.length} selected
        </div>
      </div>

      {items.length ? (
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
          {items.map((item) => {
            const isSelected = item.id !== null && selectedIds.includes(item.id);

            return (
              <button
                key={item.id ?? item.title}
                type="button"
                onClick={() => item.id !== null && onToggle(section.key, item.id)}
                className={`min-w-[260px] snap-start rounded-[24px] border p-4 text-left transition ${
                  isSelected
                    ? 'border-slate-900 bg-slate-900 text-white shadow-[0_18px_40px_rgba(15,23,42,0.22)]'
                    : 'border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300 hover:bg-white'
                }`}
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold">{item.title}</p>
                    <p className={`mt-1 text-sm ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                      {item.subtitle || ' '}
                    </p>
                  </div>
                  <div className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md border text-[11px] font-bold ${isSelected ? 'border-white/30 bg-white/15 text-white' : 'border-slate-300 bg-white text-slate-500'}`}>
                    {isSelected ? '✓' : ''}
                  </div>
                </div>
                <p className={`line-clamp-4 text-sm leading-6 ${isSelected ? 'text-slate-200' : 'text-slate-600'}`}>
                  {item.description}
                </p>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
          No entries available in this section yet.
        </div>
      )}
    </section>
  );
}

function SectionOrderPanel({ sections, sectionOrder, onToggleSection, onMoveSection }) {
  const selectedSections = sections.filter((section) => sectionOrder.includes(section.key));

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
      <div className="mb-5 flex items-start gap-3">
        <div className="rounded-2xl bg-slate-900 p-3 text-white">
          <LayoutList className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Choose Sections and Sequence</h3>
          <p className="mt-1 text-sm text-slate-500">
            Select the sections you want, then move them up or down to decide the final resume flow.
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {sections.map((section) => {
          const Icon = section.icon;
          const isSelected = sectionOrder.includes(section.key);

          return (
            <label
              key={section.key}
              className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${isSelected ? 'border-slate-900 bg-slate-900 text-white shadow-[0_18px_30px_rgba(15,23,42,0.18)]' : 'border-slate-200 bg-slate-50 text-slate-900 hover:bg-white'}`}
            >
              <input type="checkbox" checked={isSelected} onChange={() => onToggleSection(section.key)} className="mt-1 h-4 w-4 rounded border-slate-300" />
              <div className="flex min-w-0 items-start gap-3">
                <div className={`rounded-xl p-2 ${isSelected ? 'bg-white/10' : 'bg-white'}`}>
                  <Icon className={`h-4 w-4 ${isSelected ? 'text-white' : 'text-slate-700'}`} />
                </div>
                <div>
                  <p className="font-semibold">{section.title}</p>
                  <p className={`mt-1 text-sm ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>{section.description}</p>
                </div>
              </div>
            </label>
          );
        })}
      </div>

      <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Grip className="h-4 w-4" />
          Final resume section order
        </div>

        {selectedSections.length ? (
          <div className="space-y-3">
            {selectedSections.map((section, index) => (
              <div key={section.key} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{section.title}</p>
                    <p className="text-xs text-slate-500">{section.key}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => onMoveSection(section.key, -1)} disabled={index === 0} className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40" aria-label={`Move ${section.title} up`}>
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => onMoveSection(section.key, 1)} disabled={index === selectedSections.length - 1} className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40" aria-label={`Move ${section.title} down`}>
                    <ArrowDown className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Select at least one section to create the final resume structure.</p>
        )}
      </div>
    </section>
  );
}

export default function AtsResumePage() {
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [resumeTitle, setResumeTitle] = useState('');
  const [selections, setSelections] = useState({
    projects: [],
    experience: [],
    certifications: [],
    activities: [],
  });
  const [sectionOrder, setSectionOrder] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        setErrorMessage('');
        const [profData, histData] = await Promise.all([getStudentProfile('me'), getAtsResumeHistory()]);
        const selectableItems = buildSelectableItems(profData);

        setProfile(profData);
        setHistory(normalizeHistory(histData));
        setSelections({
          projects: selectableItems.projects.map((item) => item.id).filter((item) => item !== null),
          experience: selectableItems.experience.map((item) => item.id).filter((item) => item !== null),
          certifications: selectableItems.certifications.map((item) => item.id).filter((item) => item !== null),
          activities: selectableItems.activities.map((item) => item.id).filter((item) => item !== null),
        });
        setSectionOrder(buildInitialSectionOrder(profData, selectableItems));
        setResumeTitle(
          profData?.fullName ? `${profData.fullName} ATS Resume` : `${profData?.prn || 'Student'} ATS Resume`,
        );
      } catch (err) {
        console.error(err);
        setErrorMessage(
          err?.response?.data?.message ||
            err?.response?.data?.error ||
            err?.message ||
            'Failed to load ATS resume builder.',
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const selectableItems = useMemo(() => buildSelectableItems(profile), [profile]);
  const availableSections = useMemo(
    () =>
      SECTION_CATALOG.filter((section) => {
        if (section.key === 'summary') return hasMeaningfulText(profile?.summary);
        if (section.key === 'education') return hasEducationDetails(profile);
        if (section.key === 'skills') return hasSkills(profile);
        return Boolean(selectableItems[section.key]?.length);
      }),
    [profile, selectableItems],
  );

  const selectedSectionCount = sectionOrder.length;
  const selectedItemCount =
    selections.projects.length +
    selections.experience.length +
    selections.certifications.length +
    selections.activities.length;

  const handleToggleItem = (categoryId, id) => {
    setSelections((prev) => {
      const current = prev[categoryId];
      if (current.includes(id)) return { ...prev, [categoryId]: current.filter((item) => item !== id) };
      return { ...prev, [categoryId]: [...current, id] };
    });
  };

  const handleToggleSection = (sectionKey) => {
    setSectionOrder((current) => {
      if (current.includes(sectionKey)) return current.filter((key) => key !== sectionKey);
      return [...current, sectionKey];
    });
  };

  const handleMoveSection = (sectionKey, direction) => {
    setSectionOrder((current) => {
      const currentIndex = current.indexOf(sectionKey);
      if (currentIndex === -1) return current;

      const nextIndex = currentIndex + direction;
      if (nextIndex < 0 || nextIndex >= current.length) return current;

      const nextOrder = [...current];
      [nextOrder[currentIndex], nextOrder[nextIndex]] = [nextOrder[nextIndex], nextOrder[currentIndex]];
      return nextOrder;
    });
  };

  const onGenerate = async () => {
    if (!sectionOrder.length) {
      alert('Select at least one resume section before generating the ATS resume.');
      return;
    }

    setGenerating(true);
    try {
      const data = await generateAtsResume({
        templateCode: 'ats_standard',
        resumeTitle,
        sectionOrder,
        selectedProjects: selections.projects,
        selectedExperience: selections.experience,
        selectedCertifications: selections.certifications,
        selectedActivities: selections.activities,
      });

      const newHistory = await getAtsResumeHistory();
      setHistory(normalizeHistory(newHistory));

      const fileUrl = resolveFileUrl(data?.fileUrl);
      if (fileUrl) window.open(fileUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to generate ATS resume.';
      alert(message);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-8 shadow-sm">
        <p className="text-lg font-semibold text-red-700">Unable to load ATS resume builder</p>
        <p className="mt-2 text-sm text-red-600">{errorMessage}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl pb-20">
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_35%),linear-gradient(135deg,#ffffff_0%,#f8fafc_45%,#e2e8f0_100%)] p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:p-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
              <Sparkles className="h-3.5 w-3.5" />
              ATS Resume Builder
            </div>
            <h1 className="mt-5 max-w-3xl text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Build a cleaner, recruiter-ready ATS resume with section control and custom ordering.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              Choose the strongest entries, decide which sections should appear, set the sequence,
              and generate a strict PDF that follows your final structure.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white/85 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Selected Sections</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{selectedSectionCount}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/85 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Selected Entries</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{selectedItemCount}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/85 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Output</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">ATS PDF</p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-[0_14px_30px_rgba(15,23,42,0.06)]">
            <label className="block">
              <span className="text-sm font-semibold text-slate-800">Resume title</span>
              <input type="text" value={resumeTitle} onChange={(event) => setResumeTitle(event.target.value)} placeholder="My ATS Resume" className="mt-3 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-200" />
            </label>

            <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <HelpCircle className="mt-0.5 h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-semibold text-amber-900">No visual preview here by design</p>
                  <p className="mt-1 text-sm leading-6 text-amber-800">
                    The builder compiles directly to the ATS-friendly PDF so the file matches what
                    recruiters and parsing systems actually receive.
                  </p>
                </div>
              </div>
            </div>

            <button type="button" onClick={onGenerate} disabled={generating} className="mt-5 flex h-12 w-full items-center justify-center rounded-2xl bg-slate-950 px-6 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(15,23,42,0.18)] transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
              {generating ? 'Generating ATS Resume...' : 'Generate Final Resume'}
            </button>
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
        <div className="space-y-6">
          {SECTION_CATALOG.filter((section) => section.type === 'items').map((section) => (
            <ItemSelectionCarousel key={section.key} section={section} items={selectableItems[section.key] || []} selectedIds={selections[section.key] || []} onToggle={handleToggleItem} />
          ))}
        </div>

        <div className="space-y-6">
          <SectionOrderPanel sections={availableSections} sectionOrder={sectionOrder} onToggleSection={handleToggleSection} onMoveSection={handleMoveSection} />

          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
            <h3 className="text-lg font-semibold text-slate-900">Recent ATS Resumes</h3>
            <p className="mt-1 text-sm text-slate-500">Open your latest generated versions directly from here.</p>

            {history.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                No ATS resumes generated yet.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {history.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div>
                      <p className="font-semibold text-slate-900">{item.resume_title || 'ATS Resume'}</p>
                      <p className="text-xs text-slate-500">{new Date(item.created_at).toLocaleString()}</p>
                    </div>
                    <a href={resolveFileUrl(item.file_url)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100">
                      View PDF
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
