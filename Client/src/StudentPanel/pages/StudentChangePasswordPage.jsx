import { useState } from "react";
import { KeyRound, LockKeyhole } from "lucide-react";
import { changeStudentPassword } from "../../shared/authApi";

export default function StudentChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!currentPassword.trim() || !newPassword.trim() || !confirmNewPassword.trim()) {
      setSuccessMessage("");
      setErrorMessage("Please fill in all 3 password fields.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setSuccessMessage("");
      setErrorMessage("New password and confirm password do not match.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await changeStudentPassword({
        currentPassword,
        newPassword,
        confirmNewPassword,
      });

      if (!response?.success) {
        setErrorMessage("Unable to update password right now.");
        return;
      }

      setSuccessMessage(response.message || "Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (error) {
      setSuccessMessage("");
      setErrorMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to update password right now.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.08)] sm:p-7">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Change Password</h2>
          </div>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Current Password</span>
              <div className="flex h-12 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4">
                <LockKeyhole className="h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(event) => {
                    setCurrentPassword(event.target.value);
                    setErrorMessage("");
                    setSuccessMessage("");
                  }}
                  placeholder="Enter current password"
                  className="h-full w-full bg-transparent px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">New Password</span>
              <div className="flex h-12 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4">
                <LockKeyhole className="h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => {
                    setNewPassword(event.target.value);
                    setErrorMessage("");
                    setSuccessMessage("");
                  }}
                  placeholder="Enter new password"
                  className="h-full w-full bg-transparent px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Confirm New Password</span>
              <div className="flex h-12 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4">
                <LockKeyhole className="h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(event) => {
                    setConfirmNewPassword(event.target.value);
                    setErrorMessage("");
                    setSuccessMessage("");
                  }}
                  placeholder="Confirm new password"
                  className="h-full w-full bg-transparent px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>
            </label>
          </div>

          {errorMessage ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {errorMessage}
            </div>
          ) : null}

          {successMessage ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {successMessage}
            </div>
          ) : null}

          <div className="flex justify-end border-t border-slate-200 pt-5">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-950 px-6 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Updating Password..." : "Update Password"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
