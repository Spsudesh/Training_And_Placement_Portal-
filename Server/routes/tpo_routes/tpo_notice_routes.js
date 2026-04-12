const express = require('express');
const upload = require('../../config/upload');
const { uploadFile } = require('../../config/storageService');
const db = require('../../config/db').db;

const tpoNoticeRoutes = express.Router();

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

function beginTransaction() {
  return new Promise((resolve, reject) => {
    db.beginTransaction((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

function commit() {
  return new Promise((resolve, reject) => {
    db.commit((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

function rollback() {
  return new Promise((resolve) => {
    db.rollback(() => resolve());
  });
}

function asyncHandler(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to process notice request.',
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

function normalizeEnum(value, allowedValues, fallback = null) {
  const normalized = String(value || '').trim().toLowerCase();
  return allowedValues.includes(normalized) ? normalized : fallback;
}

function toNullableInteger(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function toNullableDecimal(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function toMysqlDateTime(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function toIsoString(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
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

async function ensureNoticeTargetsSchema() {
  await query(
    'ALTER TABLE notice_targets MODIFY COLUMN department VARCHAR(150) NOT NULL'
  ).catch(() => {});
}

function buildNoticeTargets(departmentsValue, yearsValue) {
  const departments = parseStringArray(departmentsValue).filter(Boolean);
  const yearValues = parseStringArray(yearsValue)
    .map((year) => toNullableInteger(year))
    .filter((year) => year !== null);
  const targetDepartments = departments.length ? departments : ['All Departments'];
  const targetYears = yearValues.length ? yearValues : [null];
  const targets = [];

  for (const department of targetDepartments) {
    for (const year of targetYears) {
      targets.push({
        department,
        year,
      });
    }
  }

  return targets;
}

function uniqueNoticeTargets(targets) {
  const seenTargets = new Set();

  return targets.filter((target) => {
    const key = `${target.department || 'All Departments'}|${target.year ?? 'all'}`;

    if (seenTargets.has(key)) {
      return false;
    }

    seenTargets.add(key);
    return true;
  });
}

function getUploadedFiles(req) {
  if (!Array.isArray(req.files) || req.files.length === 0) {
    return [];
  }

  return req.files;
}

function parseExistingFiles(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => ({
        name: normalizeText(item?.name),
        url: normalizeText(item?.url || item?.fileUrl),
      }))
      .filter((item) => item.url);
  }

  const normalized = String(value).trim();

  if (!normalized) {
    return [];
  }

  try {
    const parsed = JSON.parse(normalized);
    return parseExistingFiles(parsed);
  } catch (error) {
    return [];
  }
}

function getRoleDefaults(req) {
  const roleFromPath = req.baseUrl.startsWith('/tpc/') ? 'TPC' : 'TPO';

  return {
    createdByRole: normalizeEnum(req.body.created_by_role || req.body.createdByRole, ['tpo', 'tpc'], roleFromPath.toLowerCase()).toUpperCase(),
    createdById: normalizeText(req.body.created_by_id || req.body.createdById) || `${roleFromPath.toLowerCase()}-portal`,
  };
}

async function getStudentNoticeTargetContext(req) {
  const studentPrn = normalizeText(req.auth?.prn || req.query.prn);

  if (!studentPrn) {
    throw createHttpError(401, 'Student identity is required to fetch notices.');
  }

  const rows = await query(
    `
      SELECT department, passing_year
      FROM student_education
      WHERE PRN = ?
      LIMIT 1
    `,
    [studentPrn]
  );
  const education = rows[0] || {};

  return {
    department: normalizeText(education.department),
    passingYear: toNullableInteger(education.passing_year),
  };
}

function buildNoticePayload(req) {
  const { createdByRole, createdById } = getRoleDefaults(req);
  const type = normalizeEnum(req.body.type, ['announcement', 'placement', 'internship']);
  const status = normalizeEnum(req.body.status, ['draft', 'published'], 'published');

  if (!type) {
    throw createHttpError(400, 'A valid notice type is required.');
  }

  const payload = {
    notice: {
      title: normalizeText(req.body.title),
      description: normalizeText(req.body.description),
      type,
      created_by_role: createdByRole,
      created_by_id: createdById,
      status,
    },
    targets: uniqueNoticeTargets(
      buildNoticeTargets(
        req.body.departments || req.body.department,
        req.body.passingYears || req.body.passing_years || req.body.passingYear || req.body.passing_year || req.body.year
      )
    ),
    placement: type === 'placement'
      ? {
          company_name: normalizeText(req.body.companyName || req.body.company_name),
          role: normalizeText(req.body.role),
          location: normalizeText(req.body.location),
          ctc: toNullableDecimal(req.body.ctc),
          min_cgpa: toNullableDecimal(req.body.minCgpa || req.body.cgpa),
          max_backlogs: toNullableInteger(req.body.maxBacklogs || req.body.backlogs),
          deadline: toMysqlDateTime(req.body.deadline),
        }
      : null,
    internship: type === 'internship'
      ? {
          company_name: normalizeText(req.body.companyName || req.body.company_name),
          role: normalizeText(req.body.role),
          location: normalizeText(req.body.location),
          stipend: toNullableDecimal(req.body.stipend),
          duration: normalizeText(req.body.duration),
          min_cgpa: toNullableDecimal(req.body.minCgpa || req.body.cgpa),
          max_backlogs: toNullableInteger(req.body.maxBacklogs || req.body.backlogs),
          deadline: toMysqlDateTime(req.body.deadline),
        }
      : null,
  };

  if (!payload.notice.title || !payload.notice.type || !payload.notice.created_by_id) {
    throw createHttpError(400, 'title, type, and creator details are required.');
  }

  if (payload.notice.type !== 'announcement') {
    const detail = payload.notice.type === 'placement' ? payload.placement : payload.internship;

    if (!detail?.company_name || !detail?.role || !detail?.deadline) {
      throw createHttpError(400, 'company, role, and deadline are required for opportunities.');
    }
  }

  if (!payload.targets.length) {
    payload.targets = [{ department: 'All Departments', year: null }];
  }

  return payload;
}

async function insertTargets(noticeId, targets) {
  await ensureNoticeTargetsSchema();

  for (const target of targets) {
    await query(
      `
        INSERT INTO notice_targets (notice_id, department, year)
        VALUES (?, ?, ?)
      `,
      [noticeId, target.department, target.year]
    );
  }
}

async function insertFiles(noticeId, files) {
  for (const file of files) {
    const uploaded = await uploadFile(file, 'tpo/notices');

    await query(
      `
        INSERT INTO notice_files (notice_id, file_url)
        VALUES (?, ?)
      `,
      [noticeId, uploaded.url]
    );
  }
}

async function insertExistingFiles(noticeId, files) {
  for (const file of files) {
    await query(
      `
        INSERT INTO notice_files (notice_id, file_url)
        VALUES (?, ?)
      `,
      [noticeId, file.url]
    );
  }
}

async function insertNoticeDetails(noticeId, payload) {
  if (payload.notice.type === 'placement' && payload.placement) {
    await query(
      `
        INSERT INTO placement_opportunities
        (notice_id, company_name, role, location, ctc, min_cgpa, max_backlogs, deadline)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        noticeId,
        payload.placement.company_name,
        payload.placement.role,
        payload.placement.location,
        payload.placement.ctc,
        payload.placement.min_cgpa,
        payload.placement.max_backlogs,
        payload.placement.deadline,
      ]
    );
  }

  if (payload.notice.type === 'internship' && payload.internship) {
    await query(
      `
        INSERT INTO internship_opportunities
        (notice_id, company_name, role, location, stipend, duration, min_cgpa, max_backlogs, deadline)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        noticeId,
        payload.internship.company_name,
        payload.internship.role,
        payload.internship.location,
        payload.internship.stipend,
        payload.internship.duration,
        payload.internship.min_cgpa,
        payload.internship.max_backlogs,
        payload.internship.deadline,
      ]
    );
  }
}

function mapNoticeRow(row, targets = [], files = []) {
  const departments = [...new Set(targets.map((target) => target.department).filter(Boolean))];
  const years = [...new Set(
    targets
      .map((target) => target.year)
      .filter((year) => year !== null && year !== undefined)
  )];

  return {
    id: row.id,
    type: row.type,
    status: row.status,
    title: row.title || '',
    description: row.description || '',
    createdByRole: row.created_by_role || '',
    createdById: row.created_by_id || '',
    department: targets[0]?.department || 'All Departments',
    departments,
    year: targets[0]?.year ?? null,
    years,
    targets,
    files,
    attachmentName: files[0] ? 'Attachment' : '',
    attachmentUrl: files[0]?.fileUrl || '',
    companyName: row.company_name || '',
    role: row.role_name || '',
    location: row.location || '',
    ctc: row.ctc === null || row.ctc === undefined ? '' : String(row.ctc),
    stipend: row.stipend === null || row.stipend === undefined ? '' : String(row.stipend),
    duration: row.duration || '',
    minCgpa: row.min_cgpa === null || row.min_cgpa === undefined ? '' : String(row.min_cgpa),
    maxBacklogs: row.max_backlogs === null || row.max_backlogs === undefined ? '' : String(row.max_backlogs),
    deadline: toIsoString(row.deadline),
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
  };
}

async function getNoticeRecordById(id) {
  const noticeRows = await query(
    `
      SELECT
        n.*,
        COALESCE(po.company_name, io.company_name) AS company_name,
        COALESCE(po.role, io.role) AS role_name,
        COALESCE(po.location, io.location) AS location,
        po.ctc,
        io.stipend,
        io.duration,
        COALESCE(po.min_cgpa, io.min_cgpa) AS min_cgpa,
        COALESCE(po.max_backlogs, io.max_backlogs) AS max_backlogs,
        COALESCE(po.deadline, io.deadline) AS deadline
      FROM notices n
      LEFT JOIN placement_opportunities po ON po.notice_id = n.id
      LEFT JOIN internship_opportunities io ON io.notice_id = n.id
      WHERE n.id = ?
    `,
    [id]
  );

  const row = noticeRows[0];

  if (!row) {
    return null;
  }

  const [targets, files] = await Promise.all([
    query('SELECT id, department, year FROM notice_targets WHERE notice_id = ? ORDER BY id ASC', [id]),
    query('SELECT id, file_url, uploaded_at FROM notice_files WHERE notice_id = ? ORDER BY id ASC', [id]),
  ]);

  return mapNoticeRow(
    row,
    targets.map((target) => ({
      id: target.id,
      department: target.department,
      year: target.year,
    })),
    files.map((file) => ({
      id: file.id,
      fileUrl: file.file_url,
      uploadedAt: toIsoString(file.uploaded_at),
    }))
  );
}

function noticeMatchesStudentTarget(notice, studentTargetContext) {
  if (!studentTargetContext) {
    return true;
  }

  const targets = Array.isArray(notice.targets) ? notice.targets : [];

  return targets.some((target) => {
    const departmentMatches =
      target.department === 'All Departments' ||
      target.department === studentTargetContext.department;
    const passingYearMatches =
      target.year === null ||
      target.year === undefined ||
      Number(target.year) === Number(studentTargetContext.passingYear);

    return departmentMatches && passingYearMatches;
  });
}

tpoNoticeRoutes.get(
  '/',
  asyncHandler(async (req, res) => {
    const search = normalizeText(req.query.search);
    const type = normalizeEnum(req.query.type, ['announcement', 'placement', 'internship', 'all'], 'all');
    const status = normalizeEnum(req.query.status, ['draft', 'published', 'all'], 'all');
    const department = normalizeText(req.query.department);
    const values = [];
    const studentTargetContext = isStudentScope(req)
      ? await getStudentNoticeTargetContext(req)
      : null;

    let sql = `
      SELECT
        n.*,
        COALESCE(po.company_name, io.company_name) AS company_name,
        COALESCE(po.role, io.role) AS role_name,
        COALESCE(po.location, io.location) AS location,
        po.ctc,
        io.stipend,
        io.duration,
        COALESCE(po.min_cgpa, io.min_cgpa) AS min_cgpa,
        COALESCE(po.max_backlogs, io.max_backlogs) AS max_backlogs,
        COALESCE(po.deadline, io.deadline) AS deadline
      FROM notices n
      LEFT JOIN placement_opportunities po ON po.notice_id = n.id
      LEFT JOIN internship_opportunities io ON io.notice_id = n.id
      WHERE 1 = 1
    `;

    if (search) {
      sql += ' AND (n.title LIKE ? OR n.description LIKE ?)';
      values.push(`%${search}%`, `%${search}%`);
    }

    if (type && type !== 'all') {
      sql += ' AND n.type = ?';
      values.push(type);
    }

    if (status && status !== 'all') {
      sql += ' AND n.status = ?';
      values.push(status);
    }

    if (isTpcScope(req)) {
      sql += ' AND n.created_by_role = ?';
      values.push('TPC');
    }

    if (studentTargetContext) {
      sql += `
        AND EXISTS (
          SELECT 1
          FROM notice_targets nt
          WHERE nt.notice_id = n.id
            AND (nt.department = 'All Departments' OR nt.department = ?)
            AND (nt.year IS NULL OR nt.year = ?)
        )
      `;
      values.push(studentTargetContext.department, studentTargetContext.passingYear);
    }

    if (!studentTargetContext && department && department !== 'All Departments') {
      sql += ' AND EXISTS (SELECT 1 FROM notice_targets nt WHERE nt.notice_id = n.id AND nt.department = ?)';
      values.push(department);
    }

    sql += ' ORDER BY n.updated_at DESC, n.id DESC';

    const rows = await query(sql, values);

    if (!rows.length) {
      res.json({ success: true, data: [] });
      return;
    }

    const noticeIds = rows.map((row) => row.id);
    const placeholders = noticeIds.map(() => '?').join(', ');
    const [targets, files] = await Promise.all([
      query(
        `SELECT id, notice_id, department, year FROM notice_targets WHERE notice_id IN (${placeholders}) ORDER BY id ASC`,
        noticeIds
      ),
      query(
        `SELECT id, notice_id, file_url, uploaded_at FROM notice_files WHERE notice_id IN (${placeholders}) ORDER BY id ASC`,
        noticeIds
      ),
    ]);

    const targetsByNotice = new Map();
    const filesByNotice = new Map();

    targets.forEach((target) => {
      const currentTargets = targetsByNotice.get(target.notice_id) || [];
      currentTargets.push({
        id: target.id,
        department: target.department,
        year: target.year,
      });
      targetsByNotice.set(target.notice_id, currentTargets);
    });

    files.forEach((file) => {
      const currentFiles = filesByNotice.get(file.notice_id) || [];
      currentFiles.push({
        id: file.id,
        fileUrl: file.file_url,
        uploadedAt: toIsoString(file.uploaded_at),
      });
      filesByNotice.set(file.notice_id, currentFiles);
    });

    res.json({
      success: true,
      data: rows.map((row) => mapNoticeRow(row, targetsByNotice.get(row.id) || [], filesByNotice.get(row.id) || [])),
    });
  })
);

tpoNoticeRoutes.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const notice = await getNoticeRecordById(req.params.id);

    if (!notice) {
      throw createHttpError(404, 'Notice not found.');
    }

    if (isTpcScope(req) && notice.createdByRole !== 'TPC') {
      throw createHttpError(403, 'You can access only TPC notices from this panel.');
    }

    if (isStudentScope(req)) {
      const studentTargetContext = await getStudentNoticeTargetContext(req);

      if (!noticeMatchesStudentTarget(notice, studentTargetContext)) {
        throw createHttpError(404, 'Notice not found.');
      }
    }

    res.json({
      success: true,
      data: notice,
    });
  })
);

tpoNoticeRoutes.post(
  '/',
  upload.any(),
  asyncHandler(async (req, res) => {
    if (isStudentScope(req)) {
      throw createHttpError(403, 'Students can only view notices.');
    }

    const payload = buildNoticePayload(req);
    const files = getUploadedFiles(req);
    const existingFiles = parseExistingFiles(req.body.existingFiles);

    await beginTransaction();

    try {
      const noticeResult = await query(
        `
          INSERT INTO notices
          (title, description, type, created_by_role, created_by_id, status)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          payload.notice.title,
          payload.notice.description,
          payload.notice.type,
          payload.notice.created_by_role,
          payload.notice.created_by_id,
          payload.notice.status,
        ]
      );

      const noticeId = noticeResult.insertId;

      await insertNoticeDetails(noticeId, payload);
      await insertTargets(noticeId, payload.targets);
      await insertExistingFiles(noticeId, existingFiles);
      await insertFiles(noticeId, files);

      await commit();

      const createdNotice = await getNoticeRecordById(noticeId);

      res.status(201).json({
        success: true,
        message: 'Notice created successfully.',
        data: createdNotice,
      });
    } catch (error) {
      await rollback();
      throw error;
    }
  })
);

tpoNoticeRoutes.put(
  '/:id',
  upload.any(),
  asyncHandler(async (req, res) => {
    if (isStudentScope(req)) {
      throw createHttpError(403, 'Students can only view notices.');
    }

    const existingNotice = await getNoticeRecordById(req.params.id);

    if (!existingNotice) {
      throw createHttpError(404, 'Notice not found.');
    }

    if (isTpcScope(req) && existingNotice.createdByRole !== 'TPC') {
      throw createHttpError(403, 'You can update only TPC notices from this panel.');
    }

    const payload = buildNoticePayload(req);
    const files = getUploadedFiles(req);
    const existingFiles = parseExistingFiles(req.body.existingFiles);

    await beginTransaction();

    try {
      await query(
        `
          UPDATE notices
          SET title = ?, description = ?, type = ?, created_by_role = ?, created_by_id = ?, status = ?
          WHERE id = ?
        `,
        [
          payload.notice.title,
          payload.notice.description,
          payload.notice.type,
          payload.notice.created_by_role,
          payload.notice.created_by_id,
          payload.notice.status,
          req.params.id,
        ]
      );

      await query('DELETE FROM placement_opportunities WHERE notice_id = ?', [req.params.id]);
      await query('DELETE FROM internship_opportunities WHERE notice_id = ?', [req.params.id]);
      await query('DELETE FROM notice_targets WHERE notice_id = ?', [req.params.id]);

      if (String(req.body.keepExistingFiles || 'false').toLowerCase() !== 'true') {
        await query('DELETE FROM notice_files WHERE notice_id = ?', [req.params.id]);
      } else {
        await query('DELETE FROM notice_files WHERE notice_id = ?', [req.params.id]);
        await insertExistingFiles(req.params.id, existingFiles);
      }

      await insertNoticeDetails(req.params.id, payload);
      await insertTargets(req.params.id, payload.targets);
      await insertFiles(req.params.id, files);

      await commit();

      const updatedNotice = await getNoticeRecordById(req.params.id);

      res.json({
        success: true,
        message: 'Notice updated successfully.',
        data: updatedNotice,
      });
    } catch (error) {
      await rollback();
      throw error;
    }
  })
);

tpoNoticeRoutes.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    if (isStudentScope(req)) {
      throw createHttpError(403, 'Students can only view notices.');
    }

    const existingNotice = await getNoticeRecordById(req.params.id);

    if (!existingNotice) {
      throw createHttpError(404, 'Notice not found.');
    }

    if (isTpcScope(req) && existingNotice.createdByRole !== 'TPC') {
      throw createHttpError(403, 'You can delete only TPC notices from this panel.');
    }

    await query('DELETE FROM notices WHERE id = ?', [req.params.id]);

    res.json({
      success: true,
      message: 'Notice deleted successfully.',
    });
  })
);

module.exports = tpoNoticeRoutes;
