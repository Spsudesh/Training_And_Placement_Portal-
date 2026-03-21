import { useEffect, useState } from "react";
import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";
import "./index.css";
import Dashboard from "./TPO/pages/Dashboard";
import PortalLayout from "./components/loginPage/PortalLayout";
import ProfileForm from "./StudentPanel/pages/ProfileForm";
import StudentHome from "./StudentPanel/pages/StudentHome";

const ONBOARDING_STORAGE_KEY = "student-panel-onboarding-complete";

function StudentApp() {
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);

  useEffect(() => {
    const onboardingStatus = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
    setIsOnboardingComplete(onboardingStatus === "true");
  }, []);

  const handleOnboardingComplete = () => {
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    setIsOnboardingComplete(true);
  };

  if (!isOnboardingComplete) {
    return (
      <PortalLayout pageTitle="My Profile" activePage="My Profile" showSidebar={false}>
        <ProfileForm onComplete={handleOnboardingComplete} />
      </PortalLayout>
    );
  }

  return (
    <PortalLayout pageTitle="Home" activePage="Home">
      <StudentHome />
    </PortalLayout>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<StudentApp />} />
        <Route path="/tpo-dashboard" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
