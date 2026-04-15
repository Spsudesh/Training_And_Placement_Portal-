const express = require('express');
const puppeteer = require('puppeteer');

const db = require('../../../config/db').db;
const { uploadFile } = require('../../../config/storageService');
const { ensureCertificationDurationColumns } = require('../../../utils/ensureCertificationDurationColumns');

const atsResumeRoutes = express.Router();
const DEFAULT_CURRENT_COLLEGE_NAME = 'Rajarambapu Institute of technology , Rajaramanagar';

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

function normalizeUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
}

function renderExternalLink(url, label) {
  const href = normalizeUrl(url);
  if (!href) return '';
  return `<a class="external-link" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`;
}

function buildFullName(row) {
  return [row.first_name, row.middle_name, row.last_name].filter(Boolean).join(' ').trim();
}

function hasMeaningfulText(value) {
  return String(value || '').trim().length > 0;
}

function hasSkills(profile) {
  return Boolean(
    profile?.skills?.languages?.length ||
      profile?.skills?.frameworks?.length ||
      profile?.skills?.tools?.length ||
      profile?.skills?.otherLanguages?.length,
  );
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
  await ensureCertificationDurationColumns();

  const hasEducation = await tableExists('student_education');
  const hasSkills = await tableExists('student_skills');
  const hasProjects = await tableExists('student_projects');
  const hasExperience = await tableExists('student_experience');
  const hasCertifications = await tableExists('student_certifications');
  const hasActivities = await tableExists('student_activities');
  const hasProfileSummary = await tableExists('student_profile_summary');

  const [
    personalRows,
    educationRows,
    skillRows,
    projectRows,
    experienceRows,
    certificationRows,
    activityRows,
    summaryRows,
  ] = await Promise.all([
    query('SELECT * FROM student_personal WHERE PRN = ? LIMIT 1', [prn]),
    hasEducation ? safeQuery('SELECT * FROM student_education WHERE PRN = ? LIMIT 1', [prn], []) : [],
    hasSkills
      ? safeQuery(
          `
            SELECT skill_name, skill_type
            FROM student_skills
            WHERE PRN = ?
            ORDER BY skill_name ASC
          `,
          [prn],
          [],
        )
      : [],
    hasProjects
      ? safeQuery(
          `
            SELECT project_number, title, description, tech_stack, github_link, live_link, include_in_resume
            FROM student_projects
            WHERE PRN = ?
            ORDER BY project_number ASC
          `,
          [prn],
          [],
        )
      : [],
    hasExperience
      ? safeQuery(
          `
            SELECT exp_number, type, company_name, duration_summary, duration, role, description
            FROM student_experience
            WHERE PRN = ?
            ORDER BY exp_number ASC
          `,
          [prn],
          [],
        )
      : [],
    hasCertifications
      ? safeQuery(
          `
            SELECT cert_number, name, platform, link
            FROM student_certifications
            WHERE PRN = ?
            ORDER BY cert_number ASC
          `,
          [prn],
          [],
        )
      : [],
    hasActivities
      ? safeQuery(
          `
            SELECT act_number, title, description, link
            FROM student_activities
            WHERE PRN = ?
            ORDER BY act_number ASC
          `,
          [prn],
          [],
        )
      : [],
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
      state: personal.state || '',
      linkedin: personal.linkedin_url || personal.linkedin || '',
      github: personal.github_url || personal.github || '',
      profilePhotoUrl: personal.profile_photo_url || '',
    },
    summary,
    education: {
      department: education.department || '',
      currentCgpa: education.current_cgpa ?? '',
      percentage: education.percentage ?? '',
      passingYear: education.passing_year ?? '',
      tenth: education.tenth_year
        ? {
            schoolName: education.tenth_school_name || '',
            board: education.tenth_board || '',
            marks: education.tenth_marks ?? '',
            year: education.tenth_year ?? '',
          }
        : null,
      twelfth: education.twelfth_year
        ? {
            collegeName: education.twelfth_college_name || '',
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
      otherLanguages: skillRows
        .filter((item) => item.skill_type === 'other_language')
        .map((item) => item.skill_name),
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
      link: item.link || '',
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

function buildEducationEntries(profile) {
  const entries = [];

  if (profile.education.department || profile.education.passingYear || profile.education.currentCgpa) {
    entries.push({
      title: DEFAULT_CURRENT_COLLEGE_NAME,
      period: profile.education.passingYear ? `Passing ${profile.education.passingYear}` : '',
      detail: joinNonEmpty([
        'Current Degree',
        profile.education.currentCgpa ? `CGPA: ${profile.education.currentCgpa}` : '',
        profile.education.percentage ? `Score: ${profile.education.percentage}` : '',
      ], ' | '),
    });
  }

  if (profile.education.diploma) {
    entries.push({
      title: profile.education.diploma.institute || 'Diploma',
      period: profile.education.diploma.year ? `${profile.education.diploma.year}` : '',
      detail: joinNonEmpty([
        'Diploma',
        profile.education.department || '',
        profile.education.diploma.marks ? `Score: ${profile.education.diploma.marks}` : '',
      ], ' | '),
    });
  }

  if (profile.education.twelfth) {
    entries.push({
      title: profile.education.twelfth.collegeName || profile.education.twelfth.board || 'Class XII',
      period: profile.education.twelfth.year ? `${profile.education.twelfth.year}` : '',
      detail: joinNonEmpty([
        'HSC (Class XII)',
        profile.education.twelfth.marks ? `Score: ${profile.education.twelfth.marks}` : '',
      ], ' | '),
    });
  }

  if (profile.education.tenth) {
    entries.push({
      title: profile.education.tenth.schoolName || profile.education.tenth.board || 'Class X',
      period: profile.education.tenth.year ? `${profile.education.tenth.year}` : '',
      detail: joinNonEmpty([
        'SSC (Class X)',
        profile.education.tenth.marks ? `Score: ${profile.education.tenth.marks}` : '',
      ], ' | '),
    });
  }

  return entries;
}

function buildSectionOrder(requestedOrder, availableSections) {
  const validKeys = ['summary', 'education', 'experience', 'projects', 'skills', 'certifications', 'activities'];
  const requestedKeys = Array.isArray(requestedOrder)
    ? requestedOrder.map((item) => String(item || '').trim().toLowerCase()).filter(Boolean)
    : [];
  const uniqueRequestedKeys = requestedKeys.filter(
    (key, index) => validKeys.includes(key) && requestedKeys.indexOf(key) === index,
  );
  const fallbackOrder = validKeys.filter((key) => availableSections[key]);

  if (!uniqueRequestedKeys.length) {
    return fallbackOrder;
  }

  return uniqueRequestedKeys.filter((key) => availableSections[key]);
}

function buildSectionMarkup(profile, selections, sectionKey) {
  switch (sectionKey) {
    case 'summary':
      return hasMeaningfulText(profile.summary)
        ? `<div class="section"><h2>PROFILE</h2><p class="desc">${escapeHtml(profile.summary)}</p></div>`
        : '';
    case 'education':
      return renderListSection('EDUCATION', selections.education, (item) => `
          <div class="education-row">
            <div class="flex-between">
              <h3>${escapeHtml(item.title)}</h3>
              <span class="education-period">${escapeHtml(item.period)}</span>
            </div>
            ${item.detail ? `<p class="education-detail">- ${escapeHtml(item.detail)}</p>` : ''}
          </div>
        `);
    case 'experience':
      return renderListSection('PROFESSIONAL EXPERIENCE', selections.experience, (item) => `
          <div class="entry">
            <div class="flex-between">
              <h3>${escapeHtml(item.role || item.type)} - ${escapeHtml(item.companyName)}</h3>
              <span class="meta">${escapeHtml(item.duration)}</span>
            </div>
            <p class="desc">${escapeHtml(item.description)}</p>
          </div>
        `);
    case 'projects':
      return renderListSection('PROJECTS', selections.projects, (item) => `
          <div class="entry">
            <div class="flex-between">
              <h3>
                ${escapeHtml(item.title)}
                ${item.techStack ? ` | ${escapeHtml(item.techStack)}` : ''}
                ${item.githubLink ? ` | ${renderExternalLink(item.githubLink, 'GITHUB-Link')}` : ''}
              </h3>
              <span class="meta">${escapeHtml(item.duration || '')}</span>
            </div>
            <p class="desc">${escapeHtml(item.description)}</p>
          </div>
        `);
    case 'skills':
      return renderListSection('TECHNICAL SKILLS', [[profile.skills]], () => `
          <div>
            ${profile.skills.languages.length ? `<div class="skills-row"><strong>Programming:</strong> ${escapeHtml(profile.skills.languages.join(', '))}</div>` : ''}
            ${profile.skills.frameworks.length ? `<div class="skills-row"><strong>Frameworks:</strong> ${escapeHtml(profile.skills.frameworks.join(', '))}</div>` : ''}
            ${profile.skills.tools.length ? `<div class="skills-row"><strong>Tools:</strong> ${escapeHtml(profile.skills.tools.join(', '))}</div>` : ''}
            ${profile.skills.otherLanguages.length ? `<div class="skills-row"><strong>Other:</strong> ${escapeHtml(profile.skills.otherLanguages.join(', '))}</div>` : ''}
          </div>
        `);
    case 'certifications':
      return renderListSection('CERTIFICATIONS', selections.certifications, (item) => `
          <div class="entry">
            <h3>
              ${escapeHtml(item.name)}
              ${item.link ? ` | ${renderExternalLink(item.link, 'Link')}` : ''}
            </h3>
            ${item.platform ? `<p class="desc">${escapeHtml(item.platform)}</p>` : ''}
          </div>
        `);
    case 'activities':
      return renderListSection('EXTRA CURRICULAR ACTIVITIES', selections.activities, (item) => `
          <div class="entry">
            <h3>
              ${escapeHtml(item.title)}
              ${item.link ? ` | ${renderExternalLink(item.link, 'Link')}` : ''}
            </h3>
            <p class="desc">${escapeHtml(item.description)}</p>
          </div>
        `);
    default:
      return '';
  }
}

function buildAtsTemplate(profile, selections) {
  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(profile.personal.fullName)} ATS Resume</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background: #fff; margin: 0; padding: 22px 26px; color: #000; font-size: 10px; line-height: 1.26; }
        .page { width: 100%; max-width: 760px; margin: 0 auto; }
        .header { display: flex; align-items: center; gap: 18px; margin-bottom: 10px; }
        .header-photo-stack { width: 92px; flex-shrink: 0; display: flex; flex-direction: column; align-items: center; }
        .header-photo-wrap { width: 82px; flex-shrink: 0; }
        .header-photo { width: 82px; height: 82px; object-fit: cover; border: 1px solid #cfd6e2; display: block; }
        .photo-label { margin-top: 6px; font-size: 8.4px; font-weight: 700; letter-spacing: 0.08em; color: #215da8; }
        .header-content { flex: 1; min-height: 96px; display: flex; flex-direction: column; justify-content: center; text-align: center; }
        h1 { margin: 0 0 8px 0; font-size: 18px; font-weight: 800; text-transform: uppercase; color: #233f72; letter-spacing: 0.2px; }
        .contact { font-size: 9.4px; margin-bottom: 5px; font-weight: 600; line-height: 1.22; }
        .contact.links { margin-bottom: 0; }
        .external-link { color: #0b51ff; text-decoration: underline; font-weight: 400; }
        .section { margin-top: 9px; }
        h2 { margin: 0 0 5px 0; font-size: 10.8px; font-weight: 800; color: #215da8; border-bottom: 1px solid #000; padding-bottom: 1px; }
        h3 { margin: 0 0 2px 0; font-size: 10.1px; font-weight: 800; }
        p { margin: 0 0 2px 0; }
        .entry { margin-bottom: 6px; }
        .flex-between { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
        .meta { font-size: 9.1px; font-weight: 700; white-space: nowrap; }
        .desc { font-size: 9.35px; text-align: justify; line-height: 1.28; }
        .skills-row { margin-bottom: 2px; font-size: 9.3px; line-height: 1.24; }
        .education-row { margin-bottom: 4px; }
        .education-period { font-size: 9.2px; font-weight: 800; white-space: nowrap; }
        .education-detail { margin: 1px 0 0 0; font-size: 9.3px; line-height: 1.24; }
        .bullet-list { margin: 1px 0 0 14px; padding: 0; }
        .bullet-list li { margin: 0 0 2px 0; padding-left: 1px; font-size: 9.3px; line-height: 1.24; }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="header">
          ${
            profile.personal.profilePhotoUrl
              ? `<div class="header-photo-stack"><div class="header-photo-wrap"><img class="header-photo" src="${escapeHtml(profile.personal.profilePhotoUrl)}" alt="Profile Photo" /></div><div class="photo-label">PROFILE</div></div>`
              : ''
          }
          <div class="header-content">
            <h1>${escapeHtml(profile.personal.fullName || profile.prn)}</h1>
            <div class="contact">
              Phone: ${escapeHtml(profile.personal.mobile)} | Email:
              <a href="mailto:${escapeHtml(profile.personal.email || profile.personal.collegeEmail)}">${escapeHtml(profile.personal.email || profile.personal.collegeEmail)}</a>
              | ${escapeHtml(joinNonEmpty([profile.personal.city, profile.personal.state], ', '))}
            </div>
            <div class="contact links">
              ${renderExternalLink(profile.personal.linkedin, profile.personal.linkedin || 'LinkedIn')}
              ${
                profile.personal.linkedin && profile.personal.github
                  ? ' | '
                  : ''
              }
              ${renderExternalLink(profile.personal.github, profile.personal.github || 'GitHub')}
            </div>
          </div>
        </div>

        ${profile.summary ? `<div class="section"><h2>PROFILE</h2><p class="desc">${escapeHtml(profile.summary)}</p></div>` : ''}

        ${renderListSection('EDUCATION', selections.education, (item) => `
          <div class="education-row">
            <div class="flex-between">
              <h3>${escapeHtml(item.title)}</h3>
              <span class="education-period">${escapeHtml(item.period)}</span>
            </div>
            ${item.detail ? `<p class="education-detail">• ${escapeHtml(item.detail)}</p>` : ''}
          </div>
        `)}

        ${renderListSection('PROFESSIONAL EXPERIENCE', selections.experience, (item) => `
          <div class="entry">
            <div class="flex-between">
              <h3>${escapeHtml(item.role || item.type)} - ${escapeHtml(item.companyName)}</h3>
              <span class="meta">${escapeHtml(item.duration)}</span>
            </div>
            <p class="desc">${escapeHtml(item.description)}</p>
          </div>
        `)}

        ${renderListSection('PROJECTS', selections.projects, (item) => `
          <div class="entry">
            <div class="flex-between">
              <h3>
                ${escapeHtml(item.title)}
                ${item.techStack ? ` | ${escapeHtml(item.techStack)}` : ''}
                ${item.githubLink ? ` | ${renderExternalLink(item.githubLink, 'GITHUB-Link')}` : ''}
              </h3>
              <span class="meta">${escapeHtml(item.duration || '')}</span>
            </div>
            <p class="desc">${escapeHtml(item.description)}</p>
          </div>
        `)}

        ${renderListSection('TECHNICAL SKILLS', [[profile.skills]], () => `
          <div>
            ${profile.skills.languages.length ? `<div class="skills-row"><strong>Programming:</strong> ${escapeHtml(profile.skills.languages.join(', '))}</div>` : ''}
            ${profile.skills.frameworks.length ? `<div class="skills-row"><strong>Frameworks:</strong> ${escapeHtml(profile.skills.frameworks.join(', '))}</div>` : ''}
            ${profile.skills.tools.length ? `<div class="skills-row"><strong>Tools:</strong> ${escapeHtml(profile.skills.tools.join(', '))}</div>` : ''}
            ${profile.skills.otherLanguages.length ? `<div class="skills-row"><strong>Other:</strong> ${escapeHtml(profile.skills.otherLanguages.join(', '))}</div>` : ''}
          </div>
        `)}

        ${renderListSection('CERTIFICATIONS', selections.certifications, (item) => `
          <div class="entry">
            <h3>
              ${escapeHtml(item.name)}
              ${item.link ? ` | <a href="${escapeHtml(item.link)}">Link</a>` : ''}
            </h3>
            ${item.platform ? `<p class="desc">${escapeHtml(item.platform)}</p>` : ''}
          </div>
        `)}

        ${renderListSection('EXTRA CURRICULAR ACTIVITIES', selections.activities, (item) => `
          <div class="entry">
            <h3>
              ${escapeHtml(item.title)}
              ${item.link ? ` | ${renderExternalLink(item.link, 'Link')}` : ''}
            </h3>
            <p class="desc">${escapeHtml(item.description)}</p>
          </div>
        `)}
      </div>
    </body>
  </html>`;
}

function buildAtsTemplateOrdered(profile, selections, sectionOrder) {
  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(profile.personal.fullName)} ATS Resume</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background: #fff; margin: 0; padding: 22px 26px; color: #000; font-size: 10px; line-height: 1.26; }
        .page { width: 100%; max-width: 760px; margin: 0 auto; }
        .header { display: flex; align-items: center; gap: 18px; margin-bottom: 10px; }
        .header-photo-stack { width: 92px; flex-shrink: 0; display: flex; flex-direction: column; align-items: center; }
        .header-photo-wrap { width: 82px; flex-shrink: 0; }
        .header-photo { width: 82px; height: 82px; object-fit: cover; border: 1px solid #cfd6e2; display: block; }
        .photo-label { margin-top: 6px; font-size: 8.4px; font-weight: 700; letter-spacing: 0.08em; color: #215da8; }
        .header-content { flex: 1; min-height: 96px; display: flex; flex-direction: column; justify-content: center; text-align: center; }
        h1 { margin: 0 0 8px 0; font-size: 18px; font-weight: 800; text-transform: uppercase; color: #233f72; letter-spacing: 0.2px; }
        .contact { font-size: 9.4px; margin-bottom: 5px; font-weight: 600; line-height: 1.22; }
        .contact.links { margin-bottom: 0; }
        .external-link { color: #0b51ff; text-decoration: underline; font-weight: 400; }
        .section { margin-top: 9px; }
        h2 { margin: 0 0 5px 0; font-size: 10.8px; font-weight: 800; color: #215da8; border-bottom: 1px solid #000; padding-bottom: 1px; }
        h3 { margin: 0 0 2px 0; font-size: 10.1px; font-weight: 800; }
        p { margin: 0 0 2px 0; }
        .entry { margin-bottom: 6px; }
        .flex-between { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
        .meta { font-size: 9.1px; font-weight: 700; white-space: nowrap; }
        .desc { font-size: 9.35px; text-align: justify; line-height: 1.28; }
        .skills-row { margin-bottom: 2px; font-size: 9.3px; line-height: 1.24; }
        .education-row { margin-bottom: 4px; }
        .education-period { font-size: 9.2px; font-weight: 800; white-space: nowrap; }
        .education-detail { margin: 1px 0 0 0; font-size: 9.3px; line-height: 1.24; }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="header">
          ${
            profile.personal.profilePhotoUrl
              ? `<div class="header-photo-stack"><div class="header-photo-wrap"><img class="header-photo" src="${escapeHtml(profile.personal.profilePhotoUrl)}" alt="Profile Photo" /></div><div class="photo-label">PROFILE</div></div>`
              : ''
          }
          <div class="header-content">
            <h1>${escapeHtml(profile.personal.fullName || profile.prn)}</h1>
            <div class="contact">
              Phone: ${escapeHtml(profile.personal.mobile)} | Email:
              <a href="mailto:${escapeHtml(profile.personal.email || profile.personal.collegeEmail)}">${escapeHtml(profile.personal.email || profile.personal.collegeEmail)}</a>
              | ${escapeHtml(joinNonEmpty([profile.personal.city, profile.personal.state], ', '))}
            </div>
            <div class="contact links">
              ${renderExternalLink(profile.personal.linkedin, profile.personal.linkedin || 'LinkedIn')}
              ${
                profile.personal.linkedin && profile.personal.github
                  ? ' | '
                  : ''
              }
              ${renderExternalLink(profile.personal.github, profile.personal.github || 'GitHub')}
            </div>
          </div>
        </div>

        ${sectionOrder.map((sectionKey) => buildSectionMarkup(profile, selections, sectionKey)).join('')}
      </div>
    </body>
  </html>`;
}

atsResumeRoutes.get('/templates', async (req, res) => {
  res.json({
    message: 'ATS Templates fetched.',
    data: [
      {
        id: 'ats_standard',
        name: 'The Standard ATS',
        description: 'A 100% compliant applicant tracking system template built on clean styling.',
        previewUrl: '',
        previewType: 'pdf',
        sections: ['Header', 'Summary', 'Education', 'Experience', 'Projects', 'Technical Skills'],
      },
    ],
  });
});

atsResumeRoutes.get('/', async (req, res) => {
  try {
    await ensureStudentResumesTable();
    const prn = req.auth?.prn;
    const rows = await query(
      `SELECT id, template_code, resume_title, file_name, file_url, preview_file_url, created_at
       FROM student_resumes
       WHERE PRN = ? AND template_code LIKE 'ats_%'
       ORDER BY created_at DESC`,
      [prn],
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

atsResumeRoutes.get('/:id', async (req, res) => {
  try {
    const rows = await query('SELECT * FROM student_resumes WHERE id = ? AND PRN = ?', [
      req.params.id,
      req.auth?.prn,
    ]);

    if (!rows.length) {
      return res.status(404).json({ error: 'Not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

atsResumeRoutes.post('/generate', async (req, res) => {
  try {
    await ensureStudentResumesTable();

    const prn = req.auth?.prn;
    const profile = await fetchStudentResumeProfile(prn);

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found.' });
    }

    const selections = {
      education: buildEducationEntries(profile),
      projects: selectItemsByIds(profile.projects, req.body?.selectedProjects),
      certifications: selectItemsByIds(profile.certifications, req.body?.selectedCertifications),
      experience: selectItemsByIds(profile.experience, req.body?.selectedExperience),
      activities: selectItemsByIds(profile.activities, req.body?.selectedActivities),
    };
    const availableSections = {
      summary: hasMeaningfulText(profile.summary),
      education: selections.education.length > 0,
      experience: selections.experience.length > 0,
      projects: selections.projects.length > 0,
      skills: hasSkills(profile),
      certifications: selections.certifications.length > 0,
      activities: selections.activities.length > 0,
    };
    const sectionOrder = buildSectionOrder(req.body?.sectionOrder, availableSections);

    if (!sectionOrder.length) {
      return res.status(400).json({
        message: 'Select at least one populated section to generate the ATS resume.',
      });
    }

    const includeProfilePhoto = req.body?.includeProfilePhoto !== false;
    const renderProfile = {
      ...profile,
      personal: {
        ...profile.personal,
        profilePhotoUrl: includeProfilePhoto ? profile.personal.profilePhotoUrl : '',
      },
    };

    const htmlContent = buildAtsTemplateOrdered(renderProfile, selections, sectionOrder);
    const resumeTitle = req.body?.resumeTitle || `${prn}-ATS-Resume`;
    const folder = `student-resumes/${sanitizeFileName(prn)}`;

    let pdfBuffer;
    let browser;

    try {
      browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '0', bottom: '0', left: '0', right: '0' },
      });
    } catch (err) {
      console.error(err);
      throw new Error('PDF Engine Failed');
    } finally {
      if (browser) {
        await browser.close();
      }
    }

    const timestamp = Date.now();
    const safeTitle = sanitizeFileName(resumeTitle);

    const pdfUpload = await uploadFile(
      {
        originalname: `${safeTitle}-${timestamp}.pdf`,
        mimetype: 'application/pdf',
        buffer: pdfBuffer,
      },
      folder,
    );

    await uploadFile(
      {
        originalname: `${safeTitle}-${timestamp}.html`,
        mimetype: 'text/html',
        buffer: Buffer.from(htmlContent),
      },
      folder,
    );

    const insertResult = await query(
      `INSERT INTO student_resumes (PRN, template_code, resume_title, file_name, file_url, preview_file_url, file_size, mime_type, is_default)
       VALUES (?, 'ats_standard', ?, ?, ?, ?, ?, 'application/pdf', 0)`,
      [prn, resumeTitle, pdfUpload.fileName, pdfUpload.url, pdfUpload.url, Buffer.byteLength(pdfBuffer)],
    );

    res.status(201).json({ id: insertResult.insertId, fileUrl: pdfUpload.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = atsResumeRoutes;
