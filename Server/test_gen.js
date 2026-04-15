const mockProfile = {
  personal: { fullName: "Test User", city: "NYC", state: "NY" },
  skills: { languages: ["JS"], frameworks: [], tools: [], otherLanguages: [] },
  summary: "Test summary."
};
const mockSelections = {
  education: [], experience: [], projects: [], certifications: [], activities: []
};

try {
  const routes = require('./routes/student_routes/resume/student_resume_routes.js');
  // Unfortunately the function buildResumeDocument is not exported. 
  // Let's just mock the logic manually to test.
  
  const Handlebars = require('handlebars');
  const { marked } = require('marked');
  const fs = require('fs');
  const path = require('path');
  
  Handlebars.registerHelper('join', function(array) {
    if (!Array.isArray(array)) return '';
    return array.filter(Boolean).join(', ');
  });
  
  const templatePath = path.join(__dirname, 'templates', 'resume_01.md');
  const templateMarkdown = fs.readFileSync(templatePath, 'utf8');
  
  const template = Handlebars.compile(templateMarkdown);
  const hydratedMarkdown = template({ profile: mockProfile, selections: mockSelections });
  const htmlContent = marked.parse(hydratedMarkdown);
  
  console.log("SUCCESS");
} catch (err) {
  console.error("ERROR:", err);
}
