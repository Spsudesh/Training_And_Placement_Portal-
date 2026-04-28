import AnnouncementForm from "./AnnouncementForm";
import InternshipForm from "./InternshipForm";
import JobForm from "./JobForm";
import PostTypeSelector from "./PostTypeSelector";

function GmailLogo(props) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" {...props}>
      <path fill="#EA4335" d="M24 24.5 6 11v26h8V21.5l10 7.5 10-7.5V37h8V11z" />
      <path fill="#FBBC04" d="M14 37V19l-8-8v26z" />
      <path fill="#34A853" d="M34 37V19l8-8v26z" />
      <path fill="#4285F4" d="M6 11l18 13.5L42 11l-3-3H9z" />
    </svg>
  );
}

function WhatsAppLogo(props) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" {...props}>
      <path
        fill="#25D366"
        d="M19.1 17.4c-.3-.2-1.7-.9-1.9-1s-.5-.2-.7.2-.8 1-1 1.2-.4.2-.7.1c-2-.9-3.3-2.9-3.4-3.1s0-.4.1-.6l.5-.6c.2-.2.2-.4.3-.6s0-.4 0-.6-.7-1.7-.9-2.4c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4s-1.1 1.1-1.1 2.6 1.1 3 1.3 3.2 2.2 3.4 5.4 4.8c.8.3 1.4.5 1.9.7.8.2 1.5.2 2.1.1.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.3.1-1.4s-.3-.2-.6-.4Z"
      />
      <path
        fill="#25D366"
        d="M27.3 4.6A15.2 15.2 0 0 0 3.4 23.1L2 30l7.1-1.9A15.2 15.2 0 1 0 27.3 4.6ZM16 28a12 12 0 0 1-6.1-1.7l-.4-.2-4.2 1.1 1.1-4.1-.3-.4A12 12 0 1 1 16 28Z"
      />
      <path
        fill="#FFF"
        d="M25.9 6.1A13.8 13.8 0 0 0 4.3 22.7l.2.3-1.4 5.1 5.2-1.4.3.2A13.8 13.8 0 1 0 25.9 6.1Zm-9.9 20a12 12 0 0 1-6.1-1.7l-.4-.2-4.2 1.1 1.1-4.1-.3-.4A12 12 0 1 1 16 26.1Z"
      />
    </svg>
  );
}

function ActionButton({
  onClick,
  disabled,
  className,
  icon,
  label,
  subtitle,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group inline-flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{label}</span>
        <span className="block text-xs opacity-80">{subtitle}</span>
      </span>
    </button>
  );
}

export default function ComposePage({
  formData,
  editMode,
  onTypeChange,
  onFieldChange,
  onFileChange,
  onRemoveFile,
  onPublish,
  onMail,
  onWhatsapp,
  onCancelEdit,
  isSaving = false,
  isMailing = false,
  actionStatus = {},
  actionMessages = [],
  totalPosts = 0,
  title = "Create Post",
  description = "Choose a post type and fill only the fields needed for that format.",
}) {
  const isAnnouncement = formData.type === "announcement";
  const isPlacement = formData.type === "placement";
  const hasSelection = Boolean(formData.type);
  const hasActionMessages = actionMessages.length > 0;

  return (
    <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-700">
            Notice Composer
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">{title}</h2>
          <p className="mt-2 max-w-4xl text-sm text-slate-500">{description}</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch lg:justify-end">
          <div className="min-w-[140px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Total Posts
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-950">{totalPosts}</p>
          </div>

          {editMode ? (
            <div className="max-w-sm rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700">
              Edit mode is active. Update the selected post or cancel to close this window.
            </div>
          ) : null}
        </div>
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
                disabled={isSaving || actionStatus.post}
                className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-lg"
              >
                {actionStatus.post ? "Posted" : isSaving ? "Saving..." : editMode ? "Update" : "Post"}
              </button>
              <ActionButton
                onClick={onMail}
                disabled={isSaving || isMailing || actionStatus.mail}
                className="border-sky-200 bg-gradient-to-br from-sky-50 via-white to-blue-50 text-sky-800 hover:bg-sky-100 hover:shadow-lg"
                icon={<GmailLogo className="h-6 w-6" />}
                label={actionStatus.mail ? "Mail Sent" : isMailing ? "Sending Mail..." : "Post Mail"}
                subtitle="Send to student inboxes"
              />
              <ActionButton
                onClick={onWhatsapp}
                disabled={isSaving || actionStatus.whatsapp}
                className="border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-green-50 text-emerald-800 hover:bg-emerald-100 hover:shadow-lg"
                icon={<WhatsAppLogo className="h-6 w-6" />}
                label={actionStatus.whatsapp ? "WhatsApp Ready" : "Post WhatsApp"}
                subtitle="Copy message for group sharing"
              />
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

            {hasActionMessages ? (
              <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1 text-sm text-emerald-800">
                  {actionMessages.map((message) => (
                    <p key={message}>{message}</p>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={onCancelEdit}
                  className="w-fit rounded-2xl border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                >
                  Close
                </button>
              </div>
            ) : null}
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
