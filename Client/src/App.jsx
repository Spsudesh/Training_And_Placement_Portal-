import "./index.css";
import { BrowserRouter as Router, Route, Routes, useLocation } from "react-router-dom";
import Header from "./components/Header";
import ProfileForm from "./StudentPanel/pages/ProfileForm";
import Dashboard from "./TPO/pages/Dashboard";

function AppShell() {
  const location = useLocation();
  const isTpoRoute = location.pathname.startsWith("/tpo-dashboard");

  return (
    <>
      {!isTpoRoute && <Header />}

      <Routes>
        <Route path="/" element={<ProfileForm />} />
        <Route path="/tpo-dashboard" element={<Dashboard />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppShell />
    </Router>
import { useEffect, useState } from "react";
import "./index.css";
import PortalLayout from "./components/loginPage/PortalLayout";
import ProfileForm from "./StudentPanel/pages/ProfileForm";
import StudentHome from "./StudentPanel/pages/StudentHome";

const ONBOARDING_STORAGE_KEY = "student-panel-onboarding-complete";

function App() {
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

export default App;
