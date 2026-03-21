
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
