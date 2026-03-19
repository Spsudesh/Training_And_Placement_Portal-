function StepIndicator({ steps, currentStep, completedSteps, onStepClick }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-5 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
      <div className="flex flex-wrap items-start gap-3 lg:flex-nowrap">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(index);
          const isActive = index === currentStep;

          return (
            <button
              key={step}
              type="button"
              onClick={() => onStepClick(index)}
              className={`min-w-[110px] flex-1 rounded-2xl border px-3 py-3 text-left transition ${
                isCompleted
                  ? "border-emerald-200 bg-emerald-50"
                  : isActive
                  ? "border-blue-200 bg-blue-50"
                  : "border-slate-200 bg-slate-50 hover:bg-slate-100"
              }`}
            >
              <div
                className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
                  isCompleted
                    ? "bg-emerald-600 text-white"
                    : isActive
                    ? "bg-blue-900 text-white"
                    : "bg-white text-slate-600"
                }`}
              >
                {isCompleted ? "OK" : index + 1}
              </div>

              <p className="mt-3 text-center text-xs font-medium text-slate-700">
                {step}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default StepIndicator;
