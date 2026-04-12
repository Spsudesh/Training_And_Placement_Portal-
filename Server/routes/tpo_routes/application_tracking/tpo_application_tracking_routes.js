const express = require('express');
const db = require('../../../config/db').db;

const tpoApplicationTrackingRoutes = express.Router();

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

  await ensureColumnExists(
    'placement_applications',
    'submitted_at',
    'ALTER TABLE placement_applications ADD COLUMN submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER eligibility_snapshot'
  );
  await ensureColumnExists(
    'placement_applications',
    'current_stage_id',
    'ALTER TABLE placement_applications ADD COLUMN current_stage_id BIGINT NULL AFTER application_status'
  ).catch(() => {});
  await ensureColumnExists(
    'placement_applications',
    'final_outcome',
    "ALTER TABLE placement_applications ADD COLUMN final_outcome VARCHAR(50) NOT NULL DEFAULT 'in_process' AFTER current_stage_id"
  ).catch(() => {});

  if (await columnExists('placement_applications', 'applied_at')) {
    await query(`
      UPDATE placement_applications
      SET submitted_at = COALESCE(submitted_at, applied_at, CURRENT_TIMESTAMP)
      WHERE submitted_at IS NULL
    `);
  } else {
    await query(`
      UPDATE placement_applications
      SET submitted_at = COALESCE(submitted_at, CURRENT_TIMESTAMP)
      WHERE submitted_at IS NULL
    `);
  }
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

async function ensureApplicationStageResultsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS application_stage_results (
      id BIGINT NOT NULL AUTO_INCREMENT,
      application_id BIGINT NOT NULL,
      stage_id BIGINT NOT NULL,
      stage_result VARCHAR(50) NOT NULL DEFAULT 'not_started',
      processed_by VARCHAR(20) NULL,
      processed_at DATETIME NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uk_application_stage (application_id, stage_id),
      KEY idx_stage_result_stage (stage_id),
      KEY idx_stage_result_application (application_id),
      KEY idx_stage_result_status (stage_result)
    )
  `);

  await ensureColumnExists(
    'application_stage_results',
    'processed_by',
    'ALTER TABLE application_stage_results ADD COLUMN processed_by VARCHAR(20) NULL AFTER stage_result'
  ).catch(() => {});
  await ensureColumnExists(
    'application_stage_results',
    'processed_at',
    'ALTER TABLE application_stage_results ADD COLUMN processed_at DATETIME NULL AFTER processed_by'
  ).catch(() => {});
}

function buildFullName(row) {
  return [row.first_name, row.middle_name, row.last_name].filter(Boolean).join(' ').trim();
}

function toIsoString(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function buildApplicantsSummary(applicants) {
  return {
    totalApplicants: applicants.length,
    pendingVerification: applicants.filter((item) => item.applicationStatus === 'pending_verification').length,
    inProcess: applicants.filter((item) => ['verified', 'in_process'].includes(item.applicationStatus)).length,
    selected: applicants.filter((item) => item.applicationStatus === 'selected').length,
  };
}

function normalizePrn(value) {
  return String(value || '').trim().toUpperCase();
}

function normalizeStageResult(value, fallback = 'cleared') {
  const normalizedValue = String(value || fallback).trim().toLowerCase();
  const allowedValues = new Set([
    'not_started',
    'shortlisted',
    'scheduled',
    'appeared',
    'cleared',
    'rejected',
    'absent',
    'withdrawn',
    'on_hold',
  ]);

  return allowedValues.has(normalizedValue) ? normalizedValue : fallback;
}

function deriveMasterStatusFromStage(stageResult, stageName) {
  const normalizedStageResult = normalizeStageResult(stageResult, 'not_started');
  const normalizedStageName = String(stageName || '').trim().toLowerCase();

  if (normalizedStageResult === 'withdrawn') {
    return {
      applicationStatus: 'withdrawn',
      finalOutcome: 'withdrawn',
    };
  }

  if (['rejected', 'absent'].includes(normalizedStageResult)) {
    return {
      applicationStatus: 'not_selected',
      finalOutcome: 'not_selected',
    };
  }

  if (
    ['cleared', 'shortlisted'].includes(normalizedStageResult) &&
    (normalizedStageName.includes('offer') || normalizedStageName.includes('selection'))
  ) {
    return {
      applicationStatus: 'selected',
      finalOutcome: 'selected',
    };
  }

  return {
    applicationStatus: 'in_process',
    finalOutcome: 'in_process',
  };
}

async function findPlacementApplicationByOpportunityAndPrn(opportunityId, prn) {
  const normalizedPrn = normalizePrn(prn);

  if (!normalizedPrn) {
    return null;
  }

  const existingRows = await query(
    `
      SELECT id
      FROM placement_applications
      WHERE opportunity_id = ? AND PRN = ?
      LIMIT 1
    `,
    [opportunityId, normalizedPrn]
  );

  return existingRows[0] || null;
}

async function fetchApplicantsForOpportunity(opportunityId) {
  const applicantRows = await query(
    `
      SELECT
        pa.id AS application_id,
        pa.PRN,
        pa.application_status,
        pa.final_outcome,
        pa.submitted_at,
        pa.updated_at,
        sp.first_name,
        sp.middle_name,
        sp.last_name,
        sp.personal_email,
        sp.college_email,
        sp.mobile,
        se.department,
        se.current_cgpa,
        se.active_backlogs,
        se.passing_year,
        hs.stage_name AS current_stage_name
      FROM placement_applications pa
      LEFT JOIN student_personal sp ON sp.PRN = pa.PRN
      LEFT JOIN student_education se ON se.PRN = pa.PRN
      LEFT JOIN hiring_stages hs ON hs.id = pa.current_stage_id
      WHERE pa.opportunity_id = ?
      ORDER BY pa.submitted_at DESC, pa.updated_at DESC, pa.id DESC
    `,
    [opportunityId]
  );

  return applicantRows.map((row) => ({
    applicationId: row.application_id,
    prn: String(row.PRN || ''),
    name: buildFullName(row) || String(row.PRN || ''),
    email: row.college_email || row.personal_email || '',
    phone: row.mobile || '',
    department: row.department || '',
    cgpa: row.current_cgpa === null || row.current_cgpa === undefined ? '' : String(row.current_cgpa),
    backlogs: row.active_backlogs === null || row.active_backlogs === undefined ? '' : String(row.active_backlogs),
    passingYear: row.passing_year === null || row.passing_year === undefined ? '' : String(row.passing_year),
    submittedAt: toIsoString(row.submitted_at),
    updatedAt: toIsoString(row.updated_at),
    applicationStatus: row.application_status || 'pending_verification',
    finalOutcome: row.final_outcome || 'in_process',
    currentStage: row.current_stage_name || '',
  }));
}

async function writeStatusHistory(applicationIds, newStatus, changedBy, changeReason) {
  if (!applicationIds.length) {
    return;
  }

  await ensureApplicationStatusHistoryTable();

  const placeholders = applicationIds.map(() => '?').join(', ');
  const previousRows = await query(
    `SELECT id, application_status FROM placement_applications WHERE id IN (${placeholders})`,
    applicationIds
  );

  for (const row of previousRows) {
    await query(
      `
        INSERT INTO application_status_history
        (application_id, old_status, new_status, changed_by, change_reason)
        VALUES (?, ?, ?, ?, ?)
      `,
      [row.id, row.application_status || null, newStatus, changedBy || null, changeReason]
    );
  }
}

async function syncApplicationMasterFromStageResults(applicationId, changedBy = 'system') {
  const rows = await query(
    `
      SELECT
        asr.stage_id,
        asr.stage_result,
        hs.stage_name,
        hs.stage_order,
        pa.application_status
      FROM application_stage_results asr
      INNER JOIN hiring_stages hs ON hs.id = asr.stage_id
      INNER JOIN placement_applications pa ON pa.id = asr.application_id
      WHERE asr.application_id = ?
      ORDER BY hs.stage_order DESC, hs.id DESC, asr.updated_at DESC, asr.id DESC
      LIMIT 1
    `,
    [applicationId]
  );

  const latestStage = rows[0];

  if (!latestStage) {
    return;
  }

  const nextState = deriveMasterStatusFromStage(latestStage.stage_result, latestStage.stage_name);
  const currentStatus = latestStage.application_status || 'pending_verification';

  await query(
    `
      UPDATE placement_applications
      SET current_stage_id = ?,
          application_status = ?,
          final_outcome = ?
      WHERE id = ?
    `,
    [
      latestStage.stage_id,
      nextState.applicationStatus,
      nextState.finalOutcome,
      applicationId,
    ]
  );

  if (currentStatus !== nextState.applicationStatus) {
    await writeStatusHistory(
      [applicationId],
      nextState.applicationStatus,
      changedBy,
      `Master application synced from stage result: ${latestStage.stage_result}.`
    );
  }
}

tpoApplicationTrackingRoutes.get('/opportunities/:id/applicants', async (req, res) => {
  try {
    await ensurePlacementApplicationsTable();

    const opportunityRows = await query(
      `
        SELECT id, company_name, job_title, location, job_type, deadline, status
        FROM tpo_opportunities
        WHERE id = ?
        LIMIT 1
      `,
      [req.params.id]
    );

    const opportunity = opportunityRows[0];

    if (!opportunity) {
      res.status(404).json({
        message: 'Opportunity not found.',
      });
      return;
    }

    const applicants = await fetchApplicantsForOpportunity(req.params.id);

    res.json({
      message: 'Opportunity applicants fetched successfully.',
      data: {
        opportunity: {
          id: opportunity.id,
          company: opportunity.company_name || '',
          title: opportunity.job_title || '',
          location: opportunity.location || '',
          type: opportunity.job_type || '',
          deadline: toIsoString(opportunity.deadline),
          status: opportunity.status || 'active',
        },
        summary: buildApplicantsSummary(applicants),
        applicants,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch opportunity applicants.',
      error: error.message,
    });
  }
});

tpoApplicationTrackingRoutes.post('/applications/:applicationId/verify', async (req, res) => {
  try {
    await ensurePlacementApplicationsTable();
    const applicationId = Number(req.params.applicationId);

    if (!Number.isInteger(applicationId) || applicationId <= 0) {
      res.status(400).json({ message: 'Valid application id is required.' });
      return;
    }

    const applicationRows = await query(
      'SELECT id, opportunity_id, PRN, application_status FROM placement_applications WHERE id = ? LIMIT 1',
      [applicationId]
    );
    const application = applicationRows[0];

    if (!application) {
      res.status(404).json({ message: 'Application not found.' });
      return;
    }

    await query(
      `
        UPDATE placement_applications
        SET application_status = 'verified',
            final_outcome = 'in_process'
        WHERE id = ?
      `,
      [applicationId]
    );

    await writeStatusHistory(
      [applicationId],
      'verified',
      req.auth?.prn || req.auth?.id || 'tpo',
      'Application verified by TPO.'
    );

    res.json({
      message: 'Application verified successfully.',
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to verify application.',
      error: error.message,
    });
  }
});

tpoApplicationTrackingRoutes.post('/applications/:applicationId/reject', async (req, res) => {
  try {
    await ensurePlacementApplicationsTable();
    const applicationId = Number(req.params.applicationId);

    if (!Number.isInteger(applicationId) || applicationId <= 0) {
      res.status(400).json({ message: 'Valid application id is required.' });
      return;
    }

    const applicationRows = await query(
      'SELECT id, opportunity_id, PRN, application_status FROM placement_applications WHERE id = ? LIMIT 1',
      [applicationId]
    );
    const application = applicationRows[0];

    if (!application) {
      res.status(404).json({ message: 'Application not found.' });
      return;
    }

    await query(
      `
        UPDATE placement_applications
        SET application_status = 'rejected_by_tpo',
            final_outcome = 'not_selected'
        WHERE id = ?
      `,
      [applicationId]
    );

    await writeStatusHistory(
      [applicationId],
      'rejected_by_tpo',
      req.auth?.prn || req.auth?.id || 'tpo',
      'Application rejected by TPO.'
    );

    res.json({
      message: 'Application rejected successfully.',
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to reject application.',
      error: error.message,
    });
  }
});

tpoApplicationTrackingRoutes.post('/stages/:stageId/results/upsert', async (req, res) => {
  try {
    await ensurePlacementApplicationsTable();
    await ensureApplicationStageResultsTable();

    const stageId = Number(req.params.stageId);
    const results = Array.isArray(req.body?.results) ? req.body.results : [];

    if (!Number.isInteger(stageId) || stageId <= 0) {
      res.status(400).json({ message: 'Valid stage id is required.' });
      return;
    }

    if (!results.length) {
      res.status(400).json({ message: 'At least one stage result row is required.' });
      return;
    }

    const stageRows = await query(
      'SELECT id, opportunity_id, stage_name FROM hiring_stages WHERE id = ? LIMIT 1',
      [stageId]
    );
    const stage = stageRows[0];

    if (!stage) {
      res.status(404).json({ message: 'Hiring stage not found.' });
      return;
    }

    const changedBy = String(req.auth?.prn || req.auth?.id || 'tpo').slice(0, 20);
    let updatedCount = 0;
    const missingPrns = [];
    const duplicatePrns = [];
    const failedPrns = [];
    const prnCounts = new Map();

    for (const item of results) {
      const prn = normalizePrn(item?.prn || item?.PRN);

      if (!prn) {
        continue;
      }

      prnCounts.set(prn, (prnCounts.get(prn) || 0) + 1);
    }

    const duplicatedPrnSet = new Set(
      Array.from(prnCounts.entries())
        .filter(([, count]) => count > 1)
        .map(([prn]) => prn)
    );

    duplicatePrns.push(...duplicatedPrnSet);

    for (const item of results) {
      const prn = normalizePrn(item?.prn || item?.PRN);

      if (!prn) {
        continue;
      }

      if (duplicatedPrnSet.has(prn)) {
        continue;
      }
      try {
        const application = await findPlacementApplicationByOpportunityAndPrn(stage.opportunity_id, prn);

        if (!application) {
          missingPrns.push(prn);
          continue;
        }

        const stageResult = normalizeStageResult(item?.stage_result ?? item?.stageResult, 'cleared');

        await query(
          `
            INSERT INTO application_stage_results
            (application_id, stage_id, stage_result, processed_by, processed_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON DUPLICATE KEY UPDATE
              stage_result = VALUES(stage_result),
              processed_by = VALUES(processed_by),
              processed_at = CURRENT_TIMESTAMP
          `,
          [
            application.id,
            stageId,
            stageResult,
            changedBy,
          ]
        );

        await syncApplicationMasterFromStageResults(application.id, changedBy);
        updatedCount += 1;
      } catch (rowError) {
        failedPrns.push({
          prn,
          reason: rowError.message,
        });
      }
    }

    res.json({
      message: updatedCount > 0
        ? 'Stage results updated successfully.'
        : 'No stage results were updated.',
      updatedCount,
      missingPrns,
      duplicatePrns,
      failedPrns,
      stageName: stage.stage_name || '',
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to update stage results.',
      error: error.message,
    });
  }
});

tpoApplicationTrackingRoutes.post('/opportunities/:id/applicants/verify-all', async (req, res) => {
  try {
    await ensurePlacementApplicationsTable();
    const opportunityId = Number(req.params.id);

    const rows = await query(
      `
        SELECT id
        FROM placement_applications
        WHERE opportunity_id = ? AND application_status = 'pending_verification'
      `,
      [opportunityId]
    );
    const applicationIds = rows.map((row) => row.id);

    if (applicationIds.length) {
      await query(
        `
          UPDATE placement_applications
          SET application_status = 'verified',
              final_outcome = 'in_process'
          WHERE opportunity_id = ? AND application_status = 'pending_verification'
        `,
        [opportunityId]
      );

      await writeStatusHistory(
        applicationIds,
        'verified',
        req.auth?.prn || req.auth?.id || 'tpo',
        'All pending applications verified by TPO.'
      );
    }

    res.json({
      message: 'All pending applications verified successfully.',
      updatedCount: applicationIds.length,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to verify all applications.',
      error: error.message,
    });
  }
});

tpoApplicationTrackingRoutes.post('/opportunities/:id/applicants/reject-all', async (req, res) => {
  try {
    await ensurePlacementApplicationsTable();
    const opportunityId = Number(req.params.id);

    const rows = await query(
      `
        SELECT id
        FROM placement_applications
        WHERE opportunity_id = ? AND application_status = 'pending_verification'
      `,
      [opportunityId]
    );
    const applicationIds = rows.map((row) => row.id);

    if (applicationIds.length) {
      await query(
        `
          UPDATE placement_applications
          SET application_status = 'rejected_by_tpo',
              final_outcome = 'not_selected'
          WHERE opportunity_id = ? AND application_status = 'pending_verification'
        `,
        [opportunityId]
      );

      await writeStatusHistory(
        applicationIds,
        'rejected_by_tpo',
        req.auth?.prn || req.auth?.id || 'tpo',
        'All pending applications rejected by TPO.'
      );
    }

    res.json({
      message: 'All pending applications rejected successfully.',
      updatedCount: applicationIds.length,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to reject all applications.',
      error: error.message,
    });
  }
});

module.exports = tpoApplicationTrackingRoutes;
