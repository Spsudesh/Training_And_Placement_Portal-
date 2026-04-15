const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'routes/student_routes/resume/student_resume_routes.js');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Professional Classic Template (Two column)
const classicRegex = /function buildClassicTemplate[\s\S]*?<\/html>\`;\n}/;
const newClassic = `function buildClassicTemplate(profile, selections) {
  const skillItems = [
    ...profile.skills.languages,
    ...profile.skills.frameworks,
    ...profile.skills.tools,
    ...profile.skills.otherLanguages,
  ].filter(Boolean);
  const contactItems = buildContactItems(profile);
  const educationEntries = buildEducationEntries(profile);

  return \`<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>\${escapeHtml(profile.personal.fullName)} Resume</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background: #fff; margin: 0; padding: 0; color: #111; font-size: 11px; line-height: 1.4; }
        .page { width: 794px; height: 1122px; margin: 0 auto; background: #fff; padding: 40px; position: relative; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #2563eb; padding-bottom: 15px; margin-bottom: 15px; }
        .header-left { width: 90px; height: 100px; background: #f1f5f9; border: 1px solid #cbd5e1; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 10px; }
        .header-right { text-align: right; flex-grow: 1; padding-left: 20px; }
        h1 { margin: 0 0 5px 0; font-size: 28px; line-height: 1.1; letter-spacing: 1px; text-transform: uppercase; color: #1e3a8a; font-weight: 700; }
        .contact-row { font-size: 11px; color: #334155; margin-bottom: 3px; }
        .columns { display: flex; gap: 25px; }
        .col-left { width: 33%; border-right: 1px solid #e2e8f0; padding-right: 20px; }
        .col-right { width: 67%; }
        .section { margin-bottom: 16px; }
        h2 { margin: 0 0 8px 0; font-size: 13px; letter-spacing: 0.1em; text-transform: uppercase; color: #1d4ed8; border-bottom: 1px solid #93c5fd; padding-bottom: 3px; font-weight: 600; }
        .entry { margin-bottom: 12px; }
        .entry h3 { margin: 0 0 2px 0; font-size: 12px; color: #0f172a; font-weight: 600; }
        .meta { color: #64748b; font-size: 10.5px; margin-bottom: 2px; font-style: italic; }
        .description { margin: 0; font-size: 11px; line-height: 1.5; color: #334155; text-align: justify; }
        .skill-group { margin-bottom: 8px; font-size: 11px; line-height: 1.5; }
        .skill-group strong { color: #1e293b; display: block; margin-bottom: 1px; }
        .summary-text { font-size: 11px; line-height: 1.5; color: #334155; text-align: justify; }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="header">
          <div class="header-left">
            Photo
          </div>
          <div class="header-right">
            <h1>\${escapeHtml(profile.personal.fullName || profile.prn)}</h1>
            <div class="contact-row">
              \${escapeHtml(joinNonEmpty([profile.personal.city, profile.personal.state], ', '))} | \${escapeHtml(profile.personal.mobile)} | \${escapeHtml(profile.personal.email || profile.personal.collegeEmail)}
            </div>
            <div class="contact-row">
              \${escapeHtml(joinNonEmpty([profile.personal.linkedin, profile.personal.github, profile.personal.portfolio], ' | '))}
            </div>
          </div>
        </div>
        
        <div class="columns">
          <div class="col-left">
            \${profile.summary ? \`<div class="section"><h2>Profile</h2><div class="summary-text">\${escapeHtml(profile.summary)}</div></div>\` : ''}
            
            \${renderListSection('Education', educationEntries, (item) => \`
              <div class="entry">
                <h3>\${escapeHtml(item.title)}</h3>
                <div class="meta">\${escapeHtml(item.subtitle)}</div>
              </div>
            \`)}
            
            \${renderListSection('Skills', [profile.skills], () => \`
              \${profile.skills.languages.length ? \`<div class="skill-group"><strong>Programming:</strong>\${escapeHtml(profile.skills.languages.join(', '))}</div>\` : ''}
              \${profile.skills.frameworks.length ? \`<div class="skill-group"><strong>Frameworks:</strong>\${escapeHtml(profile.skills.frameworks.join(', '))}</div>\` : ''}
              \${profile.skills.tools.length ? \`<div class="skill-group"><strong>Tools:</strong>\${escapeHtml(profile.skills.tools.join(', '))}</div>\` : ''}
              \${profile.skills.otherLanguages.length ? \`<div class="skill-group"><strong>Others:</strong>\${escapeHtml(profile.skills.otherLanguages.join(', '))}</div>\` : ''}
            \`)}
          </div>
          <div class="col-right">
            \${renderListSection('Projects', selections.projects, (item) => \`
              <div class="entry">
                <div style="display:flex; justify-content:space-between; align-items:baseline;">
                  <h3>\${escapeHtml(item.title)}</h3>
                  \${item.techStack ? \`<span style="color:#64748b; font-size:10px;">[\${escapeHtml(item.techStack)}]</span>\` : ''}
                </div>
                \${item.githubLink || item.liveLink ? \`<div class="meta" style="margin-bottom:4px;">Links: \${escapeHtml(joinNonEmpty([item.githubLink, item.liveLink], ' | '))}</div>\` : ''}
                <div class="description">\${escapeHtml(item.description)}</div>
              </div>
            \`)}
            
            \${renderListSection('Experience', selections.experience, (item) => \`
              <div class="entry">
                <div style="display:flex; justify-content:space-between; align-items:baseline;">
                  <h3>\${escapeHtml(item.role || item.type)} at \${escapeHtml(item.companyName)}</h3>
                  <span class="meta" style="margin:0;">\${escapeHtml(item.duration)}</span>
                </div>
                <div class="description">\${escapeHtml(item.description)}</div>
              </div>
            \`)}
            
            \${renderListSection('Achievements', selections.activities, (item) => \`
              <div class="entry">
                <h3>\${escapeHtml(item.title)}</h3>
                <div class="description">\${escapeHtml(item.description)}</div>
              </div>
            \`)}
            
            \${renderListSection('Certifications', selections.certifications, (item) => \`
              <div class="entry" style="display:flex; justify-content:space-between;">
                <h3>\${escapeHtml(item.name)}</h3>
                <span class="meta">\${escapeHtml(item.platform)}</span>
              </div>
            \`)}
          </div>
        </div>
      </div>
    </body>
  </html>\`;
}`;
content = content.replace(classicRegex, newClassic);

// 2. Professional Modern Template (Single column, structured)
const modernRegex = /function buildModernTemplate[\s\S]*?<\/html>\`;\n}/;
const newModern = `function buildModernTemplate(profile, selections) {
  const contactItems = buildContactItems(profile);
  const educationEntries = buildEducationEntries(profile);

  return \`<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>\${escapeHtml(profile.personal.fullName)} Resume</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: 'Georgia', Times, serif; background: #fff; margin: 0; padding: 0; color: #111; font-size: 11px; line-height: 1.4; }
        .page { width: 794px; height: 1122px; margin: 0 auto; background: #fff; padding: 45px 55px; }
        .header { text-align: center; margin-bottom: 20px; }
        h1 { margin: 0 0 5px 0; font-size: 26px; line-height: 1.1; letter-spacing: 2px; text-transform: uppercase; color: #000; font-weight: normal; }
        .contact-lines { font-size: 11px; color: #444; line-height: 1.6; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
        .section { margin-bottom: 18px; }
        h2 { margin: 0 0 10px 0; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #000; border-bottom: 1px solid #000; padding-bottom: 4px; font-weight: normal; text-align: center; }
        .entry { margin-bottom: 12px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
        .entry-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2px; }
        .entry-title { font-size: 12px; font-weight: bold; color: #111; }
        .entry-meta { font-size: 11px; color: #666; font-style: italic; }
        .entry-subtitle { font-size: 11px; color: #444; font-weight: 500; margin-bottom: 4px; }
        .description { margin: 0; font-size: 11px; line-height: 1.5; color: #333; }
        .skills-table { width: 100%; border-collapse: collapse; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; }
        .skills-table td { padding: 4px 0; vertical-align: top; }
        .skills-table td:first-child { width: 20%; font-weight: bold; color: #111; }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="header">
          <h1>\${escapeHtml(profile.personal.fullName || profile.prn)}</h1>
          <div class="contact-lines">
            \${escapeHtml(joinNonEmpty([profile.personal.city, profile.personal.state], ', '))} | \${escapeHtml(profile.personal.email || profile.personal.collegeEmail)} | \${escapeHtml(profile.personal.mobile)}
            <br/>
            \${escapeHtml(profile.personal.linkedin)} | \${escapeHtml(profile.personal.github)}
          </div>
        </div>
        
        \${renderListSection('Education', educationEntries, (item) => \`
          <div class="entry">
            <div class="entry-header">
              <span class="entry-title">\${escapeHtml(item.title)}</span>
              <span class="entry-meta">\${escapeHtml(item.subtitle)}</span>
            </div>
          </div>
        \`)}
        
        \${renderListSection('Experience', selections.experience, (item) => \`
          <div class="entry">
            <div class="entry-header">
              <span class="entry-title">\${escapeHtml(item.companyName)}</span>
              <span class="entry-meta">\${escapeHtml(item.duration)}</span>
            </div>
            <div class="entry-subtitle">\${escapeHtml(item.role || item.type)}</div>
            <div class="description">\${escapeHtml(item.description)}</div>
          </div>
        \`)}
        
        \${renderListSection('Technical Skills', [[profile.skills]], () => \`
          <table class="skills-table">
            \${profile.skills.languages.length ? \`<tr><td>Programming:</td><td>\${escapeHtml(profile.skills.languages.join(', '))}</td></tr>\` : ''}
            \${profile.skills.frameworks.length ? \`<tr><td>Frameworks:</td><td>\${escapeHtml(profile.skills.frameworks.join(', '))}</td></tr>\` : ''}
            \${profile.skills.tools.length ? \`<tr><td>Tools:</td><td>\${escapeHtml(profile.skills.tools.join(', '))}</td></tr>\` : ''}
            \${profile.skills.otherLanguages.length ? \`<tr><td>Concepts:</td><td>\${escapeHtml(profile.skills.otherLanguages.join(', '))}</td></tr>\` : ''}
          </table>
        \`)}
        
        \${renderListSection('Projects', selections.projects, (item) => \`
          <div class="entry">
            <div class="entry-header">
              <span class="entry-title">\${escapeHtml(item.title)} \${item.techStack ? \`<span style="font-weight:normal;">| \${escapeHtml(item.techStack)}</span>\` : ''}</span>
              \${item.githubLink || item.liveLink ? \`<span class="entry-meta">Links: \${escapeHtml(joinNonEmpty([item.githubLink, item.liveLink], ' | '))}</span>\` : ''}
            </div>
            <div class="description">\${escapeHtml(item.description)}</div>
          </div>
        \`)}
        
        \${renderListSection('Certificates', selections.certifications, (item) => \`
          <div class="entry">
            <div class="entry-header">
              <span class="entry-title">\${escapeHtml(item.name)}</span>
              <span class="entry-meta">\${escapeHtml(item.platform)}</span>
            </div>
          </div>
        \`)}
        
        \${renderListSection('Extracurricular Activities', selections.activities, (item) => \`
          <div class="entry">
            <div class="entry-title" style="margin-bottom:3px;">\${escapeHtml(item.title)}</div>
            <div class="description">\${escapeHtml(item.description)}</div>
          </div>
        \`)}
      </div>
    </body>
  </html>\`;
}`;
content = content.replace(modernRegex, newModern);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated student_resume_routes.js with professional CSS.');
