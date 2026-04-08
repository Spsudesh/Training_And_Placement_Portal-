import VerifyField from "./VerifyField";

export default function VerifySection({
  section,
  verifiedFields,
  isProfileVerified,
  onVerifyField,
}) {
  const sectionLabel =
    section.id === "education" ? "Verification Section" : "Profile Section";
  const hasVerifiableFields = section.fields.some((field) => field.verifiable);
  
  // Group fields that should be on the same row
  const groupedFields = [];
  let currentGroup = [];
  
  section.fields.forEach((field) => {
    if (field.rowLayout === "half") {
      currentGroup.push(field);
      if (currentGroup.length === 2) {
        groupedFields.push(currentGroup);
        currentGroup = [];
      }
    } else {
      if (currentGroup.length > 0) {
        groupedFields.push(currentGroup);
        currentGroup = [];
      }
      groupedFields.push([field]);
    }
  });
  
  if (currentGroup.length > 0) {
    groupedFields.push(currentGroup);
  }

  const sectionGridClass = section.id === "projects"
    ? "grid gap-4"
    : hasVerifiableFields
    ? "grid gap-4"
    : "grid gap-3 sm:grid-cols-2 xl:grid-cols-3";

  return (
    <section className="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-200/60">
      <div className="mb-5 flex flex-col gap-2 border-b border-slate-100 pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-blue-600">
          {sectionLabel}
        </p>
        <h3 className="text-xl font-semibold text-slate-900">{section.title}</h3>
        <p className="text-sm text-slate-500">{section.description}</p>
      </div>

      <div className="space-y-4">
        {groupedFields.map((group, groupIndex) => (
          <div 
            key={groupIndex}
            className={group.length > 1 ? "grid grid-cols-1 gap-4 sm:grid-cols-2" : ""}
          >
            {group.map((field) => (
              <VerifyField
                key={field.id}
                field={field}
                isVerified={Boolean(verifiedFields[field.id])}
                isProfileVerified={isProfileVerified}
                onVerify={onVerifyField}
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
