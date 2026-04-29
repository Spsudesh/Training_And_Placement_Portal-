const express = require('express');
const upload = require('../../config/upload');
const { uploadFile } = require('../../config/storageService');
const db = require('../../config/db').db;

const tpcOpportunitiesRoutes = express.Router();

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

async function ensurePlacementApplicationsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS placement_applications (
      id INT NOT NULL AUTO_INCREMENT,
      opportunity_id INT NOT NULL,
      PRN VARCHAR(50) NOT NULL,
      application_status VARCHAR(50) NOT NULL DEFAULT 'pending_verification',
      eligibility_snapshot JSON NULL,
      applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY unique_student_opportunity (opportunity_id, PRN),
      KEY idx_placement_applications_prn (PRN),
      KEY idx_placement_applications_opportunity (opportunity_id)
    )
  `);

  await query(
    "ALTER TABLE placement_applications MODIFY COLUMN application_status VARCHAR(50) NOT NULL DEFAULT 'pending_verification'"
  ).catch(() => {});

  await ensureColumnExists(
    'placement_applications',
    'submitted_at',
    'ALTER TABLE placement_applications ADD COLUMN submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER eligibility_snapshot'
  );
  await ensureColumnExists(
    'placement_applications',
    'current_stage_id',
    'ALTER TABLE placement_applications ADD COLUMN current_stage_id BIGINT NULL AFTER application_status'
  );
  await ensureColumnExists(
    'placement_applications',
    'final_outcome',
    "ALTER TABLE placement_applications ADD COLUMN final_outcome VARCHAR(50) NOT NULL DEFAULT 'in_process' AFTER current_stage_id"
  );
  await query(
    "ALTER TABLE placement_applications MODIFY COLUMN final_outcome VARCHAR(50) NOT NULL DEFAULT 'in_process'"
  ).catch(() => {});
  await ensureColumnExists(
    'placement_applications',
    'verified_at',
    'ALTER TABLE placement_applications ADD COLUMN verified_at DATETIME NULL AFTER submitted_at'
  );
  await ensureColumnExists(
    'placement_applications',
    'withdrawn_at',
    'ALTER TABLE placement_applications ADD COLUMN withdrawn_at DATETIME NULL AFTER verified_at'
  );
  await ensureColumnExists(
    'placement_applications',
    'decision_at',
    'ALTER TABLE placement_applications ADD COLUMN decision_at DATETIME NULL AFTER withdrawn_at'
  );
  await ensureColumnExists(
    'placement_applications',
    'remarks',
    'ALTER TABLE placement_applications ADD COLUMN remarks TEXT NULL AFTER decision_at'
  );

  if (await columnExists('placement_applications', 'applied_at')) {
    await query(
      `
        UPDATE placement_applications
        SET submitted_at = COALESCE(submitted_at, applied_at, CURRENT_TIMESTAMP)
        WHERE submitted_at IS NULL
      `
    );
  } else {
    await query(
      `
        UPDATE placement_applications
        SET submitted_at = COALESCE(submitted_at, CURRENT_TIMESTAMP)
        WHERE submitted_at IS NULL
      `
    );
  }
}

async function ensureColumnExists(tableName, columnName, alterSql) {
  const rows = await query(`SHOW COLUMNS FROM ${tableName} LIKE ?`, [columnName]);

  if (!rows.length) {
    await query(alterSql);
  }
}

async function columnExists(tableName, columnName) {
  const rows = await query(`SHOW COLUMNS FROM ${tableName} LIKE ?`, [columnName]);
  return rows.length > 0;
}

async function tableExists(tableName) {
  const rows = await query('SHOW TABLES LIKE ?', [tableName]);
  return rows.length > 0;
}

async function ensureApplicationStatusHistoryTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS application_status_history (
      id BIGINT NOT NULL AUTO_INCREMENT,
      application_id BIGINT NOT NULL,
      old_status VARCHAR(50) NULL,
      new_status VARCHAR(50) NOT NULL,
      changed_by VARCHAR(20) NULL,
      change_reason TEXT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_history_application (application_id),
      KEY idx_history_status (new_status)
    )
  `);
}

async function ensureOpportunityTrackingSchema() {
  await ensureColumnExists(
    'tpo_opportunities',
    'created_by_role',
    "ALTER TABLE tpo_opportunities ADD COLUMN created_by_role VARCHAR(20) NULL AFTER status"
  );
  await ensureColumnExists(
    'tpo_opportunities',
    'created_by_id',
    "ALTER TABLE tpo_opportunities ADD COLUMN created_by_id VARCHAR(100) NULL AFTER created_by_role"
  );
  await ensureColumnExists(
    'tpo_opportunities',
    'created_by_email',
    "ALTER TABLE tpo_opportunities ADD COLUMN created_by_email VARCHAR(255) NULL AFTER created_by_id"
  );
  await ensureColumnExists(
    'tpo_opportunities',
    'updated_by_role',
    "ALTER TABLE tpo_opportunities ADD COLUMN updated_by_role VARCHAR(20) NULL AFTER created_by_email"
  );
  await ensureColumnExists(
    'tpo_opportunities',
    'updated_by_id',
    "ALTER TABLE tpo_opportunities ADD COLUMN updated_by_id VARCHAR(100) NULL AFTER updated_by_role"
  );
  await ensureColumnExists(
    'tpo_opportunities',
    'updated_by_email',
    "ALTER TABLE tpo_opportunities ADD COLUMN updated_by_email VARCHAR(255) NULL AFTER updated_by_id"
  );

  await query(
    `
      UPDATE tpo_opportunities
      SET
        created_by_role = COALESCE(created_by_role, 'tpo'),
        created_by_id = COALESCE(created_by_id, 'legacy-record'),
        updated_by_role = COALESCE(updated_by_role, created_by_role, 'tpo'),
        updated_by_id = COALESCE(updated_by_id, created_by_id, 'legacy-record')
      WHERE
        created_by_role IS NULL OR
        created_by_id IS NULL OR
        updated_by_role IS NULL OR
        updated_by_id IS NULL
    `
  ).catch(() => {});
}

async function ensurePanelActivityLogsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS panel_activity_logs (
      id BIGINT NOT NULL AUTO_INCREMENT,
      entity_type VARCHAR(50) NOT NULL,
      entity_id BIGINT NULL,
      form_type VARCHAR(50) NOT NULL,
      action_type VARCHAR(50) NOT NULL,
      actor_role VARCHAR(20) NULL,
      actor_id VARCHAR(100) NULL,
      actor_email VARCHAR(255) NULL,
      summary VARCHAR(255) NULL,
      details_json JSON NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_panel_activity_entity (entity_type, entity_id),
      KEY idx_panel_activity_form (form_type),
      KEY idx_panel_activity_actor (actor_role, actor_id)
    )
  `);
}

async function ensureOpportunityLogTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS opportunity_log (
      id INT NOT NULL AUTO_INCREMENT,
      opportunity_id INT NOT NULL,
      action_type VARCHAR(20) NOT NULL,
      actor_role VARCHAR(20) NOT NULL,
      actor_name VARCHAR(100) NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_opportunity_log_opportunity (opportunity_id),
      CONSTRAINT fk_opportunity_log_opportunity
        FOREIGN KEY (opportunity_id)
        REFERENCES tpo_opportunities(id)
        ON DELETE CASCADE
    )
  `);
}

function asyncHandler(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      const isFirebaseError = String(error.message || '').toLowerCase().includes('firebase');

      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to process opportunity request.',
        ...(isFirebaseError
          ? {
              error:
                'File upload is not configured correctly on the server. Please verify your Firebase service account and FIREBASE_STORAGE_BUCKET in Server/.env.',
            }
          : {}),
      });
    }
  };
}

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function getRequestActor(req) {
  const role = normalizeTextValue(req.auth?.role) || 'system';
  const actorId = normalizeTextValue(req.auth?.prn || req.auth?.userId) || `${role}-portal`;
  const email = normalizeTextValue(req.auth?.email);
  const department = normalizeTextValue(req.auth?.department);
  const name =
    normalizeTextValue(req.auth?.name) ||
    normalizeTextValue(req.auth?.fullName) ||
    normalizeTextValue(req.auth?.displayName);

  return {
    role,
    id: actorId,
    email,
    department,
    name,
  };
}

async function resolveOpportunityActorName(actor) {
  const actorName = normalizeTextValue(actor?.name);

  if (actorName) {
    return actorName;
  }

  if (actor?.role === 'tpc') {
    const hasTpcCredentials = await tableExists('TPC_Credentials');

    if (hasTpcCredentials) {
      const hasNameColumn = await columnExists('TPC_Credentials', 'name');

      if (hasNameColumn) {
        const actorLookupValue = normalizeTextValue(actor?.id);
        const emailLookupValue = normalizeTextValue(actor?.email);

        if (actorLookupValue || emailLookupValue) {
          const rows = await query(
            `
              SELECT name
              FROM TPC_Credentials
              WHERE (? IS NOT NULL AND CAST(id AS CHAR) = ?)
                 OR (? IS NOT NULL AND LOWER(email) = LOWER(?))
              LIMIT 1
            `,
            [actorLookupValue, actorLookupValue, emailLookupValue, emailLookupValue]
          ).catch(() => []);

          const resolvedName = normalizeTextValue(rows[0]?.name);

          if (resolvedName) {
            return resolvedName;
          }
        }
      }
    }
  }

  if (actor?.role === 'tpo') {
    return normalizeTextValue(process.env.TPO_NAME) || 'TPO';
  }

  if (actor?.email) {
    const emailPrefix = String(actor.email).split('@')[0].replace(/[._-]+/g, ' ').trim();

    if (emailPrefix) {
      return emailPrefix;
    }
  }

  return normalizeTextValue(actor?.id) || normalizeTextValue(actor?.role) || 'system';
}

async function writeOpportunityLog({ opportunityId, actionType, actor }) {
  await ensureOpportunityLogTable();

  await query(
    `
      INSERT INTO opportunity_log
      (
        opportunity_id,
        action_type,
        actor_role,
        actor_name
      )
      VALUES (?, ?, ?, ?)
    `,
    [
      Number(opportunityId),
      normalizeTextValue(actionType) || 'updated',
      normalizeTextValue(actor?.role) || 'system',
      await resolveOpportunityActorName(actor),
    ]
  );
}

async function writePanelActivityLog({
  entityType,
  entityId,
  formType,
  actionType,
  actor,
  summary,
  details,
}) {
  await ensurePanelActivityLogsTable();

  await query(
    `
      INSERT INTO panel_activity_logs
      (
        entity_type,
        entity_id,
        form_type,
        action_type,
        actor_role,
        actor_id,
        actor_email,
        summary,
        details_json
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      entityType,
      entityId ?? null,
      formType,
      actionType,
      actor?.role || null,
      actor?.id || null,
      actor?.email || null,
      summary || null,
      details ? JSON.stringify(details) : null,
    ]
  );
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined);
}

function normalizeTextValue(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const normalizedValue = String(value).trim();
  return normalizedValue ? normalizedValue : null;
}

async function resolveTpcDepartment(req) {
  if (req.auth?.role !== 'tpc') {
    return '';
  }

  const tpcId = String(req.auth?.prn || req.auth?.userId || '').trim();

  if (!tpcId) {
    return '';
  }

  const hasDepartmentColumn = await columnExists('TPC_Credentials', 'department').catch(() => false);
  const hasDepartmentNameColumn = await columnExists('TPC_Credentials', 'department_name').catch(() => false);
  const hasIdColumn = await columnExists('TPC_Credentials', 'id').catch(() => false);
  const hasTpcIdColumn = await columnExists('TPC_Credentials', 'tpc_id').catch(() => false);

  const departmentExpression = hasDepartmentColumn
    ? 'department'
    : hasDepartmentNameColumn
      ? 'department_name'
      : "''";
  const idConditions = [];
  const values = [];

  if (hasIdColumn) {
    idConditions.push('CAST(id AS CHAR) = ?');
    values.push(tpcId);
  }

  if (hasTpcIdColumn) {
    idConditions.push('CAST(tpc_id AS CHAR) = ?');
    values.push(tpcId);
  }

  if (!idConditions.length) {
    return '';
  }

  const rows = await query(
    `
      SELECT ${departmentExpression} AS department
      FROM TPC_Credentials
      WHERE ${idConditions.join(' OR ')}
      LIMIT 1
    `,
    values
  );

  return String(rows[0]?.department || '').trim();
}

function toNullableNumber(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsedValue = Number(value);
  return Number.isNaN(parsedValue) ? null : parsedValue;
}

function toNullableInteger(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsedValue = Number.parseInt(value, 10);
  return Number.isNaN(parsedValue) ? null : parsedValue;
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

function toMysqlDate(value) {
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

  return `${year}-${month}-${day}`;
}

function parseSkillList(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || '').trim())
      .filter(Boolean);
  }

  const textValue = String(value).trim();

  if (!textValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(textValue);

    if (Array.isArray(parsedValue)) {
      return parsedValue
        .map((item) => String(item || '').trim())
        .filter(Boolean);
    }
  } catch (error) {
    // Fall through to plain-text parsing.
  }

  return textValue
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseDepartmentList(value) {
  if (!value) {
    return [];
  }

  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeDepartmentKey(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeStatus(value, fallback = 'active') {
  const allowedStatuses = new Set(['active', 'closed', 'draft']);
  const normalizedValue = String(value || fallback).trim().toLowerCase();
  return allowedStatuses.has(normalizedValue) ? normalizedValue : fallback;
}

function normalizeWorkflowStatus(value, fallback = 'upcoming') {
  const normalizedValue = String(value || fallback).trim().toLowerCase();

  if (['draft', 'scheduled', 'open', 'closed', 'cancelled'].includes(normalizedValue)) {
    if (normalizedValue === 'open') {
      return 'current';
    }

    if (normalizedValue === 'closed') {
      return 'completed';
    }

    return 'upcoming';
  }

  const allowedStatuses = new Set(['upcoming', 'current', 'completed']);
  return allowedStatuses.has(normalizedValue) ? normalizedValue : fallback;
}

function toWorkflowLifecycleStatus(value, fallback = 'scheduled') {
  const normalizedValue = String(value || '').trim().toLowerCase();

  if (['draft', 'scheduled', 'open', 'closed', 'cancelled'].includes(normalizedValue)) {
    return normalizedValue;
  }

  if (normalizedValue === 'current') {
    return 'open';
  }

  if (normalizedValue === 'completed') {
    return 'closed';
  }

  if (normalizedValue === 'upcoming') {
    return 'scheduled';
  }

  return fallback;
}

function parseWorkflowValue(value) {
  if (!value) {
    return [];
  }

  let parsedValue = value;

  if (typeof value === 'string') {
    const textValue = value.trim();

    if (!textValue) {
      return [];
    }

    try {
      parsedValue = JSON.parse(textValue);
    } catch (error) {
      return [];
    }
  }

  if (!Array.isArray(parsedValue)) {
    return [];
  }

  return parsedValue
    .map((item, index) => ({
      stage_name: normalizeTextValue(item?.stage_name ?? item?.stage ?? item?.roundName),
      planned_date: toMysqlDate(item?.planned_date ?? item?.stage_date ?? item?.date ?? item?.roundDate),
      lifecycle_status: toWorkflowLifecycleStatus(
        item?.lifecycle_status ?? item?.stage_status ?? item?.status,
        'scheduled'
      ),
      stage_order: toNullableInteger(item?.stage_order ?? item?.order) ?? index + 1,
    }))
    .filter((item) => item.stage_name);
}

function getAttachmentFiles(req) {
  if (!Array.isArray(req.files) || req.files.length === 0) {
    return [];
  }

  const preferredFieldNames = new Set(['attachment', 'file', 'attachmentFile', 'pdf']);

  return req.files.filter((file) => preferredFieldNames.has(file.fieldname) || !file.fieldname);
}

async function uploadAttachmentFiles(req) {
  const files = getAttachmentFiles(req);

  if (!files.length) {
    return [];
  }

  const uploadedFiles = [];

  for (const file of files) {
    const uploadedFile = await uploadFile(file, 'tpc/opportunities');
    uploadedFiles.push({
      name: uploadedFile.fileName || file.originalname || 'Opportunity Attachment',
      type: uploadedFile.contentType || file.mimetype || '',
      url: uploadedFile.url,
      notice: '',
    });
  }

  return uploadedFiles;
}

function parseAttachmentValue(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => ({
        name: String(item?.name || '').trim(),
        type: String(item?.type || '').trim(),
        url: String(item?.url || '').trim(),
        notice: String(item?.notice || '').trim(),
      }))
      .filter((item) => item.name || item.type || item.url || item.notice);
  }

  const textValue = String(value).trim();

  if (!textValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(textValue);

    if (Array.isArray(parsedValue)) {
      return parseAttachmentValue(parsedValue);
    }

    if (parsedValue && typeof parsedValue === 'object') {
      return parseAttachmentValue([parsedValue]);
    }
  } catch (error) {
    // Fall back to single-url storage from older records.
  }

  return [
    {
      name: 'Opportunity Attachment',
      type: '',
      url: textValue,
      notice: '',
    },
  ];
}

function serializeAttachments(attachments) {
  if (!attachments || !attachments.length) {
    return null;
  }

  return JSON.stringify(attachments);
}

function mapRowToOpportunity(row) {
  const requiredSkills = parseSkillList(row.required_skills);
  const attachments = parseAttachmentValue(row.attachment_url);
  const workflow = Array.isArray(row.workflow) ? row.workflow : [];

  return {
    id: row.id,
    company: row.company_name || '',
    title: row.job_title || '',
    location: row.location || '',
    type: row.job_type || '',
    deadline: toIsoString(row.deadline),
    overview: {
      category: row.category || '',
      level: row.level || '',
      functions: row.job_function || '',
      ctc: row.ctc === null || row.ctc === undefined ? '' : String(row.ctc),
      otherInfo: row.other_info || '',
    },
    description: {
      roleOverview: row.role_overview || '',
      responsibilities: row.key_responsibilities || '',
      skills: row.required_skills || '',
      offer: row.what_we_offer || '',
      disclaimer: row.disclaimer || '',
    },
    additional: {
      requiredSkills,
      extraInfo: row.additional_info || '',
      minCgpa: row.min_cgpa === null || row.min_cgpa === undefined ? '' : String(row.min_cgpa),
      maxBacklogs:
        row.max_backlogs === null || row.max_backlogs === undefined ? '' : String(row.max_backlogs),
      allowedDepartments: row.allowed_departments || '',
      passingYear:
        row.passing_year === null || row.passing_year === undefined ? '' : String(row.passing_year),
    },
    application: row.student_application || null,
    attachmentUrl: attachments[0]?.url || '',
    attachment: attachments,
    workflow,
    status: row.status || 'active',
    createdBy: {
      role: row.created_by_role || '',
      id: row.created_by_id || '',
      email: row.created_by_email || '',
    },
    updatedBy: {
      role: row.updated_by_role || row.created_by_role || '',
      id: row.updated_by_id || row.created_by_id || '',
      email: row.updated_by_email || row.created_by_email || '',
    },
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
  };
}

async function getOpportunityById(id) {
  const rows = await query('SELECT * FROM tpo_opportunities WHERE id = ?', [id]);
  return rows[0] ?? null;
}

async function syncHiringStageLifecycleStatuses(opportunityIds) {
  const normalizedOpportunityIds = Array.from(
    new Set(
      (Array.isArray(opportunityIds) ? opportunityIds : [])
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0)
    )
  );

  if (!normalizedOpportunityIds.length) {
    return;
  }

  const placeholders = normalizedOpportunityIds.map(() => '?').join(', ');

  await query(
    `
      UPDATE hiring_stages
      SET lifecycle_status = CASE
        WHEN DATE(planned_date) < CURDATE() THEN 'closed'
        WHEN DATE(planned_date) = CURDATE() THEN 'open'
        ELSE 'scheduled'
      END
      WHERE opportunity_id IN (${placeholders})
        AND planned_date IS NOT NULL
        AND lifecycle_status IN ('scheduled', 'open')
    `,
    normalizedOpportunityIds
  );
}

async function getHiringStagesByOpportunityIds(opportunityIds) {
  if (!opportunityIds.length) {
    return new Map();
  }

  const placeholders = opportunityIds.map(() => '?').join(', ');
  const rows = await query(
    `
      SELECT id, opportunity_id, stage_order, stage_name, lifecycle_status, planned_date
      FROM hiring_stages
      WHERE opportunity_id IN (${placeholders})
      ORDER BY opportunity_id ASC, stage_order ASC, id ASC
    `,
    opportunityIds
  );

  const stagesByOpportunityId = new Map();

  for (const row of rows) {
    const normalizedStage = {
      id: row.id,
      order: row.stage_order,
      stage: row.stage_name || '',
      status: normalizeWorkflowStatus(row.lifecycle_status, 'upcoming'),
      rawDate: toMysqlDate(row.planned_date),
      date: toIsoString(row.planned_date),
    };

    const currentStages = stagesByOpportunityId.get(row.opportunity_id) || [];
    currentStages.push(normalizedStage);
    stagesByOpportunityId.set(row.opportunity_id, currentStages);
  }

  return stagesByOpportunityId;
}

async function getStudentStageRecordsByOpportunityIds(opportunityIds, studentPrn) {
  if (!opportunityIds.length || !studentPrn) {
    return new Map();
  }

  const placeholders = opportunityIds.map(() => '?').join(', ');
  let rows = [];

  if (await tableExists('application_stage_results')) {
    rows = await query(
      `
        SELECT
          hs.opportunity_id,
          asr.stage_id,
          asr.stage_result AS status,
          asr.updated_at
        FROM application_stage_results asr
        INNER JOIN placement_applications pa ON pa.id = asr.application_id
        INNER JOIN hiring_stages hs ON hs.id = asr.stage_id
        WHERE pa.PRN = ? AND hs.opportunity_id IN (${placeholders})
      `,
      [studentPrn, ...opportunityIds]
    );
  } else if (await tableExists('student_stage_records')) {
    rows = await query(
      `
        SELECT hs.opportunity_id, ssr.stage_id, ssr.status, ssr.updated_at
        FROM student_stage_records ssr
        INNER JOIN hiring_stages hs ON hs.id = ssr.stage_id
        WHERE ssr.PRN = ? AND hs.opportunity_id IN (${placeholders})
      `,
      [studentPrn, ...opportunityIds]
    );
  }

  const stageRecordsByOpportunityId = new Map();

  for (const row of rows) {
    const currentRecords = stageRecordsByOpportunityId.get(row.opportunity_id) || new Map();
    currentRecords.set(row.stage_id, {
      studentStatus: mapStudentStageStatus(row.status),
      updatedAt: toIsoString(row.updated_at),
    });
    stageRecordsByOpportunityId.set(row.opportunity_id, currentRecords);
  }

  return stageRecordsByOpportunityId;
}

async function getStageSelectionCountsByOpportunityIds(opportunityIds, scopedDepartment = '') {
  if (!opportunityIds.length) {
    return new Map();
  }

  const placeholders = opportunityIds.map(() => '?').join(', ');
  let rows = [];

  if (await tableExists('application_stage_results')) {
    rows = await query(
      `
        SELECT
          hs.opportunity_id,
          asr.stage_id,
          SUM(
            CASE
              WHEN LOWER(COALESCE(asr.stage_result, '')) IN ('cleared', 'shortlisted', 'qualified')
              THEN 1
              ELSE 0
            END
          ) AS selected_count
        FROM application_stage_results asr
        INNER JOIN hiring_stages hs ON hs.id = asr.stage_id
        WHERE hs.opportunity_id IN (${placeholders})
        GROUP BY hs.opportunity_id, asr.stage_id
      `,
      opportunityIds
    );
  } else if (await tableExists('student_stage_records')) {
    rows = await query(
      `
        SELECT
          hs.opportunity_id,
          ssr.stage_id,
          SUM(
            CASE
              WHEN LOWER(COALESCE(ssr.status, '')) IN ('qualified', 'cleared', 'shortlisted')
              THEN 1
              ELSE 0
            END
          ) AS selected_count
        FROM student_stage_records ssr
        INNER JOIN hiring_stages hs ON hs.id = ssr.stage_id
        WHERE hs.opportunity_id IN (${placeholders})
        GROUP BY hs.opportunity_id, ssr.stage_id
      `,
      opportunityIds
    );
  }

  const countsByOpportunityId = new Map();
  const normalizedScopedDepartment = normalizeDepartmentKey(scopedDepartment);

  let scopedRows = [];

  if (normalizedScopedDepartment) {
    if (await tableExists('application_stage_results')) {
      scopedRows = await query(
        `
          SELECT
            hs.opportunity_id,
            asr.stage_id,
            SUM(
              CASE
                WHEN LOWER(COALESCE(asr.stage_result, '')) IN ('cleared', 'shortlisted', 'qualified')
                THEN 1
                ELSE 0
              END
            ) AS selected_count
          FROM application_stage_results asr
          INNER JOIN placement_applications pa ON pa.id = asr.application_id
          INNER JOIN student_education se ON se.PRN = pa.PRN
          INNER JOIN hiring_stages hs ON hs.id = asr.stage_id
          WHERE hs.opportunity_id IN (${placeholders})
            AND LOWER(TRIM(COALESCE(se.department, ''))) = ?
          GROUP BY hs.opportunity_id, asr.stage_id
        `,
        [...opportunityIds, normalizedScopedDepartment]
      );
    } else if (await tableExists('student_stage_records')) {
      scopedRows = await query(
        `
          SELECT
            hs.opportunity_id,
            ssr.stage_id,
            SUM(
              CASE
                WHEN LOWER(COALESCE(ssr.status, '')) IN ('qualified', 'cleared', 'shortlisted')
                THEN 1
                ELSE 0
              END
            ) AS selected_count
          FROM student_stage_records ssr
          INNER JOIN student_education se ON se.PRN = ssr.PRN
          INNER JOIN hiring_stages hs ON hs.id = ssr.stage_id
          WHERE hs.opportunity_id IN (${placeholders})
            AND LOWER(TRIM(COALESCE(se.department, ''))) = ?
          GROUP BY hs.opportunity_id, ssr.stage_id
        `,
        [...opportunityIds, normalizedScopedDepartment]
      );
    }
  }

  const scopedCountsByOpportunityId = new Map();

  for (const row of rows) {
    const currentCounts = countsByOpportunityId.get(row.opportunity_id) || new Map();
    currentCounts.set(row.stage_id, Number(row.selected_count) || 0);
    countsByOpportunityId.set(row.opportunity_id, currentCounts);
  }

  for (const row of scopedRows) {
    const currentCounts = scopedCountsByOpportunityId.get(row.opportunity_id) || new Map();
    currentCounts.set(row.stage_id, Number(row.selected_count) || 0);
    scopedCountsByOpportunityId.set(row.opportunity_id, currentCounts);
  }

  const combinedCountsByOpportunityId = new Map();

  for (const opportunityId of opportunityIds) {
    const totalStageCounts = countsByOpportunityId.get(opportunityId) || new Map();
    const scopedStageCounts = scopedCountsByOpportunityId.get(opportunityId) || new Map();
    const combinedStageCounts = new Map();
    const stageIds = new Set([
      ...totalStageCounts.keys(),
      ...scopedStageCounts.keys(),
    ]);

    for (const stageId of stageIds) {
      combinedStageCounts.set(stageId, {
        totalCount: totalStageCounts.get(stageId) ?? 0,
        departmentCount: scopedStageCounts.get(stageId) ?? 0,
      });
    }

    combinedCountsByOpportunityId.set(opportunityId, combinedStageCounts);
  }

  return combinedCountsByOpportunityId;
}

function mapStudentStageStatus(value) {
  const normalizedValue = String(value || 'pending').trim().toLowerCase();

  switch (normalizedValue) {
    case 'qualified':
    case 'cleared':
    case 'shortlisted':
      return 'qualified';
    case 'rejected':
    case 'absent':
    case 'withdrawn':
      return 'notqualified';
    case 'appeared':
    case 'scheduled':
    case 'not_started':
    case 'on_hold':
      return 'inprogress';
    default:
      return 'pending';
  }
}

function getTodayDateKey() {
  return toMysqlDate(new Date());
}

function getStageSchedulePhase(stage, todayDateKey = getTodayDateKey()) {
  const stageDateKey = String(stage?.rawDate || '').trim();

  if (!stageDateKey) {
    return 'unknown';
  }

  if (stageDateKey < todayDateKey) {
    return 'past';
  }

  if (stageDateKey === todayDateKey) {
    return 'current';
  }

  return 'future';
}

function deriveStudentWorkflowStatuses(stages, studentStageRecords = new Map(), stageActivityCounts = new Map()) {
  const derivedStatuses = new Map();

  if (!Array.isArray(stages) || !stages.length) {
    return derivedStatuses;
  }

  const todayDateKey = getTodayDateKey();
  let isStudentEliminated = false;
  let hasAssignedActiveStage = false;
  let hasStudentProgress = false;

  for (const stage of stages) {
    const stageRecord = studentStageRecords.get(stage.id) || null;
    const explicitStatus = stageRecord?.studentStatus || null;
    const stageActivityCount = Number(stageActivityCounts.get(stage.id)) || 0;

    if (isStudentEliminated) {
      derivedStatuses.set(stage.id, {
        studentStatus: 'notqualified',
        updatedAt: null,
      });
      continue;
    }

    if (explicitStatus === 'qualified') {
      derivedStatuses.set(stage.id, {
        studentStatus: 'qualified',
        updatedAt: stageRecord.updatedAt || null,
      });
      hasStudentProgress = true;
      continue;
    }

    if (explicitStatus === 'notqualified') {
      derivedStatuses.set(stage.id, {
        studentStatus: 'notqualified',
        updatedAt: stageRecord.updatedAt || null,
      });
      hasStudentProgress = true;
      isStudentEliminated = true;
      continue;
    }

    if (explicitStatus === 'inprogress') {
      derivedStatuses.set(stage.id, {
        studentStatus: 'inprogress',
        updatedAt: stageRecord.updatedAt || null,
      });
      hasStudentProgress = true;
      hasAssignedActiveStage = true;
      continue;
    }

    if (stageActivityCount > 0) {
      derivedStatuses.set(stage.id, {
        studentStatus: 'notqualified',
        updatedAt: null,
      });
      isStudentEliminated = true;
      continue;
    }

    const stageSchedulePhase = getStageSchedulePhase(stage, todayDateKey);
    const shouldMarkInProgress =
      !hasAssignedActiveStage &&
      (
        hasStudentProgress ||
        stageSchedulePhase === 'past' ||
        stageSchedulePhase === 'current'
      );

    derivedStatuses.set(stage.id, {
      studentStatus: shouldMarkInProgress ? 'inprogress' : 'pending',
      updatedAt: null,
    });

    if (shouldMarkInProgress) {
      hasAssignedActiveStage = true;
    }
  }

  return derivedStatuses;
}

async function getStageActivityCountsByOpportunityIds(opportunityIds) {
  if (!opportunityIds.length) {
    return new Map();
  }

  const placeholders = opportunityIds.map(() => '?').join(', ');
  let rows = [];

  if (await tableExists('application_stage_results')) {
    rows = await query(
      `
        SELECT
          hs.opportunity_id,
          asr.stage_id,
          COUNT(*) AS activity_count
        FROM application_stage_results asr
        INNER JOIN hiring_stages hs ON hs.id = asr.stage_id
        WHERE hs.opportunity_id IN (${placeholders})
        GROUP BY hs.opportunity_id, asr.stage_id
      `,
      opportunityIds
    );
  } else if (await tableExists('student_stage_records')) {
    rows = await query(
      `
        SELECT
          hs.opportunity_id,
          ssr.stage_id,
          COUNT(*) AS activity_count
        FROM student_stage_records ssr
        INNER JOIN hiring_stages hs ON hs.id = ssr.stage_id
        WHERE hs.opportunity_id IN (${placeholders})
        GROUP BY hs.opportunity_id, ssr.stage_id
      `,
      opportunityIds
    );
  }

  const countsByOpportunityId = new Map();

  for (const row of rows) {
    const currentCounts = countsByOpportunityId.get(row.opportunity_id) || new Map();
    currentCounts.set(row.stage_id, Number(row.activity_count) || 0);
    countsByOpportunityId.set(row.opportunity_id, currentCounts);
  }

  return countsByOpportunityId;
}

async function getPlacementApplicationsByOpportunityIds(opportunityIds, studentPrn) {
  if (!opportunityIds.length || !studentPrn) {
    return new Map();
  }

  await ensurePlacementApplicationsTable();

  const placeholders = opportunityIds.map(() => '?').join(', ');
  const rows = await query(
    `
      SELECT
        id,
        opportunity_id,
        PRN,
        application_status,
        final_outcome,
        submitted_at,
        updated_at,
        decision_at
      FROM placement_applications
      WHERE PRN = ? AND opportunity_id IN (${placeholders})
    `,
    [studentPrn, ...opportunityIds]
  );

  return new Map(
    rows.map((row) => [
      row.opportunity_id,
      {
        id: row.id,
        prn: row.PRN,
        status: row.application_status || 'pending_verification',
        finalOutcome: row.final_outcome || 'in_process',
        appliedAt: toIsoString(row.submitted_at),
        updatedAt: toIsoString(row.updated_at),
        decisionAt: toIsoString(row.decision_at),
      },
    ])
  );
}

async function getStudentPlacedApplication(studentPrn) {
  if (!studentPrn) {
    return null;
  }

  await ensurePlacementApplicationsTable();

  const rows = await query(
    `
      SELECT
        pa.id,
        pa.opportunity_id,
        pa.PRN,
        pa.application_status,
        pa.final_outcome,
        pa.decision_at,
        tpo.company_name,
        tpo.job_title
      FROM placement_applications pa
      INNER JOIN tpo_opportunities tpo ON tpo.id = pa.opportunity_id
      WHERE pa.PRN = ?
        AND (
          pa.application_status = 'placed'
          OR pa.final_outcome = 'placed'
        )
      ORDER BY pa.decision_at DESC, pa.updated_at DESC, pa.id DESC
      LIMIT 1
    `,
    [studentPrn]
  );

  const placedApplication = rows[0] || null;

  if (!placedApplication) {
    return null;
  }

  return {
    id: placedApplication.id,
    opportunityId: placedApplication.opportunity_id,
    prn: placedApplication.PRN,
    status: placedApplication.application_status || 'placed',
    finalOutcome: placedApplication.final_outcome || 'placed',
    decisionAt: toIsoString(placedApplication.decision_at),
    company: placedApplication.company_name || '',
    title: placedApplication.job_title || '',
  };
}

async function syncStudentFinalRoundPlacements(studentPrn, changedBy = 'system') {
  if (!studentPrn || !(await tableExists('application_stage_results'))) {
    return;
  }

  await ensurePlacementApplicationsTable();
  await ensureApplicationStatusHistoryTable();

  const rows = await query(
    `
      SELECT
        pa.id,
        pa.application_status,
        asr.stage_id
      FROM placement_applications pa
      INNER JOIN application_stage_results asr ON asr.application_id = pa.id
      INNER JOIN hiring_stages hs ON hs.id = asr.stage_id
      INNER JOIN (
        SELECT opportunity_id, MAX(stage_order) AS max_stage_order
        FROM hiring_stages
        GROUP BY opportunity_id
      ) max_stage
        ON max_stage.opportunity_id = hs.opportunity_id
       AND max_stage.max_stage_order = hs.stage_order
      WHERE pa.PRN = ?
        AND LOWER(COALESCE(asr.stage_result, '')) IN ('cleared', 'shortlisted')
        AND COALESCE(pa.final_outcome, '') <> 'placed'
    `,
    [studentPrn]
  );

  for (const row of rows) {
    if ((row.application_status || '') !== 'placed') {
      await query(
        `
          INSERT INTO application_status_history
          (application_id, old_status, new_status, changed_by, change_reason)
          VALUES (?, ?, ?, ?, ?)
        `,
        [
          row.id,
          row.application_status || null,
          'placed',
          changedBy,
          'Student marked placed after clearing the final hiring round.',
        ]
      );
    }

    await query(
      `
        UPDATE placement_applications
        SET current_stage_id = ?,
            application_status = 'placed',
            final_outcome = 'placed',
            decision_at = COALESCE(decision_at, CURRENT_TIMESTAMP)
        WHERE id = ?
      `,
      [row.stage_id, row.id]
    );
  }
}

async function attachHiringStages(rows, options = {}) {
  if (!Array.isArray(rows) || !rows.length) {
    return [];
  }

  const { studentPrn = '', scopedDepartment = '' } = options;
  const opportunityIds = rows.map((row) => row.id).filter(Boolean);
  await syncHiringStageLifecycleStatuses(opportunityIds);

  const stagesByOpportunityId = await getHiringStagesByOpportunityIds(opportunityIds);
  const stageSelectionCountsByOpportunityId = await getStageSelectionCountsByOpportunityIds(
    opportunityIds,
    scopedDepartment
  );
  const stageActivityCountsByOpportunityId = await getStageActivityCountsByOpportunityIds(
    opportunityIds
  );
  const studentStageRecordsByOpportunityId = await getStudentStageRecordsByOpportunityIds(
    opportunityIds,
    studentPrn
  );
  const placementApplicationsByOpportunityId = await getPlacementApplicationsByOpportunityIds(
    opportunityIds,
    studentPrn
  );

  return rows.map((row) => {
    const stages = stagesByOpportunityId.get(row.id) || [];
    const studentStageRecords = studentStageRecordsByOpportunityId.get(row.id) || new Map();
    const stageActivityCounts = stageActivityCountsByOpportunityId.get(row.id) || new Map();
    const derivedStudentStatuses = deriveStudentWorkflowStatuses(
      stages,
      studentStageRecords,
      stageActivityCounts
    );

    return {
      ...row,
      student_application: placementApplicationsByOpportunityId.get(row.id) || null,
      workflow: stages.map((stage) => {
        const derivedStudentStatus = derivedStudentStatuses.get(stage.id);
        const selectionCountRecord = stageSelectionCountsByOpportunityId.get(row.id)?.get(stage.id);
        const selectedCount =
          selectionCountRecord && typeof selectionCountRecord === 'object'
            ? selectionCountRecord.totalCount ?? 0
            : selectionCountRecord ?? 0;
        const departmentSelectedCount =
          selectionCountRecord && typeof selectionCountRecord === 'object'
            ? selectionCountRecord.departmentCount ?? 0
            : 0;

        return {
          ...stage,
          selectedCount,
          departmentSelectedCount,
          studentStatus: derivedStudentStatus?.studentStatus || 'pending',
          studentUpdatedAt: derivedStudentStatus?.updatedAt || null,
        };
      }),
    };
  });
}

async function replaceHiringStages(opportunityId, workflow) {
  await query('DELETE FROM hiring_stages WHERE opportunity_id = ?', [opportunityId]);

  if (!workflow.length) {
    return;
  }

  for (const stage of workflow) {
    await query(
      `
        INSERT INTO hiring_stages
        (opportunity_id, stage_order, stage_name, lifecycle_status, planned_date)
        VALUES (?, ?, ?, ?, ?)
      `,
      [
        opportunityId,
        stage.stage_order,
        stage.stage_name,
        stage.lifecycle_status,
        stage.planned_date,
      ]
    );
  }
}

async function getStudentEligibilityContext(prn) {
  const personalRows = await query(
    `
      SELECT sp.PRN, sp.first_name, sp.middle_name, sp.last_name
      FROM student_personal sp
      WHERE sp.PRN = ?
      LIMIT 1
    `,
    [prn]
  );
  const educationRows = await query(
    `
      SELECT department, current_cgpa, active_backlogs, passing_year
      FROM student_education
      WHERE PRN = ?
      LIMIT 1
    `,
    [prn]
  );

  const personal = personalRows[0] || null;
  const education = educationRows[0] || {};

  return {
    prn: String(prn || '').trim(),
    fullName: [personal?.first_name, personal?.middle_name, personal?.last_name].filter(Boolean).join(' ').trim(),
    department: education.department || '',
    currentCgpa: education.current_cgpa === null || education.current_cgpa === undefined ? null : Number(education.current_cgpa),
    activeBacklogs:
      education.active_backlogs === null || education.active_backlogs === undefined
        ? null
        : Number(education.active_backlogs),
    passingYear:
      education.passing_year === null || education.passing_year === undefined
        ? null
        : Number(education.passing_year),
  };
}

function evaluateOpportunityEligibility(opportunityRow, studentContext) {
  const allowedDepartments = parseDepartmentList(opportunityRow.allowed_departments);
  const normalizedAllowedDepartments = allowedDepartments.map(normalizeDepartmentKey);
  const normalizedStudentDepartment = normalizeDepartmentKey(studentContext.department);
  const minCgpa =
    opportunityRow.min_cgpa === null || opportunityRow.min_cgpa === undefined
      ? null
      : Number(opportunityRow.min_cgpa);
  const maxBacklogs =
    opportunityRow.max_backlogs === null || opportunityRow.max_backlogs === undefined
      ? null
      : Number(opportunityRow.max_backlogs);
  const passingYear =
    opportunityRow.passing_year === null || opportunityRow.passing_year === undefined
      ? null
      : Number(opportunityRow.passing_year);

  const checks = {
    department:
      normalizedAllowedDepartments.length === 0 ||
      normalizedAllowedDepartments.includes(normalizedStudentDepartment),
    cgpa: minCgpa === null || (studentContext.currentCgpa !== null && studentContext.currentCgpa >= minCgpa),
    backlogs:
      maxBacklogs === null || (studentContext.activeBacklogs !== null && studentContext.activeBacklogs <= maxBacklogs),
    passingYear:
      passingYear === null || (studentContext.passingYear !== null && studentContext.passingYear === passingYear),
  };

  return {
    isEligible: Object.values(checks).every(Boolean),
    checks,
    summary: {
      allowedDepartments,
      minCgpa,
      maxBacklogs,
      passingYear,
      studentDepartment: studentContext.department || '',
      studentCgpa: studentContext.currentCgpa,
      studentBacklogs: studentContext.activeBacklogs,
      studentPassingYear: studentContext.passingYear,
    },
  };
}

function buildOpportunityPayload(body, options = {}) {
  const {
    attachmentUrl,
    existingRow = null,
    allowPartial = false,
  } = options;

  const requiredSkillsSource = firstDefined(body.skills, body.requiredSkills);

  const payload = {
    company_name: normalizeTextValue(
      firstDefined(body.company_name, body.company, allowPartial ? existingRow?.company_name : undefined)
    ),
    job_title: normalizeTextValue(
      firstDefined(body.job_title, body.title, allowPartial ? existingRow?.job_title : undefined)
    ),
    location: normalizeTextValue(
      firstDefined(body.location, allowPartial ? existingRow?.location : undefined)
    ),
    job_type: normalizeTextValue(
      firstDefined(body.job_type, body.type, allowPartial ? existingRow?.job_type : undefined)
    ),
    deadline: toMysqlDateTime(
      firstDefined(body.deadline, allowPartial ? existingRow?.deadline : undefined)
    ),
    category: normalizeTextValue(
      firstDefined(body.category, allowPartial ? existingRow?.category : undefined)
    ),
    level: normalizeTextValue(firstDefined(body.level, allowPartial ? existingRow?.level : undefined)),
    job_function: normalizeTextValue(
      firstDefined(body.job_function, body.functions, allowPartial ? existingRow?.job_function : undefined)
    ),
    ctc: toNullableNumber(firstDefined(body.ctc, allowPartial ? existingRow?.ctc : undefined)),
    other_info: normalizeTextValue(
      firstDefined(body.other_info, body.otherInfo, allowPartial ? existingRow?.other_info : undefined)
    ),
    role_overview: normalizeTextValue(
      firstDefined(
        body.role_overview,
        body.roleOverview,
        allowPartial ? existingRow?.role_overview : undefined
      )
    ),
    key_responsibilities: normalizeTextValue(
      firstDefined(
        body.key_responsibilities,
        body.responsibilities,
        allowPartial ? existingRow?.key_responsibilities : undefined
      )
    ),
    required_skills: normalizeTextValue(
      Array.isArray(requiredSkillsSource)
        ? requiredSkillsSource.join(', ')
        : firstDefined(requiredSkillsSource, allowPartial ? existingRow?.required_skills : undefined)
    ),
    what_we_offer: normalizeTextValue(
      firstDefined(body.what_we_offer, body.offer, allowPartial ? existingRow?.what_we_offer : undefined)
    ),
    disclaimer: normalizeTextValue(
      firstDefined(body.disclaimer, allowPartial ? existingRow?.disclaimer : undefined)
    ),
    additional_info: normalizeTextValue(
      firstDefined(body.additional_info, body.extraInfo, allowPartial ? existingRow?.additional_info : undefined)
    ),
    min_cgpa: toNullableNumber(
      firstDefined(body.min_cgpa, body.minCgpa, allowPartial ? existingRow?.min_cgpa : undefined)
    ),
    max_backlogs: toNullableInteger(
      firstDefined(
        body.max_backlogs,
        body.maxBacklogs,
        allowPartial ? existingRow?.max_backlogs : undefined
      )
    ),
    allowed_departments: normalizeTextValue(
      firstDefined(
        body.allowed_departments,
        body.allowedDepartments,
        allowPartial ? existingRow?.allowed_departments : undefined
      )
    ),
    passing_year: toNullableInteger(
      firstDefined(body.passing_year, body.passingYear, allowPartial ? existingRow?.passing_year : undefined)
    ),
    attachment_url:
      attachmentUrl !== undefined
        ? attachmentUrl
        : normalizeTextValue(
            firstDefined(
              body.attachment_url,
              body.attachmentUrl,
              allowPartial ? existingRow?.attachment_url : undefined
            )
          ),
    status: normalizeStatus(firstDefined(body.status, allowPartial ? existingRow?.status : 'active')),
    workflow: parseWorkflowValue(body.workflow),
  };

  return payload;
}

tpcOpportunitiesRoutes.get(
  '/',
  asyncHandler(async (req, res) => {
    await ensureOpportunityTrackingSchema();

    const statusFilter = normalizeTextValue(req.query.status);
    const studentPrn = normalizeTextValue(
      req.query.studentPrn || (req.auth?.role === 'student' ? req.auth.prn : '')
    );
    const scopedDepartment = req.auth?.role === 'tpc' ? await resolveTpcDepartment(req) : '';
    const values = [];
    let sql = 'SELECT * FROM tpo_opportunities';

    await syncStudentFinalRoundPlacements(studentPrn, 'system');

    if (statusFilter && statusFilter.toLowerCase() !== 'all') {
      sql += ' WHERE status = ?';
      values.push(normalizeStatus(statusFilter));
    }

    sql += ' ORDER BY created_at DESC, id DESC';

    const rows = await attachHiringStages(await query(sql, values), { studentPrn, scopedDepartment });

    res.json({
      success: true,
      data: rows.map(mapRowToOpportunity),
    });
  })
);

tpcOpportunitiesRoutes.get(
  '/:id',
  asyncHandler(async (req, res) => {
    await ensureOpportunityTrackingSchema();

    const studentPrn = normalizeTextValue(
      req.query.studentPrn || (req.auth?.role === 'student' ? req.auth.prn : '')
    );
    const scopedDepartment = req.auth?.role === 'tpc' ? await resolveTpcDepartment(req) : '';
    await syncStudentFinalRoundPlacements(studentPrn, 'system');

    const opportunities = await attachHiringStages([await getOpportunityById(req.params.id)].filter(Boolean), {
      studentPrn,
      scopedDepartment,
    });
    const opportunity = opportunities[0] ?? null;

    if (!opportunity) {
      throw createHttpError(404, 'Opportunity not found.');
    }

    res.json({
      success: true,
      data: mapRowToOpportunity(opportunity),
    });
  })
);

tpcOpportunitiesRoutes.post(
  '/',
  upload.any(),
  asyncHandler(async (req, res) => {
    await ensureOpportunityTrackingSchema();

    const actor = getRequestActor(req);
    const existingAttachments = parseAttachmentValue(
      firstDefined(req.body.existingAttachments, req.body.attachment_url, req.body.attachmentUrl)
    );
    const uploadedAttachments = await uploadAttachmentFiles(req);
    const attachmentUrl = serializeAttachments([...existingAttachments, ...uploadedAttachments]);
    const payload = buildOpportunityPayload(req.body, { attachmentUrl });

    if (!payload.company_name || !payload.job_title) {
      throw createHttpError(400, 'company_name and job_title are required.');
    }

    const result = await query(
      `
        INSERT INTO tpo_opportunities
        (
          company_name,
          job_title,
          location,
          job_type,
          deadline,
          category,
          level,
          job_function,
          ctc,
          other_info,
          role_overview,
          key_responsibilities,
          required_skills,
          what_we_offer,
          disclaimer,
          additional_info,
          min_cgpa,
          max_backlogs,
          allowed_departments,
          passing_year,
          attachment_url,
          status,
          created_by_role,
          created_by_id,
          created_by_email,
          updated_by_role,
          updated_by_id,
          updated_by_email
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        payload.company_name,
        payload.job_title,
        payload.location,
        payload.job_type,
        payload.deadline,
        payload.category,
        payload.level,
        payload.job_function,
        payload.ctc,
        payload.other_info,
        payload.role_overview,
        payload.key_responsibilities,
        payload.required_skills,
        payload.what_we_offer,
        payload.disclaimer,
        payload.additional_info,
        payload.min_cgpa,
        payload.max_backlogs,
        payload.allowed_departments,
        payload.passing_year,
        payload.attachment_url,
        payload.status,
        actor.role,
        actor.id,
        actor.email,
        actor.role,
        actor.id,
        actor.email,
      ]
    );

    await replaceHiringStages(result.insertId, payload.workflow);
    await writeOpportunityLog({
      opportunityId: result.insertId,
      actionType: 'created',
      actor,
    });
    await writePanelActivityLog({
      entityType: 'opportunity',
      entityId: result.insertId,
      formType: 'opportunity',
      actionType: 'create',
      actor,
      summary: `${payload.company_name || 'Opportunity'} - ${payload.job_title || 'Opportunity'} created`,
      details: {
        company: payload.company_name,
        title: payload.job_title,
        panelScope: actor.role,
        status: payload.status,
      },
    });

    const createdOpportunity = (
      await attachHiringStages([await getOpportunityById(result.insertId)].filter(Boolean))
    )[0];

    res.status(201).json({
      success: true,
      message: 'Opportunity created successfully.',
      data: mapRowToOpportunity(createdOpportunity),
    });
  })
);

tpcOpportunitiesRoutes.post(
  '/:id/apply',
  asyncHandler(async (req, res) => {
    if (req.auth?.role !== 'student') {
      throw createHttpError(403, 'Only students can apply for opportunities.');
    }

    const studentPrn = normalizeTextValue(req.auth?.prn || req.body?.prn);

    if (!studentPrn) {
      throw createHttpError(401, 'Student identity is required to apply.');
    }

    await ensurePlacementApplicationsTable();
    await ensureApplicationStatusHistoryTable();

    const opportunity = await getOpportunityById(req.params.id);

    if (!opportunity) {
      throw createHttpError(404, 'Opportunity not found.');
    }

    if (normalizeStatus(opportunity.status) !== 'active') {
      throw createHttpError(400, 'Applications are closed for this opportunity.');
    }

    const studentContext = await getStudentEligibilityContext(studentPrn);

    if (!studentContext.prn) {
      throw createHttpError(404, 'Student profile not found.');
    }

    await syncStudentFinalRoundPlacements(studentPrn, 'system');
    const placedApplication = await getStudentPlacedApplication(studentPrn);

    if (placedApplication) {
      throw createHttpError(
        409,
        `You are already placed at ${placedApplication.company || 'a company'}. You can view opportunities, but applying is locked.`
      );
    }

    const eligibility = evaluateOpportunityEligibility(opportunity, studentContext);

    if (!eligibility.isEligible) {
      throw createHttpError(400, 'You are not eligible to apply for this opportunity.');
    }

    const existingApplications = await query(
      'SELECT id, application_status, submitted_at, updated_at FROM placement_applications WHERE opportunity_id = ? AND PRN = ? LIMIT 1',
      [req.params.id, studentPrn]
    );

    if (existingApplications.length) {
      throw createHttpError(409, 'You have already applied for this opportunity.');
    }

    await query(
      `
        INSERT INTO placement_applications
        (opportunity_id, PRN, application_status, final_outcome, eligibility_snapshot, submitted_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `,
      [req.params.id, studentPrn, 'pending_verification', 'in_process', JSON.stringify(eligibility.summary)]
    );

    const applicationRows = await query(
      `
        SELECT id, opportunity_id, PRN, application_status, final_outcome, submitted_at, updated_at
        FROM placement_applications
        WHERE opportunity_id = ? AND PRN = ?
        LIMIT 1
      `,
      [req.params.id, studentPrn]
    );
    const application = applicationRows[0] || null;

    if (application?.id) {
      await query(
        `
          INSERT INTO application_status_history
          (application_id, old_status, new_status, changed_by, change_reason)
          VALUES (?, ?, ?, ?, ?)
        `,
        [
          application.id,
          null,
          application.application_status || 'pending_verification',
          studentPrn,
          'Student submitted application. Pending TPO verification.',
        ]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully and sent to TPO for verification.',
      data: {
        id: application?.id || null,
        opportunityId: Number(req.params.id),
        prn: studentPrn,
        status: application?.application_status || 'pending_verification',
        finalOutcome: application?.final_outcome || 'in_process',
        appliedAt: toIsoString(application?.submitted_at),
        updatedAt: toIsoString(application?.updated_at),
      },
    });
  })
);

tpcOpportunitiesRoutes.put(
  '/:id',
  upload.any(),
  asyncHandler(async (req, res) => {
    await ensureOpportunityTrackingSchema();

    const actor = getRequestActor(req);
    const existingOpportunity = await getOpportunityById(req.params.id);

    if (!existingOpportunity) {
      throw createHttpError(404, 'Opportunity not found.');
    }

    const shouldRemoveAttachment =
      String(firstDefined(req.body.removeAttachment, 'false')).toLowerCase() === 'true';
    const retainedAttachments = shouldRemoveAttachment
      ? []
      : parseAttachmentValue(firstDefined(req.body.existingAttachments, existingOpportunity.attachment_url));
    const uploadedAttachments = await uploadAttachmentFiles(req);
    const nextAttachments = [...retainedAttachments, ...uploadedAttachments];
    const nextAttachmentUrl = shouldRemoveAttachment
      ? null
      : nextAttachments.length
        ? serializeAttachments(nextAttachments)
        : undefined;

    const payload = buildOpportunityPayload(req.body, {
      attachmentUrl: nextAttachmentUrl,
      existingRow: existingOpportunity,
      allowPartial: true,
    });

    if (!payload.company_name || !payload.job_title) {
      throw createHttpError(400, 'company_name and job_title are required.');
    }

    await query(
      `
        UPDATE tpo_opportunities
        SET
          company_name = ?,
          job_title = ?,
          location = ?,
          job_type = ?,
          deadline = ?,
          category = ?,
          level = ?,
          job_function = ?,
          ctc = ?,
          other_info = ?,
          role_overview = ?,
          key_responsibilities = ?,
          required_skills = ?,
          what_we_offer = ?,
          disclaimer = ?,
          additional_info = ?,
          min_cgpa = ?,
          max_backlogs = ?,
          allowed_departments = ?,
          passing_year = ?,
          attachment_url = ?,
          status = ?,
          updated_by_role = ?,
          updated_by_id = ?,
          updated_by_email = ?
        WHERE id = ?
      `,
      [
        payload.company_name,
        payload.job_title,
        payload.location,
        payload.job_type,
        payload.deadline,
        payload.category,
        payload.level,
        payload.job_function,
        payload.ctc,
        payload.other_info,
        payload.role_overview,
        payload.key_responsibilities,
        payload.required_skills,
        payload.what_we_offer,
        payload.disclaimer,
        payload.additional_info,
        payload.min_cgpa,
        payload.max_backlogs,
        payload.allowed_departments,
        payload.passing_year,
        payload.attachment_url,
        payload.status,
        actor.role,
        actor.id,
        actor.email,
        req.params.id,
      ]
    );

    await replaceHiringStages(req.params.id, payload.workflow);
    await writeOpportunityLog({
      opportunityId: req.params.id,
      actionType: 'updated',
      actor,
    });
    await writePanelActivityLog({
      entityType: 'opportunity',
      entityId: Number(req.params.id),
      formType: 'opportunity',
      actionType: 'update',
      actor,
      summary: `${payload.company_name || existingOpportunity.company_name || 'Opportunity'} - ${payload.job_title || existingOpportunity.job_title || 'Opportunity'} updated`,
      details: {
        company: payload.company_name || existingOpportunity.company_name || '',
        title: payload.job_title || existingOpportunity.job_title || '',
        panelScope: actor.role,
        status: payload.status,
      },
    });

    const updatedOpportunity = (
      await attachHiringStages([await getOpportunityById(req.params.id)].filter(Boolean))
    )[0];

    res.json({
      success: true,
      message: 'Opportunity updated successfully.',
      data: mapRowToOpportunity(updatedOpportunity),
    });
  })
);

tpcOpportunitiesRoutes.patch(
  '/:id/status',
  asyncHandler(async (req, res) => {
    await ensureOpportunityTrackingSchema();

    const actor = getRequestActor(req);
    const existingOpportunity = await getOpportunityById(req.params.id);

    if (!existingOpportunity) {
      throw createHttpError(404, 'Opportunity not found.');
    }

    const nextStatus = normalizeStatus(req.body.status, '');

    if (!nextStatus) {
      throw createHttpError(400, 'A valid status is required.');
    }

    await query(
      `
        UPDATE tpo_opportunities
        SET status = ?, updated_by_role = ?, updated_by_id = ?, updated_by_email = ?
        WHERE id = ?
      `,
      [nextStatus, actor.role, actor.id, actor.email, req.params.id]
    );
    await writeOpportunityLog({
      opportunityId: req.params.id,
      actionType: 'updated',
      actor,
    });
    await writePanelActivityLog({
      entityType: 'opportunity',
      entityId: Number(req.params.id),
      formType: 'opportunity',
      actionType: 'status_update',
      actor,
      summary: `${existingOpportunity.company_name || 'Opportunity'} status changed to ${nextStatus}`,
      details: {
        previousStatus: existingOpportunity.status || null,
        nextStatus,
        company: existingOpportunity.company_name || '',
        title: existingOpportunity.job_title || '',
      },
    });

    const updatedOpportunity = await getOpportunityById(req.params.id);

    res.json({
      success: true,
      message: 'Opportunity status updated successfully.',
      data: mapRowToOpportunity(updatedOpportunity),
    });
  })
);

tpcOpportunitiesRoutes.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await ensureOpportunityTrackingSchema();

    const actor = getRequestActor(req);
    const existingOpportunity = await getOpportunityById(req.params.id);

    if (!existingOpportunity) {
      throw createHttpError(404, 'Opportunity not found.');
    }

    await writePanelActivityLog({
      entityType: 'opportunity',
      entityId: Number(req.params.id),
      formType: 'opportunity',
      actionType: 'delete',
      actor,
      summary: `${existingOpportunity.company_name || 'Opportunity'} - ${existingOpportunity.job_title || 'Opportunity'} deleted`,
      details: {
        company: existingOpportunity.company_name || '',
        title: existingOpportunity.job_title || '',
        previousStatus: existingOpportunity.status || '',
      },
    });
    await query('DELETE FROM tpo_opportunities WHERE id = ?', [req.params.id]);

    res.json({
      success: true,
      message: 'Opportunity deleted successfully.',
    });
  })
);

module.exports = tpcOpportunitiesRoutes;
