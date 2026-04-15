const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'routes/student_routes/resume/student_resume_routes.js');
let content = fs.readFileSync(filePath, 'utf8');

const regex = /studentResumeRoutes\.post\('\/generate', async \(req, res\) => \{[\s\S]*\}\);/;

const fixedEndpoint = `studentResumeRoutes.post('/generate', async (req, res) => {
  try {
    await ensureStudentResumesTable();

    const prn = req.auth?.prn;
    const profile = await fetchStudentResumeProfile(prn);

    if (!profile) {
      res.status(404).json({
        message: 'Student profile not found for resume generation.',
      });
      return;
    }

    const templateCode = String(req.body?.templateCode || '').trim() || 'resume_01';
    const resumeTitle = String(req.body?.resumeTitle || \`\${profile.personal.fullName || prn} Resume\`).trim();
    const selections = {
      projects: selectItemsByIds(profile.projects, req.body?.selectedProjects),
      certifications: selectItemsByIds(profile.certifications, req.body?.selectedCertifications),
      experience: selectItemsByIds(profile.experience, req.body?.selectedExperience),
      activities: selectItemsByIds(profile.activities, req.body?.selectedActivities),
    };

    const { markdown, html } = buildResumeDocument(templateCode, profile, selections);

    const timestamp = Date.now();
    const safeTitle = sanitizeFileName(resumeTitle || \`\${prn}-resume\`);
    const wordFileName = \`\${safeTitle || 'resume'}-\${timestamp}.md\`;
    const previewFileName = \`\${safeTitle || 'resume'}-\${timestamp}.pdf\`;
    const folder = \`student-resumes/\${sanitizeFileName(prn)}\`;

    const wordUpload = await uploadFile(
      {
        originalname: wordFileName,
        mimetype: 'text/markdown',
        buffer: Buffer.from(markdown, 'utf8'),
      },
      folder
    );

    let pdfBuffer;
    try {
      const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none'],
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
      });
      await browser.close();
    } catch (err) {
      console.error('Puppeteer generation error:', err);
      throw new Error('Failed to generate PDF document.');
    }

    const previewUpload = await uploadFile(
      {
        originalname: previewFileName,
        mimetype: 'application/pdf',
        buffer: pdfBuffer,
      },
      folder
    );

    const insertResult = await query(
      \`
        INSERT INTO student_resumes
        (PRN, opportunity_id, template_code, resume_title, file_name, file_url, preview_file_name, preview_file_path, preview_file_url, file_size, mime_type, is_default)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      \`,
      [
        prn,
        req.body?.opportunityId || null,
        templateCode,
        resumeTitle,
        wordUpload.fileName,
        wordUpload.url,
        previewUpload.fileName,
        previewUpload.filePath,
        previewUpload.url,
        Buffer.byteLength(pdfBuffer),
        wordUpload.contentType,
        0,
      ]
    );

    res.status(201).json({
      message: 'Resume generated successfully.',
      data: {
        id: insertResult.insertId,
        templateCode,
        title: resumeTitle,
        fileName: wordUpload.fileName,
        fileUrl: wordUpload.url,
        wordFileName: wordUpload.fileName,
        wordFileUrl: wordUpload.url,
        previewFileName: previewUpload.fileName,
        previewFileUrl: previewUpload.url,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to generate resume.',
      error: error.message,
    });
  }
});`;

content = content.replace(regex, fixedEndpoint);
fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed Generate Endpoint!');
