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

function normalizeStatus(value, fallback = 'active') {
  const allowedStatuses = new Set(['active', 'closed', 'draft']);
  const normalizedValue = String(value || fallback).trim().toLowerCase();
  return allowedStatuses.has(normalizedValue) ? normalizedValue : fallback;
}

function normalizeWorkflowStatus(value, fallback = 'upcoming') {
  const allowedStatuses = new Set(['upcoming', 'current', 'completed']);
  const normalizedValue = String(value || fallback).trim().toLowerCase();
  return allowedStatuses.has(normalizedValue) ? normalizedValue : fallback;
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
      stage_date: toMysqlDate(item?.stage_date ?? item?.date ?? item?.roundDate),
      stage_status: normalizeWorkflowStatus(item?.stage_status ?? item?.status, 'upcoming'),
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
    attachmentUrl: attachments[0]?.url || '',
    attachment: attachments,
    workflow,
    status: row.status || 'active',
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
  };
}

async function getOpportunityById(id) {
  const rows = await query('SELECT * FROM tpo_opportunities WHERE id = ?', [id]);
  return rows[0] ?? null;
}

async function getHiringStagesByOpportunityIds(opportunityIds) {
  if (!opportunityIds.length) {
    return new Map();
  }

  const placeholders = opportunityIds.map(() => '?').join(', ');
  const rows = await query(
    `
      SELECT id, opportunity_id, stage_order, stage_name, stage_status, stage_date
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
      status: normalizeWorkflowStatus(row.stage_status, 'upcoming'),
      date: toIsoString(row.stage_date),
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
  const rows = await query(
    `
      SELECT hs.opportunity_id, ssr.stage_id, ssr.status, ssr.updated_at
      FROM student_stage_records ssr
      INNER JOIN hiring_stages hs ON hs.id = ssr.stage_id
      WHERE ssr.PRN = ? AND hs.opportunity_id IN (${placeholders})
    `,
    [studentPrn, ...opportunityIds]
  );

  const stageRecordsByOpportunityId = new Map();

  for (const row of rows) {
    const currentRecords = stageRecordsByOpportunityId.get(row.opportunity_id) || new Map();
    currentRecords.set(row.stage_id, {
      studentStatus: String(row.status || 'pending').trim().toLowerCase(),
      updatedAt: toIsoString(row.updated_at),
    });
    stageRecordsByOpportunityId.set(row.opportunity_id, currentRecords);
  }

  return stageRecordsByOpportunityId;
}

async function attachHiringStages(rows, options = {}) {
  if (!Array.isArray(rows) || !rows.length) {
    return [];
  }

  const { studentPrn = '' } = options;
  const stagesByOpportunityId = await getHiringStagesByOpportunityIds(
    rows.map((row) => row.id).filter(Boolean)
  );
  const studentStageRecordsByOpportunityId = await getStudentStageRecordsByOpportunityIds(
    rows.map((row) => row.id).filter(Boolean),
    studentPrn
  );

  return rows.map((row) => ({
    ...row,
    workflow: (stagesByOpportunityId.get(row.id) || []).map((stage) => {
      const studentStageRecord = studentStageRecordsByOpportunityId.get(row.id)?.get(stage.id);

      return {
        ...stage,
        studentStatus: studentStageRecord?.studentStatus || 'pending',
        studentUpdatedAt: studentStageRecord?.updatedAt || null,
      };
    }),
  }));
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
        (opportunity_id, stage_order, stage_name, stage_status, stage_date)
        VALUES (?, ?, ?, ?, ?)
      `,
      [
        opportunityId,
        stage.stage_order,
        stage.stage_name,
        stage.stage_status,
        stage.stage_date,
      ]
    );
  }
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
    const statusFilter = normalizeTextValue(req.query.status);
    const studentPrn = normalizeTextValue(req.query.studentPrn);
    const values = [];
    let sql = 'SELECT * FROM tpo_opportunities';

    if (statusFilter && statusFilter.toLowerCase() !== 'all') {
      sql += ' WHERE status = ?';
      values.push(normalizeStatus(statusFilter));
    }

    sql += ' ORDER BY created_at DESC, id DESC';

    const rows = await attachHiringStages(await query(sql, values), { studentPrn });

    res.json({
      success: true,
      data: rows.map(mapRowToOpportunity),
    });
  })
);

tpcOpportunitiesRoutes.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const studentPrn = normalizeTextValue(req.query.studentPrn);
    const opportunities = await attachHiringStages([await getOpportunityById(req.params.id)].filter(Boolean), {
      studentPrn,
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
          status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      ]
    );

    await replaceHiringStages(result.insertId, payload.workflow);

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

tpcOpportunitiesRoutes.put(
  '/:id',
  upload.any(),
  asyncHandler(async (req, res) => {
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
          status = ?
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
        req.params.id,
      ]
    );

    await replaceHiringStages(req.params.id, payload.workflow);

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
    const existingOpportunity = await getOpportunityById(req.params.id);

    if (!existingOpportunity) {
      throw createHttpError(404, 'Opportunity not found.');
    }

    const nextStatus = normalizeStatus(req.body.status, '');

    if (!nextStatus) {
      throw createHttpError(400, 'A valid status is required.');
    }

    await query('UPDATE tpo_opportunities SET status = ? WHERE id = ?', [nextStatus, req.params.id]);

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
    const existingOpportunity = await getOpportunityById(req.params.id);

    if (!existingOpportunity) {
      throw createHttpError(404, 'Opportunity not found.');
    }

    await query('DELETE FROM tpo_opportunities WHERE id = ?', [req.params.id]);

    res.json({
      success: true,
      message: 'Opportunity deleted successfully.',
    });
  })
);

module.exports = tpcOpportunitiesRoutes;
