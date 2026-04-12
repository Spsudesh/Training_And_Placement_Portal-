const express = require('express');

const db = require('../../../config/db').db;
const { uploadFile } = require('../../../config/storageService');

const studentResumeRoutes = express.Router();

function query(sql, values = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, values, (error, result) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(result);
    });
  });
}

async function safeQuery(sql, values = [], fallback = []) {
  try {
    return await query(sql, values);
  } catch {
    return fallback;
  }
}

async function tableExists(tableName) {
  const rows = await safeQuery('SHOW TABLES LIKE ?', [tableName], []);
  return rows.length > 0;
}

async function columnExists(tableName, columnName) {
  const rows = await safeQuery(`SHOW COLUMNS FROM ${tableName} LIKE ?`, [columnName], []);
  return rows.length > 0;
}

function sanitizeFileName(value) {
  return String(value || 'resume')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .toLowerCase();
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function joinNonEmpty(values, separator = ' | ') {
  return values.filter(Boolean).join(separator);
}

function joinLines(values) {
  return values.filter(Boolean).join('<br />');
}

function buildFullName(row) {
  return [row.first_name, row.middle_name, row.last_name].filter(Boolean).join(' ').trim();
}

function formatMonthYear(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString('en-IN', {
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

async function ensureStudentResumesTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS student_resumes (
      id BIGINT NOT NULL AUTO_INCREMENT,
      PRN VARCHAR(20) NOT NULL,
      opportunity_id INT NULL,
      template_code VARCHAR(50) NULL,
      resume_title VARCHAR(255) NULL,
      file_name VARCHAR(255) NOT NULL,
      file_url TEXT NOT NULL,
      preview_file_name VARCHAR(255) NULL,
      preview_file_path TEXT NULL,
      preview_file_url TEXT NULL,
      file_size INT NULL,
      mime_type VARCHAR(100) NULL,
      is_default TINYINT(1) NULL DEFAULT 0,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_student_resumes_prn (PRN),
      KEY idx_student_resumes_created_at (created_at)
    )
  `);
}

async function fetchStudentResumeProfile(prn) {
  const hasEducation = await tableExists('student_education');
  const hasSkills = await tableExists('student_skills');
  const hasProjects = await tableExists('student_projects');
  const hasExperience = await tableExists('student_experience');
  const hasCertifications = await tableExists('student_certifications');
  const hasActivities = await tableExists('student_activities');
  const hasProfileSummary = await tableExists('student_profile_summary');

  const [personalRows, educationRows, skillRows, projectRows, experienceRows, certificationRows, activityRows, summaryRows] = await Promise.all([
    query('SELECT * FROM student_personal WHERE PRN = ? LIMIT 1', [prn]),
    hasEducation ? safeQuery('SELECT * FROM student_education WHERE PRN = ? LIMIT 1', [prn], []) : [],
    hasSkills ? safeQuery(
      `
        SELECT skill_name, skill_type
        FROM student_skills
        WHERE PRN = ?
        ORDER BY skill_name ASC
      `,
      [prn],
      []
    ) : [],
    hasProjects ? safeQuery(
      `
        SELECT project_number, title, description, tech_stack, github_link, live_link, include_in_resume
        FROM student_projects
        WHERE PRN = ?
        ORDER BY project_number ASC
      `,
      [prn],
      []
    ) : [],
    hasExperience ? safeQuery(
      `
        SELECT exp_number, type, company_name, duration_summary, duration, role, description
        FROM student_experience
        WHERE PRN = ?
        ORDER BY exp_number ASC
      `,
      [prn],
      []
    ) : [],
    hasCertifications ? safeQuery(
      `
        SELECT cert_number, name, platform
        FROM student_certifications
        WHERE PRN = ?
        ORDER BY cert_number ASC
      `,
      [prn],
      []
    ) : [],
    hasActivities ? safeQuery(
      `
        SELECT act_number, title, description, link
        FROM student_activities
        WHERE PRN = ?
        ORDER BY act_number ASC
      `,
      [prn],
      []
    ) : [],
    hasProfileSummary
      ? safeQuery('SELECT summary FROM student_profile_summary WHERE PRN = ? LIMIT 1', [prn], [])
      : [],
  ]);

  if (!personalRows.length) {
    return null;
  }

  const personal = personalRows[0];
  const education = educationRows[0] || {};
  const summary = summaryRows[0]?.summary || '';

  return {
    prn,
    personal: {
      fullName: buildFullName(personal),
      email: personal.personal_email || '',
      collegeEmail: personal.college_email || '',
      mobile: personal.mobile || '',
      city: personal.city || '',
      district: personal.district || '',
      state: personal.state || '',
      linkedin: personal.linkedin_url || personal.linkedin || '',
      github: personal.github_url || personal.github || '',
      portfolio: personal.portfolio_url || personal.portfolio || '',
    },
    headline: joinNonEmpty([
      education.department || '',
      education.passing_year ? `Passing ${education.passing_year}` : '',
    ]),
    summary,
    education: {
      department: education.department || '',
      currentCgpa: education.current_cgpa ?? '',
      percentage: education.percentage ?? '',
      passingYear: education.passing_year ?? '',
      tenth: education.tenth_year
        ? {
            board: education.tenth_board || '',
            marks: education.tenth_marks ?? '',
            year: education.tenth_year ?? '',
          }
        : null,
      twelfth: education.twelfth_year
        ? {
            board: education.twelfth_board || '',
            marks: education.twelfth_marks ?? '',
            year: education.twelfth_year ?? '',
          }
        : null,
      diploma: education.diploma_year
        ? {
            institute: education.diploma_institute || '',
            marks: education.diploma_marks ?? '',
            year: education.diploma_year ?? '',
          }
        : null,
    },
    skills: {
      languages: skillRows.filter((item) => item.skill_type === 'language').map((item) => item.skill_name),
      frameworks: skillRows.filter((item) => item.skill_type === 'framework').map((item) => item.skill_name),
      tools: skillRows.filter((item) => item.skill_type === 'tool').map((item) => item.skill_name),
      otherLanguages: skillRows.filter((item) => item.skill_type === 'other_language').map((item) => item.skill_name),
    },
    projects: projectRows.map((item) => ({
      id: item.project_number,
      title: item.title || '',
      description: item.description || '',
      techStack: item.tech_stack || '',
      githubLink: item.github_link || '',
      liveLink: item.live_link || '',
      includeInResume: Boolean(item.include_in_resume),
    })),
    experience: experienceRows.map((item) => ({
      id: item.exp_number,
      type: item.type || '',
      companyName: item.company_name || '',
      role: item.role || '',
      duration: item.duration_summary || item.duration || '',
      description: item.description || '',
    })),
    certifications: certificationRows.map((item) => ({
      id: item.cert_number,
      name: item.name || '',
      platform: item.platform || '',
    })),
    activities: activityRows.map((item) => ({
      id: item.act_number,
      title: item.title || '',
      description: item.description || '',
      link: item.link || '',
    })),
  };
}

function selectItemsByIds(items, ids) {
  const selectedIds = new Set((ids || []).map((item) => Number(item)).filter(Boolean));

  if (!selectedIds.size) {
    return [];
  }

  return items.filter((item) => selectedIds.has(Number(item.id)));
}

function renderListSection(title, items, renderItem) {
  if (!items.length) {
    return '';
  }

  return `
    <section class="section">
      <h2>${escapeHtml(title)}</h2>
      ${items.map(renderItem).join('')}
    </section>
  `;
}

function buildContactItems(profile) {
  return [
    joinNonEmpty([profile.personal.city, profile.personal.state], ', '),
    profile.personal.email || profile.personal.collegeEmail,
    profile.personal.mobile,
    profile.personal.linkedin,
    profile.personal.github,
    profile.personal.portfolio,
  ].filter(Boolean);
}

function buildEducationEntries(profile) {
  const entries = [];

  if (profile.education.department || profile.education.passingYear || profile.education.currentCgpa) {
    entries.push({
      title: profile.education.department || 'Bachelor of Technology',
      subtitle: joinNonEmpty([
        profile.education.passingYear ? `Passing Year ${profile.education.passingYear}` : '',
        profile.education.currentCgpa ? `CGPA ${profile.education.currentCgpa}` : '',
        profile.education.percentage ? `${profile.education.percentage}%` : '',
      ]),
    });
  }

  if (profile.education.diploma) {
    entries.push({
      title: profile.education.diploma.institute || 'Diploma',
      subtitle: joinNonEmpty([
        profile.education.diploma.year ? `Year ${profile.education.diploma.year}` : '',
        profile.education.diploma.marks ? `Marks ${profile.education.diploma.marks}` : '',
      ]),
    });
  }

  if (profile.education.twelfth) {
    entries.push({
      title: profile.education.twelfth.board || 'Class XII',
      subtitle: joinNonEmpty([
        profile.education.twelfth.year ? `Year ${profile.education.twelfth.year}` : '',
        profile.education.twelfth.marks ? `${profile.education.twelfth.marks}%` : '',
      ]),
    });
  }

  if (profile.education.tenth) {
    entries.push({
      title: profile.education.tenth.board || 'Class X',
      subtitle: joinNonEmpty([
        profile.education.tenth.year ? `Year ${profile.education.tenth.year}` : '',
        profile.education.tenth.marks ? `${profile.education.tenth.marks}%` : '',
      ]),
    });
  }

  return entries;
}

function buildClassicTemplate(profile, selections) {
  const skillItems = [
    ...profile.skills.languages,
    ...profile.skills.frameworks,
    ...profile.skills.tools,
    ...profile.skills.otherLanguages,
  ].filter(Boolean);
  const contactItems = buildContactItems(profile);
  const educationEntries = buildEducationEntries(profile);

  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(profile.personal.fullName)} Resume</title>
      <style>
        body { font-family: Calibri, Arial, sans-serif; background: #eef3f8; margin: 0; padding: 28px; color: #111827; }
        .page { max-width: 920px; margin: 0 auto; background: #fff; padding: 42px 48px 36px; box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08); }
        .header { border-bottom: 3px solid #0f172a; padding-bottom: 16px; }
        h1 { margin: 0; font-size: 34px; line-height: 1.1; letter-spacing: 0.02em; text-transform: uppercase; }
        .headline { margin-top: 8px; font-size: 16px; color: #334155; font-weight: 600; }
        .contact { margin-top: 10px; font-size: 13px; line-height: 1.6; color: #475569; }
        .section { margin-top: 22px; }
        h2 { margin: 0 0 10px; font-size: 14px; letter-spacing: 0.2em; text-transform: uppercase; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; }
        .entry { margin-bottom: 14px; }
        .entry h3 { margin: 0 0 4px; font-size: 16px; color: #111827; }
        .meta { color: #475569; font-size: 13px; margin-bottom: 4px; font-weight: 600; }
        .description { margin: 0; font-size: 13px; line-height: 1.65; color: #334155; }
        .skill-group { margin-bottom: 8px; font-size: 13px; line-height: 1.6; }
        .skill-group strong { color: #111827; }
        .summary { margin: 0; font-size: 13px; line-height: 1.65; color: #334155; }
      </style>
    </head>
    <body>
      <div class="page">
        <header class="header">
          <h1>${escapeHtml(profile.personal.fullName || profile.prn)}</h1>
          <p class="headline">${escapeHtml(profile.headline || 'Computer Science and Engineering')}</p>
          <div class="contact">
            ${joinLines([
              escapeHtml(joinNonEmpty(contactItems, ' | ')),
              `PRN: ${escapeHtml(profile.prn)}`,
            ])}
          </div>
        </header>
        ${renderListSection('Education', educationEntries, (item) => `
          <div class="entry">
            <h3>${escapeHtml(item.title)}</h3>
            <p class="meta">${escapeHtml(item.subtitle)}</p>
          </div>
        `)}
        ${renderListSection('Experience', selections.experience, (item) => `
          <div class="entry">
            <h3>${escapeHtml(item.role || item.type || 'Experience')}</h3>
            <p class="meta">${escapeHtml(joinNonEmpty([item.companyName, item.duration], ' - '))}</p>
            <p class="description">${escapeHtml(item.description)}</p>
          </div>
        `)}
        ${renderListSection('Technical Skills', [profile.skills], () => `
          ${profile.skills.languages.length ? `<p class="skill-group"><strong>Programming Languages:</strong> ${escapeHtml(profile.skills.languages.join(', '))}</p>` : ''}
          ${profile.skills.frameworks.length ? `<p class="skill-group"><strong>Frameworks & Web Technologies:</strong> ${escapeHtml(profile.skills.frameworks.join(', '))}</p>` : ''}
          ${profile.skills.tools.length ? `<p class="skill-group"><strong>Tools & Software:</strong> ${escapeHtml(profile.skills.tools.join(', '))}</p>` : ''}
          ${profile.skills.otherLanguages.length ? `<p class="skill-group"><strong>Other Skills:</strong> ${escapeHtml(profile.skills.otherLanguages.join(', '))}</p>` : ''}
        `)}
        ${renderListSection('Projects', selections.projects, (item) => `
          <div class="entry">
            <h3>${escapeHtml(item.title)}</h3>
            <p class="meta">${escapeHtml(item.techStack)}</p>
            <p class="description">${escapeHtml(item.description)}</p>
          </div>
        `)}
        ${renderListSection('Certificates', selections.certifications, (item) => `
          <div class="entry">
            <h3>${escapeHtml(item.name)}</h3>
            <p class="meta">${escapeHtml(item.platform)}</p>
          </div>
        `)}
        ${renderListSection('Extracurricular Activities', selections.activities, (item) => `
          <div class="entry">
            <h3>${escapeHtml(item.title)}</h3>
            <p class="description">${escapeHtml(item.description)}</p>
          </div>
        `)}
        ${profile.summary ? `<section class="section"><h2>Profile Summary</h2><p class="summary">${escapeHtml(profile.summary)}</p></section>` : ''}
      </div>
    </body>
  </html>`;
}

function buildModernTemplate(profile, selections) {
  const skillItems = [
    ...profile.skills.languages,
    ...profile.skills.frameworks,
    ...profile.skills.tools,
    ...profile.skills.otherLanguages,
  ].filter(Boolean);
  const contactItems = buildContactItems(profile);
  const educationEntries = buildEducationEntries(profile);

  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(profile.personal.fullName)} Resume</title>
      <style>
        body { font-family: Calibri, Arial, sans-serif; background: #f4f7fb; margin: 0; padding: 28px; color: #0f172a; }
        .page { max-width: 940px; margin: 0 auto; background: #ffffff; box-shadow: 0 18px 42px rgba(15, 23, 42, 0.08); }
        .hero { background: linear-gradient(135deg, #16324f 0%, #214e72 100%); padding: 34px 40px 28px; color: #ffffff; text-align: center; }
        .body { padding: 28px 36px 34px; }
        h1 { margin: 0; font-size: 31px; line-height: 1.1; text-transform: uppercase; color: #ffffff; letter-spacing: 0.02em; }
        .headline { margin-top: 10px; font-size: 15px; font-weight: 600; color: #dbeafe; }
        .contact { margin-top: 14px; font-size: 13px; line-height: 1.7; color: #eff6ff; }
        .summary-panel { margin-top: 18px; border-radius: 18px; background: rgba(255,255,255,0.1); padding: 14px 16px; text-align: left; }
        .section { margin-top: 22px; }
        h2 { margin: 0 0 10px; font-size: 13px; letter-spacing: 0.24em; text-transform: uppercase; color: #16324f; border-bottom: 1px solid #dbeafe; padding-bottom: 6px; }
        .grid { display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 22px; }
        .entry { margin-bottom: 14px; }
        .entry h3 { margin: 0 0 4px; font-size: 15px; color: #0f172a; }
        .meta { font-size: 12.5px; color: #475569; font-weight: 600; margin-bottom: 4px; }
        .description { margin: 0; font-size: 13px; line-height: 1.65; color: #334155; }
        .skill-pill { display: inline-block; margin: 0 8px 8px 0; padding: 6px 10px; border-radius: 999px; background: rgba(34, 211, 238, 0.1); color: #0f766e; font-size: 12px; font-weight: 600; border: 1px solid rgba(34, 211, 238, 0.18); }
        .summary { margin: 0; font-size: 13px; line-height: 1.7; color: #334155; }
      </style>
    </head>
    <body>
      <div class="page">
        <header class="hero">
          <h1>${escapeHtml(profile.personal.fullName || profile.prn)}</h1>
          <p class="headline">${escapeHtml(profile.headline || 'Computer Science and Engineering')}</p>
          <div class="contact">
            ${escapeHtml(joinNonEmpty([
              ...contactItems,
              profile.prn ? `PRN ${profile.prn}` : '',
            ], ' | '))}
          </div>
          ${profile.summary ? `<div class="summary-panel"><p class="summary">${escapeHtml(profile.summary)}</p></div>` : ''}
        </header>
        <main class="body">
          ${renderListSection('Education', educationEntries, (item) => `
            <div class="entry">
              <h3>${escapeHtml(item.title)}</h3>
              <p class="meta">${escapeHtml(item.subtitle)}</p>
            </div>
          `)}
          <div class="grid">
            <div>
              ${renderListSection('Experience', selections.experience, (item) => `
                <div class="entry">
                  <h3>${escapeHtml(item.role || item.type || 'Experience')}</h3>
                  <p class="meta">${escapeHtml(joinNonEmpty([item.companyName, item.duration], ' - '))}</p>
                  <p class="description">${escapeHtml(item.description)}</p>
                </div>
              `)}
              ${renderListSection('Projects', selections.projects, (item) => `
                <div class="entry">
                  <h3>${escapeHtml(item.title)}</h3>
                  <p class="meta">${escapeHtml(item.techStack)}</p>
                  <p class="description">${escapeHtml(item.description)}</p>
                </div>
              `)}
            </div>
            <div>
              ${renderListSection('Technical Skills', [skillItems], (items) => `
                <div>${items.map((item) => `<span class="skill-pill">${escapeHtml(item)}</span>`).join('')}</div>
              `)}
              ${renderListSection('Certificates', selections.certifications, (item) => `
                <div class="entry">
                  <h3>${escapeHtml(item.name)}</h3>
                  <p class="meta">${escapeHtml(item.platform)}</p>
                </div>
              `)}
              ${renderListSection('Extracurricular Activities', selections.activities, (item) => `
                <div class="entry">
                  <h3>${escapeHtml(item.title)}</h3>
                  <p class="description">${escapeHtml(item.description)}</p>
                </div>
              `)}
            </div>
          </div>
        </main>
      </div>
    </body>
  </html>`;
}

function buildResumeDocument(templateCode, profile, selections) {
  if (templateCode === 'resume_02') {
    return buildModernTemplate(profile, selections);
  }

  return buildClassicTemplate(profile, selections);
}

studentResumeRoutes.get('/templates', async (req, res) => {
  res.json({
    message: 'Resume templates fetched successfully.',
    data: [
      {
        id: 'resume_01',
        name: 'Resume 01',
        description: 'Structured single-page layout with the same section flow as your uploaded first Word template.',
        previewUrl: '/resume_01.docx',
        previewType: 'docx',
        sections: ['Header', 'Education', 'Experience', 'Technical Skills', 'Projects', 'Certificates', 'Extracurricular Activities'],
      },
      {
        id: 'resume_02',
        name: 'Resume 02',
        description: 'Two-panel layout based on your uploaded second Word template with the same core section ordering.',
        previewUrl: '/resume_02.docx',
        previewType: 'docx',
        sections: ['Header', 'Education', 'Experience', 'Technical Skills', 'Projects', 'Certificates', 'Extracurricular Activities'],
      },
    ],
  });
});

studentResumeRoutes.get('/', async (req, res) => {
  try {
    await ensureStudentResumesTable();

    const prn = req.auth?.prn;
    const rows = await query(
      `
        SELECT
          id,
          template_code,
          resume_title,
          file_name,
          file_url,
          preview_file_name,
          preview_file_url,
          opportunity_id,
          file_size,
          mime_type,
          is_default,
          created_at,
          updated_at
        FROM student_resumes
        WHERE PRN = ?
        ORDER BY created_at DESC, id DESC
      `,
      [prn]
    );

    res.json({
      message: 'Student resumes fetched successfully.',
      data: rows.map((row) => ({
        id: row.id,
        templateCode: row.template_code,
        title: row.resume_title,
        fileName: row.file_name,
        fileUrl: row.file_url,
        wordFileName: row.file_name,
        wordFileUrl: row.file_url,
        previewFileName: row.preview_file_name || row.file_name,
        previewFileUrl: row.preview_file_url || row.file_url,
        opportunityId: row.opportunity_id,
        fileSize: row.file_size,
        mimeType: row.mime_type,
        isDefault: Boolean(row.is_default),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        createdLabel: formatDateTime(row.created_at),
      })),
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch student resumes.',
      error: error.message,
    });
  }
});

studentResumeRoutes.get('/:id', async (req, res) => {
  try {
    await ensureStudentResumesTable();

    const prn = req.auth?.prn;
    const rows = await query(
      `
        SELECT
          id,
          template_code,
          resume_title,
          file_name,
          file_url,
          preview_file_name,
          preview_file_url,
          opportunity_id,
          file_size,
          mime_type,
          is_default,
          created_at,
          updated_at
        FROM student_resumes
        WHERE id = ? AND PRN = ?
        LIMIT 1
      `,
      [req.params.id, prn]
    );

    const row = rows[0];

    if (!row) {
      res.status(404).json({
        message: 'Resume not found.',
      });
      return;
    }

    res.json({
      message: 'Student resume fetched successfully.',
      data: {
        id: row.id,
        templateCode: row.template_code,
        title: row.resume_title,
        fileName: row.file_name,
        fileUrl: row.file_url,
        wordFileName: row.file_name,
        wordFileUrl: row.file_url,
        previewFileName: row.preview_file_name || row.file_name,
        previewFileUrl: row.preview_file_url || row.file_url,
        opportunityId: row.opportunity_id,
        fileSize: row.file_size,
        mimeType: row.mime_type,
        isDefault: Boolean(row.is_default),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        createdLabel: formatDateTime(row.created_at),
      },
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch student resume.',
      error: error.message,
    });
  }
});

studentResumeRoutes.post('/generate', async (req, res) => {
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
    const resumeTitle = String(req.body?.resumeTitle || `${profile.personal.fullName || prn} Resume`).trim();
    const selections = {
      projects: selectItemsByIds(profile.projects, req.body?.selectedProjects),
      certifications: selectItemsByIds(profile.certifications, req.body?.selectedCertifications),
      experience: selectItemsByIds(profile.experience, req.body?.selectedExperience),
      activities: selectItemsByIds(profile.activities, req.body?.selectedActivities),
    };

    const documentContent = buildResumeDocument(templateCode, profile, selections);

    const timestamp = Date.now();
    const safeTitle = sanitizeFileName(resumeTitle || `${prn}-resume`);
    const wordFileName = `${safeTitle || 'resume'}-${timestamp}.doc`;
    const previewFileName = `${safeTitle || 'resume'}-${timestamp}.html`;
    const folder = `student-resumes/${sanitizeFileName(prn)}`;

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
    );

    const insertResult = await query(
      `
        INSERT INTO student_resumes
        (PRN, opportunity_id, template_code, resume_title, file_name, file_url, preview_file_name, preview_file_path, preview_file_url, file_size, mime_type, is_default)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
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
        Buffer.byteLength(documentContent, 'utf8'),
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
});

module.exports = studentResumeRoutes;
