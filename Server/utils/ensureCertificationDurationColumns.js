const db = require('../config/db').db;

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

let ensurePromise = null;

async function runEnsureCertificationDurationColumns() {
  await ensureColumnExists(
    'student_certifications',
    'link',
    'ALTER TABLE student_certifications ADD COLUMN link TEXT NULL AFTER platform'
  );
  await ensureColumnExists(
    'student_certifications',
    'duration_unit',
    'ALTER TABLE student_certifications ADD COLUMN duration_unit VARCHAR(20) NULL AFTER link'
  );
  await ensureColumnExists(
    'student_certifications',
    'duration_summary',
    'ALTER TABLE student_certifications ADD COLUMN duration_summary VARCHAR(255) NULL AFTER duration_unit'
  );
  await ensureColumnExists(
    'student_certifications',
    'duration_value',
    'ALTER TABLE student_certifications ADD COLUMN duration_value INT NULL AFTER duration_summary'
  );
  await ensureColumnExists(
    'student_certifications',
    'duration',
    'ALTER TABLE student_certifications ADD COLUMN duration VARCHAR(255) NULL AFTER duration_value'
  );
}

async function ensureCertificationDurationColumns() {
  if (!ensurePromise) {
    ensurePromise = runEnsureCertificationDurationColumns().catch((error) => {
      ensurePromise = null;
      throw error;
    });
  }

  return ensurePromise;
}

module.exports = {
  ensureCertificationDurationColumns,
};
