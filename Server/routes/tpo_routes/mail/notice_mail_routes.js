const express = require('express');
const upload = require('../../../config/upload');
const db = require('../../../config/db').db;
const { sendNoticeEmail } = require('./notice_mail_service');

const noticeMailRoutes = express.Router();

function isTpcScope(req) {
  return req.baseUrl.startsWith('/tpc/');
}

function isStudentScope(req) {
  return req.baseUrl.startsWith('/student/');
}

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

function asyncHandler(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to process mail request.',
      });
    }
  };
}

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeText(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized ? normalized : null;
}

function toNullableInteger(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function parseStringArray(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean);
  }

  const normalized = String(value).trim();

  if (!normalized) {
    return [];
  }

  try {
    const parsed = JSON.parse(normalized);

    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item || '').trim()).filter(Boolean);
    }
  } catch (error) {
    // Fallback to comma-separated plain text.
  }

  return normalized
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeDepartmentList(value) {
  return parseStringArray(value)
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .filter((item) => item !== 'All Departments');
}

function normalizeYearList(value) {
  return parseStringArray(value)
    .map((item) => toNullableInteger(item))
    .filter((item) => item !== null);
}

function getScopedDepartments(req, requestedDepartments = []) {
  if (!isTpcScope(req)) {
    return requestedDepartments;
  }

  const assignedDepartment = normalizeText(req.auth?.department);

  if (!assignedDepartment) {
    throw createHttpError(403, 'No department assigned.');
  }

  if (!requestedDepartments.length) {
    return [assignedDepartment];
  }

  const allowedDepartments = requestedDepartments.filter((department) => department === assignedDepartment);

  if (!allowedDepartments.length) {
    throw createHttpError(403, 'You can only access students from your assigned department.');
  }

  return allowedDepartments;
}

async function getAudienceRecipients(req) {
  const requestedDepartments = normalizeDepartmentList(req.body?.departments || req.query?.departments || req.body?.department || req.query?.department);
  const requestedYears = normalizeYearList(
    req.body?.passingYears ||
      req.query?.passingYears ||
      req.body?.passing_years ||
      req.query?.passing_years ||
      req.body?.passingYear ||
      req.query?.passingYear ||
      req.body?.passing_year ||
      req.query?.passing_year ||
      req.body?.year ||
      req.query?.year
  );
  const departments = getScopedDepartments(req, requestedDepartments);
  const values = [];
  let sql = `
    SELECT DISTINCT
      NULLIF(TRIM(sp.personal_email), '') AS email,
      se.department,
      se.passing_year
    FROM student_education se
    LEFT JOIN student_personal sp ON sp.PRN = se.PRN
    WHERE NULLIF(TRIM(sp.personal_email), '') IS NOT NULL
  `;

  if (departments.length) {
    sql += ` AND se.department IN (${departments.map(() => '?').join(', ')})`;
    values.push(...departments);
  }

  if (requestedYears.length) {
    sql += ` AND se.passing_year IN (${requestedYears.map(() => '?').join(', ')})`;
    values.push(...requestedYears);
  }

  sql += ' ORDER BY se.department ASC, se.passing_year ASC, email ASC';

  const rows = await query(sql, values);
  const recipients = rows
    .map((row) => ({
      email: String(row.email || '').trim(),
      department: row.department || '',
      passingYear: row.passing_year === null || row.passing_year === undefined ? null : Number(row.passing_year),
    }))
    .filter((row) => row.email);

  return {
    recipients,
    departments,
    years: requestedYears,
  };
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildAudienceLabel(departments, years) {
  const departmentLabel = departments.length ? departments.join(', ') : 'All Departments';
  const yearLabel = years.length ? years.join(', ') : 'All Batches';
  return `${departmentLabel} | ${yearLabel}`;
}

function buildMailText({ title, description, departments, years }) {
  return [
    title,
    `Audience: ${buildAudienceLabel(departments, years)}`,
    '',
    description,
  ].join('\n');
}

function buildMailHtml({ title, description, departments, years }) {
  const paragraphs = String(description || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p style="margin:0 0 12px;">${escapeHtml(line)}</p>`)
    .join('');

  return `
    <div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#0f172a;">
      <h2 style="margin:0 0 12px;">${escapeHtml(title)}</h2>
      <p style="margin:0 0 16px;"><strong>Audience:</strong> ${escapeHtml(buildAudienceLabel(departments, years))}</p>
      ${paragraphs || '<p style="margin:0;">No description provided.</p>'}
    </div>
  `;
}

function getMailAttachments(files = []) {
  if (!Array.isArray(files)) {
    return [];
  }

  return files
    .filter((file) => file?.buffer && file?.originalname)
    .map((file) => ({
      filename: file.originalname,
      content: file.buffer,
      contentType: file.mimetype || undefined,
    }));
}

noticeMailRoutes.get(
  '/audience-emails',
  asyncHandler(async (req, res) => {
    if (isStudentScope(req)) {
      throw createHttpError(403, 'Students cannot access audience emails.');
    }

    const { recipients, departments, years } = await getAudienceRecipients(req);

    res.json({
      success: true,
      data: {
        recipients,
        emails: recipients.map((item) => item.email),
        count: recipients.length,
        departments,
        years,
      },
    });
  })
);

noticeMailRoutes.post(
  '/send',
  upload.any(),
  asyncHandler(async (req, res) => {
    if (isStudentScope(req)) {
      throw createHttpError(403, 'Students cannot send notice emails.');
    }

    const title = normalizeText(req.body?.title);
    const description = normalizeText(req.body?.description);

    if (!title || !description) {
      throw createHttpError(400, 'Mail title and description are required.');
    }

    const { recipients, departments, years } = await getAudienceRecipients(req);
    const result = await sendNoticeEmail({
      recipients: recipients.map((item) => item.email),
      subject: title,
      text: buildMailText({ title, description, departments, years }),
      html: buildMailHtml({ title, description, departments, years }),
      attachments: getMailAttachments(req.files),
    });

    res.json({
      success: true,
      message: `Mail sent to ${result.accepted.length || recipients.length} recipients.`,
      data: {
        recipients,
        count: recipients.length,
        accepted: result.accepted.length,
        rejected: result.rejected.length,
        messageId: result.messageId,
      },
    });
  })
);

module.exports = noticeMailRoutes;
