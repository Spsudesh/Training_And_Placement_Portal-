const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'routes/student_routes/resume/student_resume_routes.js');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add puppeteer
if (!content.includes('const puppeteer = require')) {
  content = content.replace("const express = require('express');", "const express = require('express');\nconst puppeteer = require('puppeteer');");
}

// 2. Update templates definition
content = content.replace(/previewUrl: '\/resume_01\.docx'/g, "previewUrl: '/template_resume_1.pdf'");
content = content.replace(/previewType: 'docx'/g, "previewType: 'pdf'");
content = content.replace(/previewUrl: '\/resume_02\.docx'/g, "previewUrl: '/template_resume_2.pdf'");

// 3. Update buildClassicTemplate
const classicRegex = /function buildClassicTemplate[\s\S]*?<\/html>`;\n}/;
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
        body { font-family: Calibri, Arial, sans-serif; background: #fff; margin: 0; padding: 0; color: #111827; }
        .page { max-width: 920px; margin: 0 auto; background: #fff; padding: 40px; box-sizing: border-box; }
        .header { border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; }
        h1 { margin: 0; font-size: 32px; line-height: 1.1; letter-spacing: 0.02em; text-transform: uppercase; text-align: right; }
        .headline { margin-top: 4px; font-size: 15px; color: #334155; font-weight: 600; text-align: right; }
        .contact { margin-top: 8px; font-size: 12px; line-height: 1.5; color: #475569; text-align: right; }
        h2 { margin: 0 0 6px; font-size: 13px; letter-spacing: 0.1em; text-transform: uppercase; color: #0284c7; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; text-align: left; }
        .section { margin-bottom: 16px; }
        .entry { margin-bottom: 10px; }
        .entry h3 { margin: 0 0 2px; font-size: 14px; color: #111827; }
        .meta { color: #475569; font-size: 12px; margin-bottom: 2px; font-weight: 600; }
        .description { margin: 0; font-size: 12px; line-height: 1.5; color: #334155; }
        .skill-group { margin-bottom: 6px; font-size: 12px; line-height: 1.5; }
        .skill-group strong { color: #111827; }
        .summary { margin: 0; font-size: 12px; line-height: 1.5; color: #334155; }
      </style>
    </head>
    <body>
      <div class="page">
        <table width="100%" cellpadding="0" cellspacing="0" class="header">
          <tr>
            <td width="25%" valign="top">
              <!-- Photo area placeholder -->
            </td>
            <td width="75%" align="right" valign="top">
              <h1>\${escapeHtml(profile.personal.fullName || profile.prn)}</h1>
              <p class="headline">\${escapeHtml(profile.headline || 'Computer Science and Engineering')}</p>
              <div class="contact">
                \${escapeHtml(joinNonEmpty([profile.personal.mobile, profile.personal.email || profile.personal.collegeEmail, joinNonEmpty([profile.personal.city, profile.personal.state], ', ')], ' | '))}
                <br />
                \${escapeHtml(joinNonEmpty([profile.personal.linkedin, profile.personal.github, profile.personal.portfolio], ' | '))}
              </div>
            </td>
          </tr>
        </table>
        
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="35%" valign="top" style="padding-right: 20px;">
              \${profile.summary ? \`<div class="section"><h2>Profile</h2><p class="summary">\${escapeHtml(profile.summary)}</p></div>\` : ''}
              \${renderListSection('Education', educationEntries, (item) => \`
                <div class="entry">
                  <h3>\${escapeHtml(item.title)}</h3>
                  <p class="meta">\${escapeHtml(item.subtitle)}</p>
                </div>
              \`)}
              \${renderListSection('Technical Skills', [profile.skills], () => \`
                \${profile.skills.languages.length ? \`<p class="skill-group"><strong>Programming Languages:</strong><br/>\${escapeHtml(profile.skills.languages.join(', '))}</p>\` : ''}
                \${profile.skills.frameworks.length ? \`<p class="skill-group"><strong>Frameworks:</strong><br/>\${escapeHtml(profile.skills.frameworks.join(', '))}</p>\` : ''}
                \${profile.skills.tools.length ? \`<p class="skill-group"><strong>Tools:</strong><br/>\${escapeHtml(profile.skills.tools.join(', '))}</p>\` : ''}
                \${profile.skills.otherLanguages.length ? \`<p class="skill-group"><strong>Other:</strong><br/>\${escapeHtml(profile.skills.otherLanguages.join(', '))}</p>\` : ''}
              \`)}
            </td>
            <td width="65%" valign="top" style="border-left: 1px solid #e2e8f0; padding-left: 20px;">
              \${renderListSection('Projects', selections.projects, (item) => \`
                <div class="entry">
                  <h3>\${escapeHtml(item.title)} \${item.techStack ? \`<span style="font-weight:normal; color:#475569; font-size:12px;">| \${escapeHtml(item.techStack)}</span>\` : ''}</h3>
                  \${item.githubLink || item.liveLink ? \`<p class="meta">\${escapeHtml(joinNonEmpty([item.githubLink, item.liveLink], ' | '))}</p>\` : ''}
                  <p class="description">\${escapeHtml(item.description)}</p>
                </div>
              \`)}
              \${renderListSection('Experience', selections.experience, (item) => \`
                <div class="entry">
                  <h3>\${escapeHtml(item.role || item.type || 'Experience')} at \${escapeHtml(item.companyName)}</h3>
                  <p class="meta">\${escapeHtml(item.duration)}</p>
                  <p class="description">\${escapeHtml(item.description)}</p>
                </div>
              \`)}
              \${renderListSection('Achievements', selections.activities, (item) => \`
                <div class="entry">
                  <h3>\${escapeHtml(item.title)}</h3>
                  <p class="description">\${escapeHtml(item.description)}</p>
                </div>
              \`)}
              \${renderListSection('Certificates', selections.certifications, (item) => \`
                <div class="entry">
                  <h3>\${escapeHtml(item.name)}</h3>
                  <p class="meta">\${escapeHtml(item.platform)}</p>
                </div>
              \`)}
            </td>
          </tr>
        </table>
      </div>
    </body>
  </html>\`;
}`;
content = content.replace(classicRegex, newClassic);

// 4. Update buildModernTemplate
const modernRegex = /function buildModernTemplate[\s\S]*?<\/html>`;\n}/;
const newModern = `function buildModernTemplate(profile, selections) {
  const contactItems = buildContactItems(profile);
  const educationEntries = buildEducationEntries(profile);

  return \`<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>\${escapeHtml(profile.personal.fullName)} Resume</title>
      <style>
        body { font-family: Calibri, Arial, sans-serif; background: #fff; margin: 0; padding: 0; color: #0f172a; }
        .page { max-width: 940px; margin: 0 auto; background: #ffffff; padding: 40px; box-sizing: border-box; }
        .header { text-align: center; margin-bottom: 20px; }
        h1 { margin: 0; font-size: 30px; line-height: 1.1; text-transform: uppercase; letter-spacing: 0.05em; }
        .headline { margin-top: 4px; font-size: 15px; font-weight: 600; color: #334155; }
        .contact { margin-top: 10px; font-size: 13px; line-height: 1.6; color: #475569; }
        .section { margin-top: 18px; }
        h2 { margin: 0 0 8px; font-size: 14px; letter-spacing: 0.15em; text-transform: uppercase; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; text-align: left; }
        .entry { margin-bottom: 12px; text-align: left; }
        .entry h3 { margin: 0 0 2px; font-size: 15px; color: #0f172a; }
        .meta { font-size: 13px; color: #475569; font-weight: 600; margin-bottom: 2px; }
        .description { margin: 0; font-size: 13px; line-height: 1.6; color: #334155; }
        .skill-group { margin-bottom: 4px; font-size: 13px; line-height: 1.6; }
        .skill-group strong { color: #0f172a; }
      </style>
    </head>
    <body>
      <div class="page">
        <header class="header">
          <h1>\${escapeHtml(profile.personal.fullName || profile.prn)}</h1>
          <p class="headline">\${escapeHtml(profile.headline || '')}</p>
          <div class="contact">
            \${escapeHtml(joinNonEmpty([profile.personal.city, profile.personal.state], ', '))} <br/>
            \${escapeHtml(joinNonEmpty([profile.personal.email || profile.personal.collegeEmail, profile.personal.mobile], ' | '))} <br/>
            \${escapeHtml(profile.personal.linkedin)} <br/>
            \${escapeHtml(profile.personal.github)}
          </div>
        </header>
        
        \${renderListSection('Education', educationEntries, (item) => \`
          <div class="entry">
             <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="left"><h3>\${escapeHtml(item.title)}</h3></td>
                <td align="right" class="meta">\${escapeHtml(item.subtitle)}</td>
              </tr>
            </table>
          </div>
        \`)}
        
        \${renderListSection('Experience', selections.experience, (item) => \`
          <div class="entry">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="left"><h3>\${escapeHtml(item.role || item.type)} at \${escapeHtml(item.companyName)}</h3></td>
                <td align="right" class="meta">\${escapeHtml(item.duration)}</td>
              </tr>
            </table>
            <p class="description">\${escapeHtml(item.description)}</p>
          </div>
        \`)}
        
        \${renderListSection('Technical Skills', [[profile.skills]], () => \`
          <div class="entry">
            \${profile.skills.languages.length ? \`<p class="skill-group"><strong>Programming Languages:</strong> \${escapeHtml(profile.skills.languages.join(', '))}</p>\` : ''}
            \${profile.skills.frameworks.length ? \`<p class="skill-group"><strong>Web Technologies & Frameworks:</strong> \${escapeHtml(profile.skills.frameworks.join(', '))}</p>\` : ''}
            \${profile.skills.tools.length ? \`<p class="skill-group"><strong>Tools:</strong> \${escapeHtml(profile.skills.tools.join(', '))}</p>\` : ''}
            \${profile.skills.otherLanguages.length ? \`<p class="skill-group"><strong>Core Concepts:</strong> \${escapeHtml(profile.skills.otherLanguages.join(', '))}</p>\` : ''}
          </div>
        \`)}
        
        \${renderListSection('Projects', selections.projects, (item) => \`
          <div class="entry">
             <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="left"><h3>\${escapeHtml(item.title)}</h3></td>
                <td align="right" class="meta">\${escapeHtml(item.techStack)}</td>
              </tr>
            </table>
            <p class="description">\${escapeHtml(item.description)}</p>
            \${item.githubLink || item.liveLink ? \`<p class="description">Links: \${escapeHtml(joinNonEmpty([item.githubLink, item.liveLink], ' | '))}</p>\` : ''}
          </div>
        \`)}
        
        \${renderListSection('Certificates', selections.certifications, (item) => \`
          <div class="entry">
             <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="left"><h3>\${escapeHtml(item.name)}</h3></td>
                <td align="right" class="meta">\${escapeHtml(item.platform)}</td>
              </tr>
            </table>
          </div>
        \`)}
        
        \${renderListSection('Extracurricular Activities', selections.activities, (item) => \`
          <div class="entry">
            <h3>\${escapeHtml(item.title)}</h3>
            <p class="description">\${escapeHtml(item.description)}</p>
          </div>
        \`)}
      </div>
    </body>
  </html>\`;
}`;
content = content.replace(modernRegex, newModern);

// 5. Replace PDF generation logic in /generate
const generateStringBlock = `    const wordFileName = \`\${safeTitle || 'resume'}-\${timestamp}.doc\`;
    const previewFileName = \`\${safeTitle || 'resume'}-\${timestamp}.html\`;
    const folder = \`student-resumes/\${sanitizeFileName(prn)}\`;

    const wordUpload = await uploadFile(
      {
        originalname: wordFileName,
        mimetype: 'application/msword',
        buffer: Buffer.from(documentContent, 'utf8'),
      },
      folder
    );

    const previewUpload = await uploadFile(
      {
        originalname: previewFileName,
        mimetype: 'text/html',
        buffer: Buffer.from(documentContent, 'utf8'),
      },
      folder
    );`;

const newGenerateStringBlock = `    const wordFileName = \`\${safeTitle || 'resume'}-\${timestamp}.doc\`;
    const previewFileName = \`\${safeTitle || 'resume'}-\${timestamp}.pdf\`;
    const folder = \`student-resumes/\${sanitizeFileName(prn)}\`;

    const wordUpload = await uploadFile(
      {
        originalname: wordFileName,
        mimetype: 'application/msword',
        buffer: Buffer.from(documentContent, 'utf8'),
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
      await page.setContent(documentContent, { waitUntil: 'networkidle0' });
      pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
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
    );`;

content = content.replace(generateStringBlock, newGenerateStringBlock);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated student_resume_routes.js');
