
import { useEffect, useState } from "react";
import "./index.css";
import ProfileForm from "./StudentPanel/pages/ProfileForm";
import StudentHome from "./StudentPanel/pages/StudentHome";
import StudentProfilePage from "./StudentPanel/profile/pages/StudentProfilePage";
import StudentSidebar from "./StudentPanel/pages/Student_sidebar";

const ONBOARDING_STORAGE_KEY = "student-panel-onboarding-complete-v2";

function App() {
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [currentPage, setCurrentPage] = useState("Home");

  useEffect(() => {
    const onboardingStatus = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
    setIsOnboardingComplete(onboardingStatus === "true");
  }, []);

  const handleOnboardingComplete = () => {
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    setIsOnboardingComplete(true);
    setCurrentPage("Home");
  };

  if (!isOnboardingComplete) {
    return (
      <StudentSidebar pageTitle="My Profile" activePage="My Profile" showSidebar={false}>
        <ProfileForm onComplete={handleOnboardingComplete} />
      </StudentSidebar>
    );
  }

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
    >
      {renderStudentPanelPage()}
    </StudentSidebar>
  );
}

export default App;
