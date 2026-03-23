import { useState } from "react";
import { useNavigate } from "react-router-dom";

const credentials = {
  "2453011": { password: "2453011", panel: "student", route: "/student-panel" },
  "2453012": { password: "2453012", panel: "student", route: "/student-panel" },
  TPO: { password: "TPO", panel: "tpo", route: "/tpo-dashboard" },
  TPC: { password: "TPC", panel: "tpc", route: "/tpc-dashboard" },
};

function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    const normalizedUserId = userId.trim();
    const account = credentials[normalizedUserId];

    if (!account || account.password !== password.trim()) {
      setErrorMessage("Invalid dummy credentials. Please use the panel credentials provided.");
      return;
    }

    onLogin?.(account.panel);
    navigate(account.route, { replace: true });
  };

  return (
    <div className="flex min-h-screen items-start justify-center bg-slate-100 px-4 pt-20 text-center font-sans">
      <div className="w-full max-w-md">
        <p className="text-xs">K. E. Societys</p>

        <h2 className="mt-1 text-[22px] text-[#1a2db6]">
          Rajarambapu Institute of Technology.
        </h2>

        <img
          src="/rit_logo.jpeg"
          alt="RIT Logo"
          className="mx-auto my-2 w-[220px]"
        />

        <h2 className="mb-5 text-purple-700">Training and Placement System</h2>

        <div className="rounded bg-gray-200 shadow-md">
          <div className="border-b border-gray-400 bg-gray-300 py-1 pl-2 text-left">
            <p>Please Sign In</p>
          </div>

          <form className="p-3" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="User Id / PRN"
              value={userId}
              onChange={(event) => {
                setUserId(event.target.value);
                setErrorMessage("");
              }}
              className="mb-3 w-[90%] rounded border border-gray-300 p-2.5"
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setErrorMessage("");
              }}
              className="mb-3 w-[90%] rounded border border-gray-300 p-2.5"
            />

            {errorMessage ? (
              <p className="mb-3 text-left text-xs text-red-600">{errorMessage}</p>
            ) : null}

            <button
              type="submit"
              className="w-[97%] rounded bg-green-500 p-2.5 text-base text-white hover:bg-green-600"
            >
              Login
            </button>

            <div className="mt-4 rounded border border-dashed border-slate-300 bg-white/60 p-3 text-left text-xs text-slate-600">
              <p className="font-semibold text-slate-800">Dummy panel credentials</p>
              <p className="mt-1">Student: 2453011 / 2453011</p>
              <p className="mt-1">Student: 2453012 / 2453012</p>
              <p className="mt-1">TPO: TPO / TPO</p>
              <p className="mt-1">TPC: TPC / TPC</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
