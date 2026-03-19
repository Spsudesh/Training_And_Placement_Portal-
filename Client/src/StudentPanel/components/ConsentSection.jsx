import { SaveButton, SectionCard } from "./FormUI";

function ConsentSection({ data, onConsentChange, onSave, isSaved }) {
  return (
    <SectionCard
      title="Consent Form"
      description="Review the declaration below and provide your consent before final submission."
      actions={<SaveButton onClick={onSave} saved={isSaved} label="Save Consent" />}
    >
      <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm leading-7 text-slate-700">
        I hereby confirm that the details provided in this student placement
        profile are true to the best of my knowledge. I understand that the
        Training and Placement Cell may use this information for internship and
        placement opportunities.
      </div>

      <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4">
        <input
          type="checkbox"
          checked={data.accepted}
          onChange={onConsentChange}
          className="mt-1 h-5 w-5 rounded border-slate-300 text-blue-900 focus:ring-blue-200"
        />
        <span className="text-sm text-slate-700">
          I agree to the above declaration and consent to the use of my details
          for placement-related processes.
        </span>
      </label>
    </SectionCard>
  );
}

export default ConsentSection;
