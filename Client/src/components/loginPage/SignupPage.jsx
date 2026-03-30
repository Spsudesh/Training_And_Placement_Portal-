import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signupUser } from "../../shared/authApi";

const roleOptions = [
  { id: "student", label: "Student" },
  { id: "tpc", label: "Faculty" },
];

function SignupPage() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState("student");
  const [prn, setPrn] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!prn.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setSuccessMessage("");
      setErrorMessage("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setSuccessMessage("");
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (!email.trim().toLowerCase().endsWith("@ritindia.edu")) {
      setSuccessMessage("");
      setErrorMessage("Only @ritindia.edu email addresses are allowed.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await signupUser({
        PRN: prn,
        email,
        password,
        role: selectedRole,
      });

      if (!response?.success) {
        setErrorMessage("Unable to create your account.");
        return;
      }

      setSuccessMessage("Signup successful. Redirecting to login...");

      window.setTimeout(() => {
        navigate("/login", { replace: true });
      }, 900);
    } catch (error) {
      setErrorMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to sign up right now.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f6fb] px-4 py-4 font-sans text-slate-900">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-xl items-center justify-center">
        <div className="w-full rounded-[28px] border border-[#dce6f3] bg-white px-6 py-5 shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:px-8">
          <img
            src="/rit_logo.jpeg"
            alt="RIT Logo"
            className="mx-auto h-20 w-auto object-contain"
          />

          <p className="mt-3 text-center text-[11px] font-semibold uppercase tracking-[0.38em] text-[#1a7d9b]">
            Rajarambapu Institute Of Technology
          </p>

          <h1 className="mt-3 text-center text-[1.8rem] font-bold leading-tight text-[#0f172a]">
            Training & Placement Portal
          </h1>

          <p className="mt-1.5 text-center text-sm text-slate-500">
            Secure access for students and faculty
          </p>

          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-3 block text-sm font-medium text-slate-700">Role</label>
              <div className="grid grid-cols-2 rounded-2xl bg-[#eef3fb] p-1.5">
                {roleOptions.map((role) => {
                  const isActive = selectedRole === role.id;

                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => {
                        setSelectedRole(role.id);
                        setErrorMessage("");
                        setSuccessMessage("");
                      }}
                      className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                        isActive
                          ? "bg-white text-slate-900 shadow-[0_6px_18px_rgba(148,163,184,0.28)]"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {role.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label htmlFor="signup-prn" className="mb-2 block text-sm font-medium text-slate-700">
                PRN
              </label>
              <input
                id="signup-prn"
                type="text"
                placeholder="Enter your PRN"
                value={prn}
                onChange={(event) => {
                  setPrn(event.target.value);
                  setErrorMessage("");
                  setSuccessMessage("");
                }}
                className="h-12 w-full rounded-2xl border border-[#d9e2ef] px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#0f172a] focus:ring-4 focus:ring-slate-200/60"
              />
            </div>

            <div>
              <label htmlFor="signup-email" className="mb-2 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="signup-email"
                type="email"
                placeholder="Enter your @ritindia.edu email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setErrorMessage("");
                  setSuccessMessage("");
                }}
                className="h-12 w-full rounded-2xl border border-[#d9e2ef] px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#0f172a] focus:ring-4 focus:ring-slate-200/60"
              />
            </div>

            <div>
              <label htmlFor="signup-password" className="mb-2 block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="flex h-12 items-center rounded-2xl border border-[#d9e2ef] pr-3 focus-within:border-[#0f172a] focus-within:ring-4 focus-within:ring-slate-200/60">
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setErrorMessage("");
                    setSuccessMessage("");
                  }}
                  className="h-full w-full rounded-2xl border-0 bg-transparent px-4 text-sm outline-none placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="text-sm font-medium text-slate-500 transition hover:text-slate-800"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="signup-confirm-password" className="mb-2 block text-sm font-medium text-slate-700">
                Confirm Password
              </label>
              <div className="flex h-12 items-center rounded-2xl border border-[#d9e2ef] pr-3 focus-within:border-[#0f172a] focus-within:ring-4 focus-within:ring-slate-200/60">
                <input
                  id="signup-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);
                    setErrorMessage("");
                    setSuccessMessage("");
                  }}
                  className="h-full w-full rounded-2xl border-0 bg-transparent px-4 text-sm outline-none placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  className="text-sm font-medium text-slate-500 transition hover:text-slate-800"
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {errorMessage ? (
              <p className="text-sm font-medium text-red-600">{errorMessage}</p>
            ) : null}

            {successMessage ? (
              <p className="text-sm font-medium text-emerald-600">{successMessage}</p>
            ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="h-12 w-full rounded-2xl bg-[#060a1f] text-sm font-semibold text-white shadow-[0_14px_30px_rgba(6,10,31,0.22)] transition hover:bg-[#0d1433]"
              >
              {isSubmitting ? "Creating account..." : "Sign up"}
              </button>
          </form>

          <p className="mt-4 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-[#0b7ca0] hover:text-[#075f7a]">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;
