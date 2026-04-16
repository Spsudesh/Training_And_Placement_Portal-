const express = require('express');
const db = require('../../config/db').db;

const tpcDashboardRoutes = express.Router();

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

  if (await columnExists('placement_applications', 'eligibility_snapshot')) {
    await query(
      'ALTER TABLE placement_applications ADD COLUMN submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER eligibility_snapshot'
    ).catch(() => {});
  }

  await query(
    "ALTER TABLE placement_applications ADD COLUMN final_outcome VARCHAR(50) NOT NULL DEFAULT 'in_process' AFTER application_status"
  ).catch(() => {});
  await query(
    "ALTER TABLE placement_applications MODIFY COLUMN final_outcome VARCHAR(50) NOT NULL DEFAULT 'in_process'"
  ).catch(() => {});
  await query(
    'ALTER TABLE placement_applications ADD COLUMN decision_at DATETIME NULL AFTER final_outcome'
  ).catch(() => {});

  if (await columnExists('placement_applications', 'applied_at')) {
    await query(`
      UPDATE placement_applications
      SET submitted_at = COALESCE(submitted_at, applied_at, CURRENT_TIMESTAMP)
      WHERE submitted_at IS NULL
    `).catch(() => {});
  } else {
    await query(`
      UPDATE placement_applications
      SET submitted_at = COALESCE(submitted_at, CURRENT_TIMESTAMP)
      WHERE submitted_at IS NULL
    `).catch(() => {});
  }
}

function normalizeDepartmentValue(value) {
  return String(value || '').trim().toLowerCase();
}

function formatRelativeTime(dateValue) {
  if (!dateValue) {
    return 'Recently';
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return 'Recently';
  }

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 1) {
    return 'Just now';
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);

  if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
  });
}

async function fetchTpcDashboardData(department) {
  await ensurePlacementApplicationsTable();

  const normalizedDepartment = normalizeDepartmentValue(department);

  if (!normalizedDepartment) {
    return {
      overview: {
        departmentStudents: 0,
        verifiedStudents: 0,
        activeOpportunities: 0,
        placedStudents: 0,
      },
      driveStatus: [
        { name: 'Verified', value: 0 },
        { name: 'Pending', value: 0 },
      ],
      departmentSupport: [],
      weeklyTaskTrend: [],
      recentActivities: [],
      highlights: {
        departmentName: '',
        nextMajorDrive: 'No active drive',
      },
    };
  }

  const hasStudentEducation = await tableExists('student_education');
  const hasStudentCredentials = await tableExists('student_credentials');
  const hasTpoOpportunities = await tableExists('tpo_opportunities');
  const hasDecisionAt = await columnExists('placement_applications', 'decision_at');
  const hasFinalOutcome = await columnExists('placement_applications', 'final_outcome');

  const totalStudentsRows = hasStudentEducation
    ? await safeQuery(
        `
          SELECT COUNT(DISTINCT se.PRN) AS total
          FROM student_education se
          WHERE LOWER(COALESCE(se.department, '')) = ?
        `,
        [normalizedDepartment],
        [{ total: 0 }]
      )
    : [{ total: 0 }];

  const verifiedStudentsRows = hasStudentEducation && hasStudentCredentials
    ? await safeQuery(
        `
          SELECT COUNT(DISTINCT se.PRN) AS total
          FROM student_education se
          INNER JOIN student_credentials sc ON sc.PRN = se.PRN
          WHERE LOWER(COALESCE(se.department, '')) = ?
            AND COALESCE(sc.is_profile_verified, FALSE) = TRUE
        `,
        [normalizedDepartment],
        [{ total: 0 }]
      )
    : [{ total: 0 }];

  const activeOpportunitiesRows = hasTpoOpportunities
    ? await safeQuery(
        `
          SELECT COUNT(*) AS total
          FROM tpo_opportunities
          WHERE LOWER(COALESCE(status, 'active')) = 'active'
            AND (
              COALESCE(TRIM(allowed_departments), '') = ''
              OR LOWER(COALESCE(allowed_departments, '')) LIKE '%all%'
              OR LOWER(COALESCE(allowed_departments, '')) LIKE ?
            )
        `,
        [`%${normalizedDepartment}%`],
        [{ total: 0 }]
      )
    : [{ total: 0 }];

  const placedCondition = hasFinalOutcome
    ? "LOWER(COALESCE(pa.final_outcome, '')) IN ('placed', 'selected', 'offer_accepted') OR LOWER(COALESCE(pa.application_status, '')) IN ('placed', 'selected', 'offer_accepted', 'offer_released')"
    : "LOWER(COALESCE(pa.application_status, '')) IN ('placed', 'selected', 'offer_accepted', 'offer_released')";

  const placedStudentsRows = hasStudentEducation
    ? await safeQuery(
        `
          SELECT COUNT(DISTINCT pa.PRN) AS total
          FROM placement_applications pa
          INNER JOIN student_education se ON se.PRN = pa.PRN
          WHERE LOWER(COALESCE(se.department, '')) = ?
            AND (${placedCondition})
        `,
        [normalizedDepartment],
        [{ total: 0 }]
      )
    : [{ total: 0 }];

  const verifiedStudents = Number(verifiedStudentsRows[0]?.total) || 0;
  const totalStudents = Number(totalStudentsRows[0]?.total) || 0;
  const pendingStudents = Math.max(totalStudents - verifiedStudents, 0);

  const batchRows = hasStudentEducation
    ? await safeQuery(
        `
          SELECT
            COALESCE(CAST(se.passing_year AS CHAR), 'Unspecified') AS label,
            COUNT(DISTINCT se.PRN) AS tasks,
            COUNT(DISTINCT CASE WHEN COALESCE(sc.is_profile_verified, FALSE) = TRUE THEN se.PRN END) AS coordinated
          FROM student_education se
          LEFT JOIN student_credentials sc ON sc.PRN = se.PRN
          WHERE LOWER(COALESCE(se.department, '')) = ?
          GROUP BY COALESCE(CAST(se.passing_year AS CHAR), 'Unspecified')
          ORDER BY label ASC
          LIMIT 6
        `,
        [normalizedDepartment],
        []
      )
    : [];

  const activitySourceField = hasDecisionAt
    ? 'COALESCE(pa.decision_at, pa.updated_at, pa.submitted_at)'
    : 'COALESCE(pa.updated_at, pa.submitted_at)';
  const weeklyRows = hasStudentEducation
    ? await safeQuery(
        `
          SELECT
            YEARWEEK(${activitySourceField}, 1) AS week_key,
            DATE_FORMAT(MIN(${activitySourceField}), '%d %b') AS week_label,
            COUNT(*) AS updates
          FROM placement_applications pa
          INNER JOIN student_education se ON se.PRN = pa.PRN
          WHERE LOWER(COALESCE(se.department, '')) = ?
            AND ${activitySourceField} IS NOT NULL
          GROUP BY YEARWEEK(${activitySourceField}, 1)
          ORDER BY week_key DESC
          LIMIT 8
        `,
        [normalizedDepartment],
        []
      )
    : [];

  const recentOpportunityRows = hasTpoOpportunities
    ? await safeQuery(
        `
          SELECT
            id,
            company_name,
            job_title,
            allowed_departments,
            status,
            updated_at,
            created_at
          FROM tpo_opportunities
          WHERE
            COALESCE(TRIM(allowed_departments), '') = ''
            OR LOWER(COALESCE(allowed_departments, '')) LIKE '%all%'
            OR LOWER(COALESCE(allowed_departments, '')) LIKE ?
          ORDER BY COALESCE(updated_at, created_at) DESC, id DESC
          LIMIT 6
        `,
        [`%${normalizedDepartment}%`],
        []
      )
    : [];

  const recentActivities = recentOpportunityRows.map((row) => {
    const normalizedStatus = String(row.status || 'active').trim().toLowerCase();

    return {
      id: row.id,
      company: row.company_name || 'Company',
      event: row.job_title
        ? `${row.job_title} drive updated for ${department || 'department'}`
        : 'Opportunity updated',
      department: department || 'Department',
      status:
        normalizedStatus === 'active'
          ? 'Scheduled'
          : normalizedStatus === 'closed'
            ? 'Completed'
            : 'Updated',
      time: formatRelativeTime(row.updated_at || row.created_at),
    };
  });

  return {
    overview: {
      departmentStudents: totalStudents,
      verifiedStudents,
      activeOpportunities: Number(activeOpportunitiesRows[0]?.total) || 0,
      placedStudents: Number(placedStudentsRows[0]?.total) || 0,
    },
    driveStatus: [
      { name: 'Verified', value: verifiedStudents },
      { name: 'Pending', value: pendingStudents },
    ],
    departmentSupport: batchRows.map((row) => ({
      label: row.label,
      tasks: Number(row.tasks) || 0,
      coordinated: Number(row.coordinated) || 0,
    })),
    weeklyTaskTrend: weeklyRows
      .reverse()
      .map((row, index) => ({
        week: row.week_label || `W${index + 1}`,
        updates: Number(row.updates) || 0,
      })),
    recentActivities,
    highlights: {
      departmentName: department || '',
      nextMajorDrive: recentOpportunityRows[0]?.company_name || 'No active drive',
    },
  };
}

tpcDashboardRoutes.get('/', async (req, res) => {
  try {
    const dashboard = await fetchTpcDashboardData(req.auth?.department || '');

    res.json({
      message: 'TPC dashboard data fetched successfully.',
      data: dashboard,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch TPC dashboard data.',
      error: error.message,
    });
  }
});

module.exports = tpcDashboardRoutes;
