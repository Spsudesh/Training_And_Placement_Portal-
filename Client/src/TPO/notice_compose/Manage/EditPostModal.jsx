import ComposePage from "../Compose/ComposePage";

export default function EditPostModal({
  post,
  formData,
  onClose,
  onTypeChange,
  onFieldChange,
  onFileChange,
  onRemoveFile,
  onPublish,
  isSaving,
}) {
  if (!post) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 sm:p-6">
      <div className="w-full max-w-5xl py-4">
        <ComposePage
          formData={formData}
          editMode
          onTypeChange={onTypeChange}
          onFieldChange={onFieldChange}
          onFileChange={onFileChange}
          onRemoveFile={onRemoveFile}
          onPublish={onPublish}
          onCancelEdit={onClose}
          isSaving={isSaving}
          title="Edit Post"
          description="Update the selected notice in the same compose format and save when ready."
        />
      </div>
    </div>
  );
}
