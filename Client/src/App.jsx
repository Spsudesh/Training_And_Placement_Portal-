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
  );
}

export default App;
