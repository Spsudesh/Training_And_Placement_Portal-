import { useState, useEffect } from 'react';
import { generateAtsResume, getAtsResumeHistory } from '../services/atsResumeApi';
import { getStudentProfile } from '../../profile/services/studentProfileApi';
import { ExternalLink, HelpCircle, Loader2 } from 'lucide-react';

function normalizeHistory(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (Array.isArray(value?.data)) {
    return value.data;
  }

  return [];
}

function getItemId(item, keys) {
  for (const key of keys) {
    const value = item?.[key];

    if (value !== null && value !== undefined && value !== '') {
      return value;
    }
  }

  return null;
}

function resolveFileUrl(url) {
  const value = String(url || '').trim();

  if (!value) {
    return '';
  }

  if (/^https?:\/\//i.test(value) || value.startsWith('blob:')) {
    return value;
  }

  return `http://localhost:3000${value.startsWith('/') ? value : `/${value}`}`;
}

export default function AtsResumePage() {
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Selections
  const [selections, setSelections] = useState({
    projects: [],
    experience: [],
    certifications: [],
    activities: [],
  });

  useEffect(() => {
    async function load() {
      try {
        const [profData, histData] = await Promise.all([
          getStudentProfile('me'),
          getAtsResumeHistory()
        ]);
        setProfile(profData);
        setHistory(normalizeHistory(histData));
      } catch(err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleToggle = (categoryId, id) => {
    setSelections(prev => {
      const current = prev[categoryId];
      if (current.includes(id)) {
        return { ...prev, [categoryId]: current.filter(i => i !== id) };
      } else {
        return { ...prev, [categoryId]: [...current, id] };
      }
    });
  };

  const onGenerate = async () => {
    setGenerating(true);
    try {
      const data = await generateAtsResume({
        templateCode: 'ats_standard',
        selectedProjects: selections.projects,
        selectedExperience: selections.experience,
        selectedCertifications: selections.certifications,
        selectedActivities: selections.activities,
      });
      // reload history
      const newHist = await getAtsResumeHistory();
      setHistory(normalizeHistory(newHist));
      // open pdf
      const fileUrl = resolveFileUrl(data?.fileUrl);

      if (fileUrl) {
        window.open(fileUrl, "_blank", "noopener,noreferrer");
      }
    } catch(err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to generate ATS resume.";
      alert(message);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-blue-600 h-8 w-8" /></div>;

  return (
    <div className="mx-auto max-w-4xl pb-20">
      <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50/50 p-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ATS Resume Builder</h1>
          <p className="mt-1 text-sm text-slate-500">
            Strict linear algorithms convert your selected items into a 100% Applicant Tracking System compliant PDF.
          </p>
        </div>
        <button
          onClick={onGenerate}
          disabled={generating}
          className="flex h-11 items-center justify-center rounded-xl bg-blue-600 px-6 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
        >
          {generating ? 'Compiling ATS Matrix...' : 'Generate ATS Resume'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 border-b pb-3 mb-4">Select Content to Include</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-slate-700 mb-2">Projects</h3>
                {profile?.projects?.map(p => {
                  const projectId = getItemId(p, ['id', 'projectNumber']);

                  return (
                  <label key={projectId ?? p.title} className="flex items-center gap-2 mb-2 p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
                    <input type="checkbox" checked={projectId !== null && selections.projects.includes(projectId)} onChange={() => projectId !== null && handleToggle('projects', projectId)} className="rounded border-slate-300" />
                    <span className="text-sm">{p.title}</span>
                  </label>
                  );
                })}
              </div>

              <div>
                <h3 className="font-semibold text-slate-700 mb-2">Experience</h3>
                {profile?.experience?.map(e => {
                  const experienceId = getItemId(e, ['id', 'expNumber']);

                  return (
                  <label key={experienceId ?? `${e.role}-${e.companyName}`} className="flex items-center gap-2 mb-2 p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
                    <input type="checkbox" checked={experienceId !== null && selections.experience.includes(experienceId)} onChange={() => experienceId !== null && handleToggle('experience', experienceId)} className="rounded border-slate-300" />
                    <span className="text-sm">{e.role} at {e.companyName}</span>
                  </label>
                  );
                })}
              </div>

              <div>
                <h3 className="font-semibold text-slate-700 mb-2">Certifications</h3>
                {profile?.certifications?.length ? profile.certifications.map(c => {
                  const certificationId = getItemId(c, ['id', 'certNumber']);

                  return (
                  <label key={certificationId ?? c.name} className="flex items-center gap-2 mb-2 p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
                    <input type="checkbox" checked={certificationId !== null && selections.certifications.includes(certificationId)} onChange={() => certificationId !== null && handleToggle('certifications', certificationId)} className="rounded border-slate-300" />
                    <span className="text-sm">{c.name}{c.platform ? ` - ${c.platform}` : ""}</span>
                  </label>
                  );
                }) : (
                  <p className="text-sm text-slate-500">No certifications added yet.</p>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-slate-700 mb-2">Extracurricular Activities</h3>
                {profile?.activities?.length ? profile.activities.map(a => {
                  const activityId = getItemId(a, ['id', 'actNumber']);

                  return (
                  <label key={activityId ?? a.title} className="flex items-center gap-2 mb-2 p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
                    <input type="checkbox" checked={activityId !== null && selections.activities.includes(activityId)} onChange={() => activityId !== null && handleToggle('activities', activityId)} className="rounded border-slate-300" />
                    <span className="text-sm">{a.title}</span>
                  </label>
                  );
                }) : (
                  <p className="text-sm text-slate-500">No extracurricular activities added yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 border-b pb-3 mb-4">Your Recent ATS Resumes</h2>
            
            {history.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">No ATS resumes generated yet.</p>
            ) : (
              <div className="space-y-3">
                {history.slice(0,5).map(h => (
                  <div key={h.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3 bg-slate-50 hover:bg-slate-100 transition">
                    <span className="text-sm font-medium text-slate-700">{new Date(h.created_at).toLocaleDateString()}</span>
                    <a href={resolveFileUrl(h.file_url)} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
                      View PDF <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-6 flex flex-col items-center text-center">
            <HelpCircle className="h-8 w-8 text-amber-500 mb-3" />
            <h3 className="font-semibold text-amber-900 mb-1">Why doesn't this have a preview?</h3>
            <p className="text-xs text-amber-700 leading-relaxed">
              True ATS resumes are visually strict and linear. To prevent formatting mismatches between HTML and PDFs, we compile your file directly to an industry-grade PDF. Click generate to view exactly what recruiters see!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
