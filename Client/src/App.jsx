import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import "./index.css";
import { continueUserSession, logoutUser } from "./shared/authApi";
import {
  AUTH_SESSION_EVENT,
  getAuthenticatedUser,
  getRefreshTokenExpiresAt,
  hasActiveSession,
} from "./shared/authSession";
import LoginPage from "./components/loginPage/LoginPage";
import SignupPage from "./components/loginPage/SignupPage";
import Overview from "./TPO/pages/Overview";
import Dashboard from "./TPO/pages/Dashboard";
import Placements from "./TPO/pages/Placements";
import TPCManagement from "./TPO/pages/TPCManagement";
import ApplicantsPage from "./TPO/application_tracking/pages/ApplicantsPage";
import TpoSidebar from "./TPO/pages/Tpo_sidebar";
import TpcDashboard from "./TPC/pages/Dashboard";
import TpcSidebar from "./TPC/pages/Tpc_sidebar";
import JobProfiles from "./StudentPanel/pages/JobProfiles";
import StudentHome from "./StudentPanel/pages/StudentHome";
import StudentChangePasswordPage from "./StudentPanel/pages/StudentChangePasswordPage";
import StudentProfilePage from "./StudentPanel/profile/pages/StudentProfilePage";
import StudentResumePage from "./StudentPanel/resume/pages/StudentResumePage";
import StudentResumePreviewPage from "./StudentPanel/resume/pages/StudentResumePreviewPage";
import AtsResumePage from "./StudentPanel/ats-resume/pages/AtsResumePage";
import SwotPage from "./StudentPanel/swot/pages/SwotPage";
import StudentSidebar from "./StudentPanel/pages/Student_sidebar";
import ProfileForm from "./StudentPanel/pages/ProfileForm";
import StudentDetailsPage from "./TPC_Panel/student_verification/pages/StudentDetailsPage";
import StudentListPage from "./TPC_Panel/student_verification/pages/StudentListPage";
import { getStudentVerificationRecords } from "./TPC_Panel/student_verification/services/studentVerificationApi";
import TpoStudentDetailsPage from "./TPO_Panel/student_management/pages/StudentDetailsPage";
import TpoStudentListPage from "./TPO_Panel/student_management/pages/StudentListPage";
import { getStudentProfileProgress } from "./StudentPanel/services/studentFormApi";
import {
  getTpoStudentManagementRecord,
  getTpoStudentManagementRecords,
} from "./TPO_Panel/student_management/services/studentManagementApi";

const AUTH_STORAGE_KEY = "training-placement-active-panel";
const STUDENT_ID_STORAGE_KEY = "training-placement-active-student";
const ACTIVE_USER_EMAIL_STORAGE_KEY = "training-placement-active-user-email";
const REFRESH_WARNING_WINDOW_MS = 2 * 60 * 1000;
const LEGACY_BROWSER_CACHE_KEYS = [
  "training-placement-student-form-status",
  "student-panel-onboarding-complete-v2",
  "training-placement-demo-form-progress",
  "training-placement-student-section-verification",
  "training-placement-student-profile-verified",
];

function getActivePanel() {
  return window.localStorage.getItem(AUTH_STORAGE_KEY);
}

function setActivePanel(panel) {
  window.localStorage.setItem(AUTH_STORAGE_KEY, panel);
}

function setActiveStudentId(studentId) {
  if (!studentId) {
    return;
  }

  window.localStorage.setItem(STUDENT_ID_STORAGE_KEY, studentId);
}

function clearActiveStudentId() {
  window.localStorage.removeItem(STUDENT_ID_STORAGE_KEY);
}

function setActiveUserEmail(email) {
  if (!email) {
    return;
  }

  window.localStorage.setItem(ACTIVE_USER_EMAIL_STORAGE_KEY, email);
}

function clearActiveUserEmail() {
  window.localStorage.removeItem(ACTIVE_USER_EMAIL_STORAGE_KEY);
}

function getActiveStudentId() {
  return window.localStorage.getItem(STUDENT_ID_STORAGE_KEY);
}

function hasStudentCompletedFinalSubmission(progressData) {
  return Boolean(progressData?.is_completed || progressData?.consent_completed);
}

function clearActivePanel() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

function clearClientSessionState() {
  clearActivePanel();
  clearActiveStudentId();
  clearActiveUserEmail();
}

function clearLegacyStudentBrowserCache() {
  LEGACY_BROWSER_CACHE_KEYS.forEach((storageKey) => {
    window.localStorage.removeItem(storageKey);
  });
}

function normalizeDepartment(value) {
  return String(value || "").trim().toLowerCase();
}

function ProtectedRoute({ allowedPanel, children }) {
  const activePanel = getActivePanel();

  if (!hasActiveSession() || activePanel !== allowedPanel) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function DirectStudentEntry() {
  return <Navigate to="/login" replace />;
}

function StudentPlaceholderPage({ title, description }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
        Student Panel
      </p>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">{title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

function getStudentPageTitle(pathname) {
  if (pathname === "/student-panel" || pathname === "/student-panel/") {
    return "Home";
  }

  if (pathname.startsWith("/student-panel/jobs")) { 
    return "Job Profiles";
  }

  if (pathname.startsWith("/student-panel/profile")) {
    return "My Profile";
  }

  if (pathname.startsWith("/student-panel/change-password")) {
    return "Change Password";
  }

  if (pathname.startsWith("/student-panel/profile-form")) {
    return "Profile Form";
  }

  if (pathname.startsWith("/student-panel/interviews")) {
    return "Interviews";
  }

  if (pathname.startsWith("/student-panel/assessments")) {
    return "Assessments";
  }

  if (pathname.startsWith("/student-panel/resume")) {
    return "Resume";
  }

  if (pathname.startsWith("/student-panel/swot")) {
    return "SWOT";
  }

  return "Student Panel";
}

function StudentApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const authenticatedUser = getAuthenticatedUser();
  const storedStudentId = getActiveStudentId();
  const [, setActiveStudentIdState] = useState(
    String(authenticatedUser?.PRN || storedStudentId || "").trim(),
  );
  const [hasSubmittedProfileForm, setHasSubmittedProfileForm] = useState(
    Boolean(authenticatedUser?.isProfileFormSubmitted),
  );
  const [isCheckingSubmissionStatus, setIsCheckingSubmissionStatus] = useState(true);
  const isProfileFormRoute = location.pathname.startsWith("/student-panel/profile-form");

  useEffect(() => {
    let isMounted = true;

    async function syncSubmissionStatus() {
      setIsCheckingSubmissionStatus(true);

      try {
        const resolvedStudentId = String(authenticatedUser?.PRN || storedStudentId || "").trim();

        if (!resolvedStudentId) {
          if (isMounted) {
            setActiveStudentIdState("");
            setHasSubmittedProfileForm(false);
          }
          return;
        }

        setActiveStudentId(resolvedStudentId);

        if (isMounted) {
          setActiveStudentIdState(resolvedStudentId);
        }

        const progressData = await getStudentProfileProgress(resolvedStudentId).catch(() => null);

        if (!isMounted) {
          return;
        }

        setHasSubmittedProfileForm(
          progressData === null
            ? Boolean(authenticatedUser?.isProfileFormSubmitted)
            : hasStudentCompletedFinalSubmission(progressData),
        );
      } finally {
        if (isMounted) {
          setIsCheckingSubmissionStatus(false);
        }
      }
    }

    syncSubmissionStatus();

    return () => {
      isMounted = false;
    };
  }, [authenticatedUser?.PRN, authenticatedUser?.isProfileFormSubmitted, storedStudentId]);

  const handleLogout = () => {
    logoutUser().finally(() => {
      clearClientSessionState();
      navigate("/login", { replace: true });
    });
  };

  return (
    <StudentSidebar
      pageTitle={getStudentPageTitle(location.pathname)}
      showSidebar={!isProfileFormRoute}
      onLogout={handleLogout}
    >
      {isCheckingSubmissionStatus ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
            Student Panel
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Checking profile status</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            We are verifying your final profile submission before opening the student panel.
          </p>
        </div>
      ) : (
      <Routes>
        <Route
          index
          element={
            hasSubmittedProfileForm ? (
              <StudentHome />
            ) : (
              <Navigate to="/student-panel/profile-form" replace />
            )
          }
        />
        <Route
          path="jobs"
          element={
            hasSubmittedProfileForm ? (
              <JobProfiles />
            ) : (
              <Navigate to="/student-panel/profile-form" replace />
            )
          }
        />
        <Route
          path="profile"
          element={
            hasSubmittedProfileForm ? (
              <StudentProfilePage />
            ) : (
              <Navigate to="/student-panel/profile-form" replace />
            )
          }
        />
        <Route
          path="change-password"
          element={
            hasSubmittedProfileForm ? (
              <StudentChangePasswordPage />
            ) : (
              <Navigate to="/student-panel/profile-form" replace />
            )
          }
        />
        <Route
          path="profile-form"
          element={
            hasSubmittedProfileForm ? (
              <Navigate to="/student-panel" replace />
            ) : (
              <ProfileForm
                initialStep={authenticatedUser?.profileFormNextStep}
                onComplete={() => {
                  setHasSubmittedProfileForm(true);
                  navigate("/student-panel", { replace: true });
                }}
              />
            )
          }
        />
        <Route
          path="interviews"
          element={
            hasSubmittedProfileForm ? (
              <StudentPlaceholderPage
                title="Interviews"
                description="Interview tracking will be added here once the student interview workflow is connected."
              />
            ) : (
              <Navigate to="/student-panel/profile-form" replace />
            )
          }
        />
        <Route
          path="assessments"
          element={
            hasSubmittedProfileForm ? (
              <StudentPlaceholderPage
                title="Assessments"
                description="Assessment schedules and results will appear here after this module is enabled."
              />
            ) : (
              <Navigate to="/student-panel/profile-form" replace />
            )
          }
        />
        <Route
          path="ats-resume"
          element={
            hasSubmittedProfileForm ? (
              <AtsResumePage />
            ) : (
              <Navigate to="/student-panel/profile-form" replace />
            )
          }
        />
        <Route
          path="swot"
          element={
            hasSubmittedProfileForm ? (
              <SwotPage />
            ) : (
              <Navigate to="/student-panel/profile-form" replace />
            )
          }
        />

        <Route
          path="resume"
          element={
            hasSubmittedProfileForm ? (
              <StudentResumePage />
            ) : (
              <Navigate to="/student-panel/profile-form" replace />
            )
          }
        />
        <Route
          path="resume/:resumeId/preview"
          element={
            hasSubmittedProfileForm ? (
              <StudentResumePreviewPage />
            ) : (
              <Navigate to="/student-panel/profile-form" replace />
            )
          }
        />
        <Route
          path="*"
          element={
            <Navigate
              to={hasSubmittedProfileForm ? "/student-panel" : "/student-panel/profile-form"}
              replace
            />
          }
        />
      </Routes>
      )}
    </StudentSidebar>
  );
}

function TpoOverviewApp() {
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser().finally(() => {
      clearClientSessionState();
      navigate("/login", { replace: true });
    });
  };

  return <Overview onLogout={handleLogout} />;
}

function TpoNoticeBoardApp() {
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser().finally(() => {
      clearClientSessionState();
      navigate("/login", { replace: true });
    });
  };

  return <Dashboard onLogout={handleLogout} />;
}

function TpcNoticeBoardApp() {
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser().finally(() => {
      clearClientSessionState();
      navigate("/login", { replace: true });
    });
  };

  return (
    <Dashboard
      onLogout={handleLogout}
      panelScope="tpc"
      pageTitle="Notice Compose Center"
    />
  );
}

function TpoPlacementsApp() {
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser().finally(() => {
      clearClientSessionState();
      navigate("/login", { replace: true });
    });
  };

  return <Placements onLogout={handleLogout} />;
}

function TpcPlacementsApp() {
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser().finally(() => {
      clearClientSessionState();
      navigate("/login", { replace: true });
    });
  };

  return (
    <Placements
      onLogout={handleLogout}
      panelScope="tpc"
      pageTitle="Opportunity Management"
    />
  );
}

function TpoApplicationTrackingApp() {
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser().finally(() => {
      clearClientSessionState();
      navigate("/login", { replace: true });
    });
  };

  return (
    <TpoSidebar pageTitle="Application Tracking" onLogout={handleLogout}>
      <ApplicantsPage />
    </TpoSidebar>
  );
}

function TpcApplicationTrackingApp() {
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser().finally(() => {
      clearClientSessionState();
      navigate("/login", { replace: true });
    });
  };

  return (
    <TpcSidebar pageTitle="Application Tracking" onLogout={handleLogout}>
      <ApplicantsPage panelScope="tpc" />
    </TpcSidebar>
  );
}

function TpoStudentsApp() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [studentsError, setStudentsError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadStudents() {
      try {
        setIsLoadingStudents(true);
        setStudentsError("");
        const records = await getTpoStudentManagementRecords();

        if (isMounted) {
          setStudents(records);
        }
      } catch (error) {
        if (isMounted) {
          setStudents([]);
          setStudentsError(
            error?.response?.data?.message ||
              error?.response?.data?.error ||
              error?.message ||
              "Failed to fetch TPO student management records.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingStudents(false);
        }
      }
    }

    loadStudents();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = () => {
    logoutUser().finally(() => {
      clearClientSessionState();
      navigate("/login", { replace: true });
    });
  };

  return (
    <TpoSidebar pageTitle="Student Management" onLogout={handleLogout}>
      <Routes>
        <Route
          index
          element={
            <TpoStudentListPage
              students={students}
              isLoading={isLoadingStudents}
              errorMessage={studentsError}
              setStudents={setStudents}
              setSelectedStudent={setSelectedStudent}
            />
          }
        />
        <Route
          path=":prn"
          element={
            <TpoStudentDetailsPage
              students={students}
              isLoading={isLoadingStudents}
              errorMessage={studentsError}
              getStudentRecord={getTpoStudentManagementRecord}
              selectedStudent={selectedStudent}
              setSelectedStudent={setSelectedStudent}
            />
          }
        />
        <Route path="*" element={<Navigate to="/tpo-dashboard/students" replace />} />
      </Routes>
    </TpoSidebar>
  );
}

function TpoTPCManagementApp() {
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser().finally(() => {
      clearClientSessionState();
      navigate("/login", { replace: true });
    });
  };

  return <TPCManagement onLogout={handleLogout} />;
}

function TpcApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const authenticatedUser = getAuthenticatedUser();
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [studentsError, setStudentsError] = useState("");

  const handleLogout = () => {
    logoutUser().finally(() => {
      clearClientSessionState();
      navigate("/login", { replace: true });
    });
  };

  const isStudentVerificationRoute = location.pathname.startsWith(
    "/tpc-dashboard/student-verification",
  );

  useEffect(() => {
    let isMounted = true;

    async function loadStudents() {
      try {
        setIsLoadingStudents(true);
        setStudentsError("");
        const records = await getStudentVerificationRecords();
        const filteredRecords = records.filter(
          (student) =>
            normalizeDepartment(student?.department) ===
            normalizeDepartment(authenticatedUser?.department),
        );

        if (isMounted) {
          setStudents(filteredRecords);
        }
      } catch (error) {
        if (isMounted) {
          setStudents([]);
          setStudentsError(
            error?.response?.data?.message ||
              error?.response?.data?.error ||
              error?.message ||
              "Failed to fetch student verification records.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingStudents(false);
        }
      }
    }

    loadStudents();

    return () => {
      isMounted = false;
    };
  }, [authenticatedUser?.department]);

  return (
    <TpcSidebar
      pageTitle={isStudentVerificationRoute ? "Student Verification" : "TPC Dashboard"}
      onLogout={handleLogout}
    >
      <Routes>
        <Route index element={<TpcDashboard />} />
        <Route
          path="student-verification"
          element={
            <StudentListPage
              students={students}
              tpcDepartment={authenticatedUser?.department || ""}
              isLoading={isLoadingStudents}
              errorMessage={studentsError}
              setSelectedStudent={setSelectedStudent}
            />
          }
        />
        <Route
          path="student-verification/:prn"
          element={
            <StudentDetailsPage
              students={students}
              isLoading={isLoadingStudents}
              errorMessage={studentsError}
              selectedStudent={selectedStudent}
              setSelectedStudent={setSelectedStudent}
              setStudents={setStudents}
            />
          }
        />
        <Route path="*" element={<Navigate to="/tpc-dashboard" replace />} />
      </Routes>
    </TpcSidebar>
  );
}

function SessionExpiryModal({ isOpen, onContinue, onLogout, isRefreshing }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">
          Session Expiring
        </p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900">Continue your session?</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Your refresh session will expire in under 2 minutes. Choose continue to stay signed in,
          or logout to end the session now.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onLogout}
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Logout
          </button>
          <button
            type="button"
            onClick={onContinue}
            disabled={isRefreshing}
            className="rounded-xl bg-blue-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:opacity-70"
          >
            {isRefreshing ? "Continuing..." : "Continue Session"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSessionPromptOpen, setIsSessionPromptOpen] = useState(false);
  const [isRefreshingSession, setIsRefreshingSession] = useState(false);

  useEffect(() => {
    clearLegacyStudentBrowserCache();
  }, []);

  useEffect(() => {
    let warningTimeoutId;
    let expiryTimeoutId;

    function syncSessionTimers() {
      const refreshTokenExpiresAt = getRefreshTokenExpiresAt();

      window.clearTimeout(warningTimeoutId);
      window.clearTimeout(expiryTimeoutId);

      if (!hasActiveSession() || !refreshTokenExpiresAt) {
        setIsSessionPromptOpen(false);

        if (location.pathname !== "/login" && location.pathname !== "/signup") {
          navigate("/login", { replace: true });
        }

        return;
      }

      const currentTime = Date.now();
      const warningDelay = Math.max(refreshTokenExpiresAt - currentTime - REFRESH_WARNING_WINDOW_MS, 0);
      const expiryDelay = Math.max(refreshTokenExpiresAt - currentTime, 0);

      warningTimeoutId = window.setTimeout(() => {
        setIsSessionPromptOpen(true);
      }, warningDelay);

      expiryTimeoutId = window.setTimeout(() => {
        setIsSessionPromptOpen(false);
        clearClientSessionState();
        logoutUser().finally(() => {
          navigate("/login", { replace: true });
        });
      }, expiryDelay);
    }

    syncSessionTimers();
    window.addEventListener(AUTH_SESSION_EVENT, syncSessionTimers);

    return () => {
      window.clearTimeout(warningTimeoutId);
      window.clearTimeout(expiryTimeoutId);
      window.removeEventListener(AUTH_SESSION_EVENT, syncSessionTimers);
    };
  }, [location.pathname, navigate]);

  async function handleContinueSession() {
    try {
      setIsRefreshingSession(true);
      await continueUserSession();
      setIsSessionPromptOpen(false);
    } catch {
      setIsSessionPromptOpen(false);
      clearClientSessionState();
      navigate("/login", { replace: true });
    } finally {
      setIsRefreshingSession(false);
    }
  }

  function handleLogout() {
    setIsSessionPromptOpen(false);
    logoutUser().finally(() => {
      clearClientSessionState();
      navigate("/login", { replace: true });
    });
  }

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={<DirectStudentEntry />}
        />
        <Route
          path="/login"
          element={
            <LoginPage
              onLogin={(panel, userId, email) => {
                clearLegacyStudentBrowserCache();
                setActivePanel(panel);
                setActiveUserEmail(email);

                if (panel === "student") {
                  setActiveStudentId(userId);
                  return;
                }

                clearActiveStudentId();
              }}
            />
          }
        />
        <Route
          path="/signup"
          element={<SignupPage />}
        />
        <Route
          path="/student-panel/*"
          element={
            <ProtectedRoute allowedPanel="student">
              <StudentApp />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tpo-dashboard"
          element={
            <ProtectedRoute allowedPanel="tpo">
              <TpoOverviewApp />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tpo-dashboard/notice-board"
          element={
            <ProtectedRoute allowedPanel="tpo">
              <TpoNoticeBoardApp />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tpo-dashboard/placements"
          element={
            <ProtectedRoute allowedPanel="tpo">
              <TpoPlacementsApp />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tpo-dashboard/placements/:placementId/applicants"
          element={
            <ProtectedRoute allowedPanel="tpo">
              <TpoApplicationTrackingApp />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tpc-dashboard/placements/:placementId/applicants"
          element={
            <ProtectedRoute allowedPanel="tpc">
              <TpcApplicationTrackingApp />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tpc-dashboard/notice-board"
          element={
            <ProtectedRoute allowedPanel="tpc">
              <TpcNoticeBoardApp />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tpc-dashboard/placements"
          element={
            <ProtectedRoute allowedPanel="tpc">
              <TpcPlacementsApp />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tpo-dashboard/students/*"
          element={
            <ProtectedRoute allowedPanel="tpo">
              <TpoStudentsApp />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tpo-dashboard/tpc"
          element={
            <ProtectedRoute allowedPanel="tpo">
              <TpoTPCManagementApp />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tpc-dashboard/*"
          element={
            <ProtectedRoute allowedPanel="tpc">
              <TpcApp />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>

      <SessionExpiryModal
        isOpen={isSessionPromptOpen}
        isRefreshing={isRefreshingSession}
        onContinue={handleContinueSession}
        onLogout={handleLogout}
      />
    </>
  );
}

function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  );
}

export default App;
