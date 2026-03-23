import { useState } from "react";
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import "./index.css";
import LoginPage from "./components/loginPage/LoginPage";
import Dashboard from "./TPO/pages/Dashboard";
import Placements from "./TPO/pages/Placements";
import TpcDashboard from "./TPC/pages/Dashboard";
import StudentHome from "./StudentPanel/pages/StudentHome";
import JobProfiles from "./StudentPanel/pages/JobProfiles";
import StudentProfilePage from "./StudentPanel/profile/pages/StudentProfilePage";
import StudentSidebar from "./StudentPanel/pages/Student_sidebar";

const AUTH_STORAGE_KEY = "training-placement-active-panel";

function getActivePanel() {
  return window.localStorage.getItem(AUTH_STORAGE_KEY);
}

function setActivePanel(panel) {
  window.localStorage.setItem(AUTH_STORAGE_KEY, panel);
}

function clearActivePanel() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

function ProtectedRoute({ allowedPanel, children }) {
  const activePanel = getActivePanel();

  if (activePanel !== allowedPanel) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function StudentApp() {
  const [currentPage, setCurrentPage] = useState("Home");
  const navigate = useNavigate();

  const handleLogout = () => {
    clearActivePanel();
    setCurrentPage("Home");
    navigate("/", { replace: true });
  };

  function renderStudentPanelPage() {
    switch (currentPage) {
      case "Job Profiles":
        return <JobProfiles />;
      case "My Profile":
        return <StudentProfilePage />;
      case "Home":
      default:
        return <StudentHome />;
    }
  }

  return (
    <StudentSidebar
      pageTitle={currentPage}
      activePage={currentPage}
      onNavigate={setCurrentPage}
      onLogout={handleLogout}
    >
      {renderStudentPanelPage()}
    </StudentSidebar>
  );
}

function TpoApp() {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearActivePanel();
    navigate("/", { replace: true });
  };

  return <Dashboard onLogout={handleLogout} />;
}

function TpoPlacementsApp() {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearActivePanel();
    navigate("/", { replace: true });
  };

  return <Placements onLogout={handleLogout} />;
}

function TpcApp() {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearActivePanel();
    navigate("/", { replace: true });
  };

  return <TpcDashboard onLogout={handleLogout} />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            getActivePanel() ? (
              <Navigate
                to={
                  getActivePanel() === "student"
                    ? "/student-panel"
                    : getActivePanel() === "tpo"
                      ? "/tpo-dashboard"
                      : "/tpc-dashboard"
                }
                replace
              />
            ) : (
              <LoginPage
                onLogin={(panel) => {
                  setActivePanel(panel);
                }}
              />
            )
          }
        />
        <Route
          path="/student-panel"
          element={
            <ProtectedRoute allowedPanel="student">
              <StudentApp />
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
          path="/tpo-dashboard"
          element={
            <ProtectedRoute allowedPanel="tpo">
              <TpoApp />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tpc-dashboard"
          element={
            <ProtectedRoute allowedPanel="tpc">
              <TpcApp />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
