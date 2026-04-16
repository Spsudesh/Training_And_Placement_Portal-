import { useEffect, useMemo, useState } from 'react';
import {
  BriefcaseBusiness,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileCheck2,
  FileText,
  FolderKanban,
  LayoutList,
  Loader2,
  ShieldCheck,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { generateAtsResume, getAtsResumeHistory } from '../services/atsResumeApi';
import { getStudentProfile } from '../../profile/services/studentProfileApi';

const SECTION_CATALOG = [
  {
    key: 'summary',
    title: 'Profile Summary',
    description: 'Short introduction from your profile.',
    type: 'static',
    icon: FileText,
  },
  {
    key: 'education',
    title: 'Education',
    description: 'College and academic details.',
    type: 'static',
    icon: ShieldCheck,
  },
  {
    key: 'projects',
    title: 'Projects',
    description: 'Pick the projects to show first.',
    type: 'items',
    icon: FolderKanban,
  },
  {
    key: 'experience',
    title: 'Experience',
    description: 'Internships and work experience.',
    type: 'items',
    icon: BriefcaseBusiness,
  },
  {
    key: 'skills',
    title: 'Technical Skills',
    description: 'Languages, frameworks, and tools.',
    type: 'static',
    icon: Sparkles,
  },
  {
    key: 'certifications',
    title: 'Certifications',
    description: 'Certificates and courses.',
    type: 'items',
    icon: FileCheck2,
  },
  {
    key: 'activities',
    title: 'Activities',
    description: 'Clubs, volunteering, and leadership.',
    type: 'items',
    icon: Trophy,
  },
];

const ITEM_STEPS = ['projects', 'experience', 'certifications', 'activities'];
const WIZARD_STEPS = [...ITEM_STEPS, 'finalize'];

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

function getAvailableSections(profile, selectableItems, selections) {
  return SECTION_CATALOG.filter((section) => {
    if (section.key === 'summary') return hasMeaningfulText(profile?.summary);
    if (section.key === 'education') return hasEducationDetails(profile);
    if (section.key === 'skills') return hasSkills(profile);
    return Boolean((selectableItems[section.key] || []).length && (selections[section.key] || []).length);
  });
}

function buildInitialSectionOrder(profile, selectableItems, selections) {
  return getAvailableSections(profile, selectableItems, selections).map((section) => section.key);
}

function formatSectionSummary(sectionKey, selections) {
  const count = selections[sectionKey]?.length || 0;
  if (count === 0) return 'Nothing selected yet';
  if (count === 1) return '1 item selected';
  return `${count} items selected`;
}

function StepBadge({ index, active, done, label }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
          active
            ? 'bg-slate-900 text-white'
            : done
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-slate-100 text-slate-500'
        }`}
      >
        {done ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
      </div>
      <span className={`text-sm font-medium ${active ? 'text-slate-900' : 'text-slate-500'}`}>{label}</span>
    </div>
  );
}

function SelectionCard({ item, selected, onToggle }) {
  return (
    <label
      className={`block min-h-[210px] min-w-[280px] max-w-[320px] flex-shrink-0 cursor-pointer rounded-2xl border px-4 py-3 transition ${
        selected
          ? 'border-emerald-300 bg-white text-slate-900'
          : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="line-clamp-2 text-sm font-semibold">{item.title}</p>
              {item.subtitle ? (
                <p className="mt-1 line-clamp-2 text-xs text-slate-500">{item.subtitle}</p>
              ) : null}
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                selected ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {selected ? 'Selected' : 'Select'}
            </span>
          </div>
          <p className="mt-2 line-clamp-5 text-sm leading-6 text-slate-600">{item.description}</p>
        </div>
      </div>
    </label>
  );
}

function ItemStepPanel({ section, items, selectedIds, onToggle }) {
  const Icon = section.icon;

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-slate-100 p-3.5 text-slate-700">
            <Icon className="h-5 w-5" />
          </div>
          <div className="py-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Step Selection</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900">{section.title}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">{section.description}</p>
          </div>
        </div>
        <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">
          {selectedIds.length} selected
        </div>
      </div>

      <div className="mt-5 mb-3">
        {items.length ? (
          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
            {items.map((item) => (
              <div key={item.id ?? item.title} className="snap-start">
                <SelectionCard
                  item={item}
                  selected={item.id !== null && selectedIds.includes(item.id)}
                  onToggle={() => item.id !== null && onToggle(section.key, item.id)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            No entries found in this section yet.
          </div>
        )}
      </div>
    </section>
  );
}

function FinalizePanel({
  profile,
  resumeTitle,
  onResumeTitleChange,
  availableSections,
  sectionOrder,
  onToggleSection,
  includeProfilePhoto,
  onIncludeProfilePhotoChange,
  generating,
  onGenerate,
  selections,
}) {
  const selectedSections = SECTION_CATALOG.filter((section) => sectionOrder.includes(section.key));

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
          <LayoutList className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Final Step</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">Review and generate</h2>
          <p className="mt-2 text-sm text-slate-500">
            Choose which sections should appear in the resume and then generate the final ATS PDF.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <label className="block">
            <span className="text-sm font-semibold text-slate-800">Resume title</span>
            <input
              type="text"
              value={resumeTitle}
              onChange={(event) => onResumeTitleChange(event.target.value)}
              placeholder="My ATS Resume"
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
            />
          </label>

          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Camera className="h-4 w-4 text-slate-700" />
              <p className="text-sm font-semibold text-slate-900">Profile photo</p>
            </div>
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <input
                type="checkbox"
                checked={includeProfilePhoto}
                onChange={(event) => onIncludeProfilePhotoChange(event.target.checked)}
                disabled={!profile?.profilePhotoUrl}
                className="mt-1 h-4 w-4 rounded border-slate-300"
              />
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {profile?.profilePhotoUrl ? 'Include my profile photo in resume' : 'No profile photo available'}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {profile?.profilePhotoUrl
                    ? 'Turn this off if you want a cleaner text-only ATS header.'
                    : 'Add a profile photo in your profile if you want this option later.'}
                </p>
              </div>
            </label>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="text-sm font-semibold text-slate-900">Sections to include</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {SECTION_CATALOG.map((section) => {
                const Icon = section.icon;
                const isAvailable = availableSections.some((item) => item.key === section.key);
                const checked = sectionOrder.includes(section.key);

                return (
                  <label
                    key={section.key}
                    className={`flex items-start gap-3 rounded-2xl border px-4 py-3 ${
                      isAvailable ? 'cursor-pointer border-slate-200 bg-white' : 'border-slate-200 bg-slate-50 opacity-60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={!isAvailable}
                      onChange={() => onToggleSection(section.key)}
                      className="mt-1 h-4 w-4 rounded border-slate-300"
                    />
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="rounded-xl bg-slate-100 p-2 text-slate-700">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{section.title}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {section.type === 'items' ? formatSectionSummary(section.key, selections) : section.description}
                        </p>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Final resume flow</p>
            <div className="mt-3 space-y-2">
              {selectedSections.length ? (
                selectedSections.map((section, index) => (
                  <div key={section.key} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{section.title}</p>
                      <p className="text-xs text-slate-500">{section.description}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">Select at least one section to generate the resume.</p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onGenerate}
            disabled={generating || !sectionOrder.length}
            className="flex h-12 w-full items-center justify-center rounded-2xl bg-slate-950 px-6 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {generating ? 'Generating ATS Resume...' : 'Generate Final Resume'}
          </button>
        </div>
      </div>
    </section>
  );
}

function GenerationOverlay({ status }) {
  if (!status) {
    return null;
  }

  const isDone = status === 'done';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-[28px] border border-white/60 bg-white/90 px-6 py-7 text-center shadow-[0_24px_90px_rgba(15,23,42,0.22)]">
        <div
          className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
            isDone ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-700'
          }`}
        >
          {isDone ? <CheckCircle2 className="h-8 w-8" /> : <Loader2 className="h-8 w-8 animate-spin" />}
        </div>
        <h2 className="mt-5 text-2xl font-semibold text-slate-950">
          {isDone ? 'Resume Ready' : 'Resume Is In Process'}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {isDone
            ? 'Done. Opening your generated ATS resume now.'
            : 'Please wait while we generate and prepare your resume.'}
        </p>
      </div>
    </div>
  );
}

export default function AtsResumePage() {
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [resumeTitle, setResumeTitle] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [includeProfilePhoto, setIncludeProfilePhoto] = useState(false);
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
        const initialSelections = {
          projects: [],
          experience: [],
          certifications: [],
          activities: [],
        };

        setProfile(profData);
        setHistory(normalizeHistory(histData));
        setSelections(initialSelections);
        setSectionOrder(buildInitialSectionOrder(profData, selectableItems, initialSelections));
        setResumeTitle(
          profData?.fullName ? `${profData.fullName} ATS Resume` : `${profData?.prn || 'Student'} ATS Resume`,
        );
        setIncludeProfilePhoto(Boolean(profData?.profilePhotoUrl));
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
    () => getAvailableSections(profile, selectableItems, selections),
    [profile, selectableItems, selections],
  );
  const selectedStepKey = WIZARD_STEPS[currentStep];
  const selectedStepSection = SECTION_CATALOG.find((section) => section.key === selectedStepKey);
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
      const catalogOrder = SECTION_CATALOG.map((section) => section.key);
      const next = [...current, sectionKey];
      return next.sort((a, b) => catalogOrder.indexOf(a) - catalogOrder.indexOf(b));
    });
  };

  const goNext = () => {
    setCurrentStep((value) => Math.min(value + 1, WIZARD_STEPS.length - 1));
  };

  const goBack = () => {
    setCurrentStep((value) => Math.max(value - 1, 0));
  };

  const onGenerate = async () => {
    if (!sectionOrder.length) {
      alert('Select at least one resume section before generating the ATS resume.');
      return;
    }

    const resumeWindow = window.open('', '_blank');
    setGenerating(true);
    setGenerationStatus('processing');
    try {
      const data = await generateAtsResume({
        templateCode: 'ats_standard',
        resumeTitle,
        sectionOrder,
        includeProfilePhoto,
        selectedProjects: selections.projects,
        selectedExperience: selections.experience,
        selectedCertifications: selections.certifications,
        selectedActivities: selections.activities,
      });

      const newHistory = await getAtsResumeHistory();
      setHistory(normalizeHistory(newHistory));

      const fileUrl = resolveFileUrl(data?.fileUrl);
      setGenerationStatus('done');

      window.setTimeout(() => {
        if (fileUrl) {
          if (resumeWindow && !resumeWindow.closed) {
            resumeWindow.location.href = fileUrl;
          } else {
            window.open(fileUrl, '_blank', 'noopener,noreferrer');
          }
        } else if (resumeWindow && !resumeWindow.closed) {
          resumeWindow.close();
        }

        setGenerationStatus('');
      }, 700);
    } catch (err) {
      if (resumeWindow && !resumeWindow.closed) {
        resumeWindow.close();
      }

      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to generate ATS resume.';
      alert(message);
      setGenerationStatus('');
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
    <>
    <div className="mx-auto max-w-6xl pb-16">
      <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
              <Sparkles className="h-3.5 w-3.5" />
              ATS Resume Builder
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
              Simple step-by-step resume builder
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Choose items section by section, review the final section list, decide on profile photo,
              and generate a clean professional ATS resume.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[340px] lg:grid-cols-1 xl:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Step</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{currentStep + 1}/{WIZARD_STEPS.length}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Entries</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{selectedItemCount}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Sections</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{sectionOrder.length}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-5">
          {WIZARD_STEPS.map((stepKey, index) => (
            <StepBadge
              key={stepKey}
              index={index}
              active={index === currentStep}
              done={index < currentStep}
              label={stepKey === 'finalize' ? 'Finalize' : SECTION_CATALOG.find((section) => section.key === stepKey)?.title}
            />
          ))}
        </div>
      </section>

      <div className="mt-6">
        {selectedStepKey === 'finalize' ? (
          <FinalizePanel
            profile={profile}
            resumeTitle={resumeTitle}
            onResumeTitleChange={setResumeTitle}
            availableSections={availableSections}
            sectionOrder={sectionOrder}
            onToggleSection={handleToggleSection}
            includeProfilePhoto={includeProfilePhoto}
            onIncludeProfilePhotoChange={setIncludeProfilePhoto}
            generating={generating}
            onGenerate={onGenerate}
            selections={selections}
          />
        ) : (
          <ItemStepPanel
            section={selectedStepSection}
            items={selectableItems[selectedStepKey] || []}
            selectedIds={selections[selectedStepKey] || []}
            onToggle={handleToggleItem}
          />
        )}
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={goBack}
          disabled={currentStep === 0}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>

        <p className="text-sm text-slate-500">
          {selectedStepKey === 'finalize'
            ? 'Review your section choices and generate the final resume.'
            : 'Keep the flow simple: finish this section and move to the next one.'}
        </p>

        <button
          type="button"
          onClick={goNext}
          disabled={currentStep === WIZARD_STEPS.length - 1}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <section className="mt-8 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h3 className="text-lg font-semibold text-slate-900">Recent ATS Resumes</h3>
        <p className="mt-1 text-sm text-slate-500">Open your latest generated versions directly from here.</p>

        {history.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
            No ATS resumes generated yet.
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            {history.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-900">{item.resume_title || 'ATS Resume'}</p>
                  <p className="text-xs text-slate-500">{new Date(item.created_at).toLocaleString()}</p>
                </div>
                <a
                  href={resolveFileUrl(item.file_url)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 self-start rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  View PDF
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
    <GenerationOverlay status={generationStatus} />
    </>
  );
}
