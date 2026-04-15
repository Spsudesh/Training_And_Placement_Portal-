const fs = require('fs');
const path = require('path');

const originalFile = path.join(__dirname, 'original_resume_routes.js');
let originalContent = fs.readFileSync(originalFile, 'utf8');

// The original file is an express router with utility functions.
// We extract the top-level utilities.
const utilsRegex = /([\s\S]*?)(?=studentResumeRoutes\.get\('\/templates')/;
const match = originalContent.match(utilsRegex);

let baseCode = match ? match[1] : '';

// Rename the router variable just to be safe.
baseCode = baseCode.replace(/const studentResumeRoutes = express\.Router\(\);/g, "const atsResumeRoutes = express.Router();\nconst puppeteer = require('puppeteer');");

// Clean out any buildClassicTemplate references that might have been picked up.
baseCode = baseCode.replace(/function buildClassicTemplate[\s\S]*?function buildResumeDocument[\s\S]*?\n\}/, "");

// Now we append the ATS generator and routes.
const atsHtmlEngine = `
function buildAtsTemplate(profile, selections) {
  return \`<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>\${escapeHtml(profile.personal.fullName)} ATS Resume</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: 'Arial', sans-serif; background: #fff; margin: 0; padding: 48px; color: #000; font-size: 11px; line-height: 1.4; }
        .page { width: 100%; max-width: 800px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 15px; }
        h1 { margin: 0 0 4px 0; font-size: 22px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
        .contact { font-size: 11px; margin-bottom: 2px; }
        .section { margin-top: 15px; }
        h2 { margin: 0 0 8px 0; font-size: 13px; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 2px; }
        h3 { margin: 0 0 2px 0; font-size: 11.5px; font-weight: bold; }
        p { margin: 0 0 4px 0; }
        .entry { margin-bottom: 12px; }
        .flex-between { display: flex; justify-content: space-between; align-items: baseline; }
        .meta { font-style: italic; font-size: 10.5px; }
        .desc { font-size: 11px; text-align: justify; }
        .skills-row { margin-bottom: 4px; }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="header">
          <h1>\${escapeHtml(profile.personal.fullName || profile.prn)}</h1>
          <div class="contact">
            \${escapeHtml(joinNonEmpty([profile.personal.city, profile.personal.state], ', '))} | \${escapeHtml(profile.personal.mobile)} | \${escapeHtml(profile.personal.email || profile.personal.collegeEmail)}
          </div>
          <div class="contact">
            \${escapeHtml(profile.personal.linkedin)} | \${escapeHtml(profile.personal.github)}
          </div>
        </div>

        \${profile.summary ? \`<div class="section"><h2>SUMMARY</h2><p class="desc">\${escapeHtml(profile.summary)}</p></div>\` : ''}

        \${renderListSection('EDUCATION', selections.education, (item) => \`
          <div class="entry">
            <div class="flex-between">
              <h3>\${escapeHtml(item.title)}</h3>
              <span class="meta">\${escapeHtml(item.subtitle)}</span>
            </div>
          </div>
        \`)}

        \${renderListSection('PROFESSIONAL EXPERIENCE', selections.experience, (item) => \`
          <div class="entry">
            <div class="flex-between">
              <h3>\${escapeHtml(item.role || item.type)} - \${escapeHtml(item.companyName)}</h3>
              <span class="meta">\${escapeHtml(item.duration)}</span>
            </div>
            <p class="desc">\${escapeHtml(item.description)}</p>
          </div>
        \`)}

        \${renderListSection('PROJECTS', selections.projects, (item) => \`
          <div class="entry">
            <div class="flex-between">
              <h3>\${escapeHtml(item.title)} \${item.techStack ? \`| \${escapeHtml(item.techStack)}\` : ''}</h3>
              \${item.githubLink || item.liveLink ? \`<span class="meta">Links: \${escapeHtml(joinNonEmpty([item.githubLink, item.liveLink], ' | '))}</span>\` : ''}
            </div>
            <p class="desc">\${escapeHtml(item.description)}</p>
          </div>
        \`)}

        \${renderListSection('TECHNICAL SKILLS', [[profile.skills]], () => \`
          <div>
            \${profile.skills.languages.length ? \`<div class="skills-row"><strong>Programming:</strong> \${escapeHtml(profile.skills.languages.join(', '))}</div>\` : ''}
            \${profile.skills.frameworks.length ? \`<div class="skills-row"><strong>Frameworks:</strong> \${escapeHtml(profile.skills.frameworks.join(', '))}</div>\` : ''}
            \${profile.skills.tools.length ? \`<div class="skills-row"><strong>Tools:</strong> \${escapeHtml(profile.skills.tools.join(', '))}</div>\` : ''}
          </div>
        \`)}

        \${renderListSection('CERTIFICATIONS', selections.certifications, (item) => \`
          <div class="entry flex-between">
            <div><strong>\${escapeHtml(item.name)}</strong> (\${escapeHtml(item.platform)})</div>
          </div>
        \`)}

        \${renderListSection('EXTRACURRICULAR', selections.activities, (item) => \`
          <div class="entry">
            <h3>\${escapeHtml(item.title)}</h3>
            <p class="desc">\${escapeHtml(item.description)}</p>
          </div>
        \`)}
      </div>
    </body>
  </html>\`;
}

// Routes
atsResumeRoutes.get('/templates', async (req, res) => {
  res.json({
    message: 'ATS Templates fetched.',
    data: [
      {
        id: 'ats_standard',
        name: 'The Standard ATS',
        description: 'A 100% compliant applicant tracking system template built on clean styling.',
        previewUrl: '', // Will just be generated in preview.
        previewType: 'pdf',
        sections: ['Header', 'Summary', 'Education', 'Experience', 'Projects', 'Technical Skills'],
      }
    ]
  });
});

atsResumeRoutes.get('/', async (req, res) => {
  try {
    await ensureStudentResumesTable();
    const prn = req.auth?.prn;
    const rows = await query(
      \`SELECT id, template_code, resume_title, file_name, file_url, preview_file_url, created_at 
       FROM student_resumes WHERE PRN = ? AND template_code LIKE 'ats_%' ORDER BY created_at DESC\`, [prn]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

atsResumeRoutes.get('/:id', async (req, res) => {
  try {
    const rows = await query('SELECT * FROM student_resumes WHERE id = ? AND PRN = ?', [req.params.id, req.auth?.prn]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

atsResumeRoutes.post('/generate', async (req, res) => {
  try {
    await ensureStudentResumesTable();

    const prn = req.auth?.prn;
    const profile = await fetchStudentResumeProfile(prn);
    if (!profile) return res.status(404).json({ message: 'Profile not found.' });

    const selections = {
      education: profile.education || [], // ATS often uses all or selected, we will use all for ATS standard.
      projects: selectItemsByIds(profile.projects, req.body?.selectedProjects),
      certifications: selectItemsByIds(profile.certifications, req.body?.selectedCertifications),
      experience: selectItemsByIds(profile.experience, req.body?.selectedExperience),
      activities: selectItemsByIds(profile.activities, req.body?.selectedActivities),
    };

    const htmlContent = buildAtsTemplate(profile, selections);
    const resumeTitle = req.body?.resumeTitle || \`\${prn}-ATS-Resume\`;
    const folder = \`student-resumes/\${sanitizeFileName(prn)}\`;

    let pdfBuffer;
    try {
      const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '0', bottom: '0', left: '0', right: '0' } });
      await browser.close();
    } catch(err) {
      console.error(err);
      throw new Error('PDF Engine Failed');
    }

    const timestamp = Date.now();
    const safeTitle = sanitizeFileName(resumeTitle);
    
    // Upload PDF
    const pdfUpload = await uploadFile(
      { originalname: \`\${safeTitle}-\${timestamp}.pdf\`, mimetype: 'application/pdf', buffer: pdfBuffer }, folder
    );
    
    // Upload HTML as a doc/fallback
    const htmlUpload = await uploadFile(
      { originalname: \`\${safeTitle}-\${timestamp}.html\`, mimetype: 'text/html', buffer: Buffer.from(htmlContent) }, folder
    );

    const insertResult = await query(
      \`INSERT INTO student_resumes (PRN, template_code, resume_title, file_name, file_url, preview_file_url, file_size, mime_type, is_default)
        VALUES (?, 'ats_standard', ?, ?, ?, ?, ?, 'application/pdf', 0)\`,
      [prn, resumeTitle, pdfUpload.fileName, pdfUpload.url, pdfUpload.url, Buffer.byteLength(pdfBuffer)]
    );

    res.status(201).json({ id: insertResult.insertId, fileUrl: pdfUpload.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = atsResumeRoutes;
`;

const finalFilepath = path.join(__dirname, 'routes', 'student_routes', 'ats_resume');
if (!fs.existsSync(finalFilepath)) fs.mkdirSync(finalFilepath, { recursive: true });

fs.writeFileSync(path.join(finalFilepath, 'ats_resume_routes.js'), baseCode + atsHtmlEngine, 'utf8');

// Now inject into index.js
const indexFile = path.join(__dirname, 'index.js');
let indexContent = fs.readFileSync(indexFile, 'utf8');
if (!indexContent.includes('const atsResumeRoutes')) {
  indexContent = indexContent.replace(
    "const studentResumeRoutes = require('./routes/student_routes/resume/student_resume_routes');",
    "const studentResumeRoutes = require('./routes/student_routes/resume/student_resume_routes');\nconst atsResumeRoutes = require('./routes/student_routes/ats_resume/ats_resume_routes');"
  );
  indexContent = indexContent.replace(
    "app.use('/student/resumes', requireAuth, requireRole('student'), studentResumeRoutes);",
    "app.use('/student/resumes', requireAuth, requireRole('student'), studentResumeRoutes);\napp.use('/student/ats-resumes', requireAuth, requireRole('student'), atsResumeRoutes);"
  );
  fs.writeFileSync(indexFile, indexContent, 'utf8');
}
console.log('Backend Engine For ATS Complete!');
