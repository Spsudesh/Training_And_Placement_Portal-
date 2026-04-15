const fs = require('fs');
const path = require('path');

const appFile = path.join(__dirname, 'src', 'App.jsx');
let appContent = fs.readFileSync(appFile, 'utf8');

// Ensure import is there
if (!appContent.includes('AtsResumePage')) {
  appContent = appContent.replace(
    'import StudentResumePreviewPage from "./StudentPanel/resume/pages/StudentResumePreviewPage";',
    'import StudentResumePreviewPage from "./StudentPanel/resume/pages/StudentResumePreviewPage";\nimport AtsResumePage from "./StudentPanel/ats-resume/pages/AtsResumePage";'
  );
}

// Inject route right before the resume route
const atsRouteCode = `        <Route
          path="ats-resume"
          element={
            hasSubmittedProfileForm ? (
              <AtsResumePage />
            ) : (
              <Navigate to="/student-panel/profile-form" replace />
            )
          }
        />\n`;

if (!appContent.includes('path="ats-resume"')) {
  appContent = appContent.replace(
    /(\s*)<Route\s*path="resume"/,
    "\n" + atsRouteCode + "$1<Route\n          path=\"resume\""
  );
}

fs.writeFileSync(appFile, appContent, 'utf8');
console.log('App.jsx patched successfully!');
