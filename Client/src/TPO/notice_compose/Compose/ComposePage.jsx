import AnnouncementForm from "./AnnouncementForm";
import InternshipForm from "./InternshipForm";
import JobForm from "./JobForm";
import PostTypeSelector from "./PostTypeSelector";

export default function ComposePage({
  formData,
  editMode,
  onTypeChange,
  onFieldChange,
  onFileChange,
  onRemoveFile,
  onPublish,
  onCancelEdit,
  isSaving = false,
  title = "Create Post",
  description = "Choose a post type and fill only the fields needed for that format.",
}) {
  const isAnnouncement = formData.type === "announcement";
  const isPlacement = formData.type === "placement";
  const hasSelection = Boolean(formData.type);

  return (
    <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-700">
            Notice Composer
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">{title}</h2>
          <p className="mt-2 text-sm text-slate-500">{description}</p>
        </div>

        {editMode ? (
          <div className="rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700">
            Edit mode is active. Update the selected post or cancel to close this window.
          </div>
        ) : null}
      </div>

      <div className="mt-6 space-y-5">
        <PostTypeSelector value={formData.type} onChange={onTypeChange} />

        {hasSelection ? (
          <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60 sm:p-6">
            {isAnnouncement ? (
              <AnnouncementForm
                formData={formData}
                onFieldChange={onFieldChange}
                onFileChange={onFileChange}
                onRemoveFile={onRemoveFile}
              />
            ) : null}

            {isPlacement ? (
              <JobForm
                formData={formData}
                onFieldChange={onFieldChange}
                onFileChange={onFileChange}
                onRemoveFile={onRemoveFile}
              />
            ) : null}

            {!isAnnouncement && !isPlacement ? (
              <InternshipForm
                formData={formData}
                onFieldChange={onFieldChange}
                onFileChange={onFileChange}
                onRemoveFile={onRemoveFile}
              />
            ) : null}

            <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-200 pt-5">
              <button
                type="button"
                onClick={onPublish}
                disabled={isSaving}
                className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-lg"
              >
                {isSaving ? "Saving..." : editMode ? "Update" : "Post"}
              </button>
              {editMode ? (
                <button
                  type="button"
                  onClick={onCancelEdit}
                  className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 transition hover:-translate-y-0.5 hover:bg-rose-100"
                >
                  Cancel Edit
                </button>
              ) : null}
            </div>
          </section>
        ) : (
          <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
            <p className="text-base font-semibold text-slate-800">
              No form selected yet
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Click Announcement, Internship Opportunity, or Placement Opportunity to open the respective form.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
