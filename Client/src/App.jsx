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
import LoginPage from "./components/loginPage/LoginPage";
import Dashboard from "./TPO/pages/Dashboard";
import Overview from "./TPO/pages/Overview";
import TpcDashboard from "./TPC/pages/Dashboard";
import TpcSidebar from "./TPC/pages/Tpc_sidebar";
import StudentHome from "./StudentPanel/pages/StudentHome";
import StudentProfilePage from "./StudentPanel/profile/pages/StudentProfilePage";
import StudentSidebar from "./StudentPanel/pages/Student_sidebar";
import StudentDetailsPage from "./TPC_Panel/student_verification/pages/StudentDetailsPage";
import StudentListPage from "./TPC_Panel/student_verification/pages/StudentListPage";
import studentDummyData from "./TPC_Panel/student_verification/utils/dummyData";

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
  const [currentPage, setCurrentPage] = useState("Dashboard");
  const navigate = useNavigate();

  const handleLogout = () => {
    clearActivePanel();
    setCurrentPage("Dashboard");
    navigate("/", { replace: true });
  };

  switch (currentPage) {
    case "Notice Board":
      return <Dashboard onLogout={handleLogout} onNavigate={setCurrentPage} />;
    case "Dashboard":
    default:
      return <Overview onLogout={handleLogout} onNavigate={setCurrentPage} />;
  }
}

function TpcApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const [students, setStudents] = useState(studentDummyData);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const handleLogout = () => {
    clearActivePanel();
    navigate("/", { replace: true });
  };

  const isStudentVerificationRoute = location.pathname.startsWith(
    "/tpc-dashboard/student-verification"
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

        if (page === "Dashboard") {
          navigate("/tpc-dashboard");
        }
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
          path="/tpo-dashboard"
          element={
            <ProtectedRoute allowedPanel="tpo">
              <TpoApp />
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
