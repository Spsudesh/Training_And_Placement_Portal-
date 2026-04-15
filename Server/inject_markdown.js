const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'routes/student_routes/resume/student_resume_routes.js');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add requires
const requireRegex = /const express = require\('express'\);\nconst puppeteer = require\('puppeteer'\);/g;
if (!content.includes("const Handlebars = require('handlebars')")) {
  content = content.replace(
    "const puppeteer = require('puppeteer');",
    "const puppeteer = require('puppeteer');\nconst Handlebars = require('handlebars');\nconst { marked } = require('marked');\nconst fs = require('fs');\nconst path = require('path');\n\nHandlebars.registerHelper('join', function(array) {\n  if (!Array.isArray(array)) return '';\n  return array.filter(Boolean).join(', ');\n});\n"
  );
}

// 2. Replace buildClassicTemplate, buildModernTemplate, and buildResumeDocument with new setup
const oldBuildRegex = /function buildClassicTemplate[\s\S]*?function buildResumeDocument[^{]*\{[\s\S]*?\n\}/;

const newBuildCode = `
const CSS_STYLES = \`
  * { box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background: #fff; margin: 0; padding: 40px; color: #111; font-size: 11.5px; line-height: 1.5; }
  h1 { margin: 0 0 5px 0; font-size: 26px; line-height: 1.1; letter-spacing: 2px; text-transform: uppercase; color: #000; font-weight: 600; text-align: center; }
  h2 { margin: 18px 0 10px 0; font-size: 13px; letter-spacing: 1px; text-transform: uppercase; color: #000; border-bottom: 1px solid #ccc; padding-bottom: 4px; font-weight: 600; }
  h3 { margin: 0 0 3px 0; font-size: 12.5px; font-weight: bold; color: #111; }
  p { margin: 0 0 6px 0; }
  ul { margin: 0 0 10px 0; padding-left: 20px; }
  li { margin-bottom: 4px; }
  em { color: #555; font-style: italic; }
  .resume-header { text-align: center; margin-bottom: 25px; }
  .resume-header h3 { font-size: 15px; font-weight: 500; color: #444; letter-spacing: 0; margin-bottom: 6px; }
  .resume-columns { display: flex; gap: 30px; }
  .resume-left { width: 35%; flex-shrink: 0; border-right: 1px solid #eee; padding-right: 25px; }
  .resume-right { width: 65%; flex-shrink: 0; }
\`;

function buildResumeDocument(templateCode, profile, selections) {
  const templatePath = path.join(__dirname, '..', '..', '..', 'templates', \`\${templateCode}.md\`);
  let templateMarkdown = '';
  try {
    templateMarkdown = fs.readFileSync(templatePath, 'utf8');
  } catch (err) {
    templateMarkdown = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'templates', 'resume_02.md'), 'utf8');
  }

  const template = Handlebars.compile(templateMarkdown);
  const hydratedMarkdown = template({ profile, selections });
  const htmlContent = marked.parse(hydratedMarkdown);

  const html = \`<!doctype html><html><head><meta charset="utf-8"/><style>\${CSS_STYLES}</style></head><body><div style="width: 794px; margin: 0 auto;">\${htmlContent}</div></body></html>\`;
  
  return { markdown: hydratedMarkdown, html };
}
`;

content = content.replace(oldBuildRegex, newBuildCode);

// 3. Update /generate endpoint to use { markdown, html } and save markdown as main file
const oldGenerateUsage = /const documentContent = buildResumeDocument\(templateCode, profile, selections\);\n\n    const timestamp = Date\.now\(\);[\s\S]*?wordUpload = await uploadFile\(\s*\{\s*originalname: wordFileName,\s*mimetype: 'application\/msword',\s*buffer: Buffer\.from\(documentContent, 'utf8'\),\s*\},\s*folder\s*\);/;

const newGenerateUsage = `const { markdown, html } = buildResumeDocument(templateCode, profile, selections);

    const timestamp = Date.now();
    const safeTitle = sanitizeFileName(resumeTitle || \`\${prn}-resume\`);
    // Save raw Markdown file as fallback/editable element
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
    );`;

content = content.replace(oldGenerateUsage, newGenerateUsage);

// 4. Update the puppeteer setContent param (from documentContent to html)
const oldPuppeteerCall = /await page\.setContent\(documentContent, \{ waitUntil: 'networkidle0' \}\);/;
const newPuppeteerCall = `await page.setContent(html, { waitUntil: 'networkidle0' });`;
content = content.replace(oldPuppeteerCall, newPuppeteerCall);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully injected Markdown Blueprint Engine.');
