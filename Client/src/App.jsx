import { useState } from "react";
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import "./index.css";
import Overview from "./TPO/pages/Overview";
import Dashboard from "./TPO/pages/Dashboard";
import Placements from "./TPO/pages/Placements";
import TpcDashboard from "./TPC/pages/Dashboard";
import TpcSidebar from "./TPC/pages/Tpc_sidebar";
import JobProfiles from "./StudentPanel/pages/JobProfiles";
import StudentHome from "./StudentPanel/pages/StudentHome";
import StudentProfilePage from "./StudentPanel/profile/pages/StudentProfilePage";
import StudentSidebar from "./StudentPanel/pages/Student_sidebar";
import ProfileForm from "./StudentPanel/pages/ProfileForm";
import StudentDetailsPage from "./TPC_Panel/student_verification/pages/StudentDetailsPage";
import StudentListPage from "./TPC_Panel/student_verification/pages/StudentListPage";
import studentDummyData from "./TPC_Panel/student_verification/utils/dummyData";

const AUTH_STORAGE_KEY = "training-placement-active-panel";
const STUDENT_ID_STORAGE_KEY = "training-placement-active-student";
const STUDENT_FORM_STATUS_KEY = "training-placement-student-form-status";
const DEFAULT_STUDENT_ID = "2453011";

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

function getActiveStudentId() {
  return window.localStorage.getItem(STUDENT_ID_STORAGE_KEY);
}

function getStudentFormStatusMap() {
  try {
    return JSON.parse(window.localStorage.getItem(STUDENT_FORM_STATUS_KEY) || "{}");
  } catch (error) {
    return {};
  }
}

function isStudentFormSubmitted(studentId) {
  if (!studentId) {
    return false;
  }

  return Boolean(getStudentFormStatusMap()[studentId]);
}

function markStudentFormSubmitted(studentId) {
  if (!studentId) {
    return;
  }

  const statusMap = getStudentFormStatusMap();
  statusMap[studentId] = true;
  window.localStorage.setItem(STUDENT_FORM_STATUS_KEY, JSON.stringify(statusMap));
}

function clearActivePanel() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

function ensureDirectStudentSession() {
  setActivePanel("student");

  if (!getActiveStudentId()) {
    setActiveStudentId(DEFAULT_STUDENT_ID);
  }
}

function ProtectedRoute({ allowedPanel, children }) {
  const activePanel = getActivePanel();

  if (activePanel !== allowedPanel) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function DirectStudentEntry() {
  ensureDirectStudentSession();
  return <Navigate to="/student-panel/profile-form" replace />;
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

  return "Student Panel";
}

function StudentApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeStudentId = getActiveStudentId();
  const hasSubmittedForm = isStudentFormSubmitted(activeStudentId);
  const isProfileFormRoute = location.pathname.startsWith("/student-panel/profile-form");

  const handleLogout = () => {
    clearActivePanel();
    clearActiveStudentId();
    navigate("/login", { replace: true });
  };

  if (!hasSubmittedForm && !isProfileFormRoute) {
    return <Navigate to="/student-panel/profile-form" replace />;
  }

  if (hasSubmittedForm && isProfileFormRoute) {
    return <Navigate to="/student-panel" replace />;
  }

  return (
    <StudentSidebar
      pageTitle={getStudentPageTitle(location.pathname)}
      showSidebar={!isProfileFormRoute}
      onLogout={handleLogout}
    >
      <Routes>
        <Route index element={<StudentHome />} />
        <Route path="jobs" element={<JobProfiles />} />
        <Route path="profile" element={<StudentProfilePage />} />
        <Route
          path="profile-form"
          element={
            <ProfileForm
              onComplete={() => {
                markStudentFormSubmitted(activeStudentId);
                navigate("/student-panel", { replace: true });
              }}
            />
          }
        />
        <Route
          path="interviews"
          element={
            <StudentPlaceholderPage
              title="Interviews"
              description="Interview tracking will be added here once the student interview workflow is connected."
            />
          }
        />
        <Route
          path="assessments"
          element={
            <StudentPlaceholderPage
              title="Assessments"
              description="Assessment schedules and results will appear here after this module is enabled."
            />
          }
        />
        <Route
          path="resume"
          element={
            <StudentPlaceholderPage
              title="Resume"
              description="Resume tools and downloadable profile assets will be added here in a later step."
            />
          }
        />
        <Route path="*" element={<Navigate to="/student-panel" replace />} />
      </Routes>
    </StudentSidebar>
  );
}

function TpoOverviewApp() {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearActivePanel();
    navigate("/login", { replace: true });
  };

  const handleNavigate = (page) => {
    if (page === "Notice Board") {
      navigate("/tpo-dashboard/notice-board");
      return;
    }

    if (page === "Dashboard") {
      navigate("/tpo-dashboard");
    }
  };

  return <Overview onLogout={handleLogout} onNavigate={handleNavigate} />;
}

function TpoNoticeBoardApp() {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearActivePanel();
    navigate("/login", { replace: true });
  };

  const handleNavigate = (page) => {
    if (page === "Dashboard") {
      navigate("/tpo-dashboard");
      return;
    }

    if (page === "Notice Board") {
      navigate("/tpo-dashboard/notice-board");
      return;
    }

    if (page === "Placement Opportunity") {
      navigate("/tpo-dashboard/placements");
    }
  };

  return <Dashboard onLogout={handleLogout} onNavigate={handleNavigate} />;
}

function TpoPlacementsApp() {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearActivePanel();
    navigate("/login", { replace: true });
  };

  return <Placements onLogout={handleLogout} />;
}

function TpcApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const [students, setStudents] = useState(studentDummyData);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const handleLogout = () => {
    clearActivePanel();
    navigate("/login", { replace: true });
  };

  const isStudentVerificationRoute = location.pathname.startsWith(
    "/tpc-dashboard/student-verification",
  );

  return (
    <TpcSidebar
      pageTitle={isStudentVerificationRoute ? "Student Verification" : "TPC Dashboard"}
      activePage={isStudentVerificationRoute ? "Students" : "Dashboard"}
      onLogout={handleLogout}
      onNavigate={(page) => {
        if (page === "Students") {
          navigate("/tpc-dashboard/student-verification");
          return;
        }

        navigate("/tpc-dashboard");
      }}
    >
      <Routes>
        <Route index element={<TpcDashboard />} />
        <Route
          path="student-verification"
          element={
            <StudentListPage
              students={students}
              setSelectedStudent={setSelectedStudent}
            />
          }
        />
        <Route
          path="student-verification/:prn"
          element={
            <StudentDetailsPage
              students={students}
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

function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={<DirectStudentEntry />}
        />
        <Route path="/login" element={<DirectStudentEntry />} />
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
          path="/tpc-dashboard/*"
          element={
            <ProtectedRoute allowedPanel="tpc">
              <TpcApp />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
