const express = require('express');
const upload = require('../../config/upload');
const { uploadFile } = require('../../config/storageService');
const db = require('../../config/db').db;

const studentFormRoutes = express.Router();

studentFormRoutes.use(upload.any());
studentFormRoutes.use((req, res, next) => {
  const requestedPrn =
    req.params?.prn ||
    req.body?.prn ||
    req.body?.PRN ||
    req.query?.prn ||
    '';

  if (req.auth?.role === 'student') {
    if (requestedPrn && String(requestedPrn).trim() !== String(req.auth.prn || '').trim()) {
      return res.status(403).json({
        message: 'You can access only your own profile data.',
      });
    }

    if (!req.body.prn && req.method !== 'GET') {
      req.body.prn = req.auth.prn;
    }
  }

  return next();
});

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

function parseJsonField(value, fallback = []) {
  if (!value) {
    return fallback;
  }

  if (Array.isArray(value) || typeof value === 'object') {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

function serializeDeadBacklogSemesters(deadBacklogs = []) {
  return deadBacklogs
    .map((entry) => {
      const semester = String(entry?.semester || '').trim();
      const count = String(entry?.count || '').trim();

      if (!semester && !count) {
        return '';
      }

      return count ? `${semester}:${count}` : semester;
    })
    .filter(Boolean)
    .join(',');
}

function getTotalDeadBacklogCount(deadBacklogs = []) {
  return deadBacklogs.reduce((total, entry) => {
    const parsedCount = Number(entry?.count);
    return total + (Number.isNaN(parsedCount) ? 0 : parsedCount);
  }, 0);
}

function getUploadedFile(req, fieldName) {
  return req.files?.find((file) => file.fieldname === fieldName) ?? null;
}

async function uploadSingleFile(req, fieldName, folder) {
  const file = getUploadedFile(req, fieldName);

  if (!file) {
    return null;
  }

  const uploadedFile = await uploadFile(file, folder);
  return uploadedFile.url;
}

async function uploadIndexedFiles(req, prefix, folder) {
  const files = req.files?.filter((file) => file.fieldname.startsWith(prefix)) ?? [];
  const uploadedFiles = {};

  await Promise.all(
    files.map(async (file) => {
      const index = Number(file.fieldname.replace(prefix, ''));

      if (Number.isNaN(index)) {
        return;
      }

      const uploadedFile = await uploadFile(file, folder);
      uploadedFiles[index] = uploadedFile.url;
    })
  );

  return uploadedFiles;
}

function toNullableNumber(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsedValue = Number(value);
  return Number.isNaN(parsedValue) ? null : parsedValue;
}

function toNullableBoolean(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  return ['yes', 'true', '1'].includes(String(value).toLowerCase());
}

function normalizeLocationValue(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const normalizedValue = String(value).trim().replace(/\s+/g, ' ').toLowerCase();

  if (!normalizedValue) {
    return null;
  }

  return normalizedValue.replace(/\b\w/g, (character) => character.toUpperCase());
}

function normalizeTextValue(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  return String(value).trim();
}

function normalizeEmailValue(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  return String(value).trim().toLowerCase();
}

function valuesMatch(currentValue, nextValue) {
  return normalizeTextValue(currentValue) === normalizeTextValue(nextValue);
}

function numbersMatch(currentValue, nextValue) {
  return toNullableNumber(currentValue) === toNullableNumber(nextValue);
}

function booleansMatch(currentValue, nextValue) {
  return toNullableBoolean(currentValue) === toNullableBoolean(nextValue);
}

function asyncHandler(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      res.status(500).json({
        message: 'Failed to save data',
        error:
          String(error.message || '').toLowerCase().includes('firebase')
            ? 'File upload is not configured correctly on the server. Please verify your Firebase service account and FIREBASE_STORAGE_BUCKET in Server/.env.'
            : error.message,
      });
    }
  };
}

const progressColumns = {
  personal: 'personal_details_completed',
  education: 'education_details_completed',
  experience: 'experience_completed',
  projects: 'projects_completed',
  skills: 'skills_completed',
  certifications: 'certifications_completed',
  activities: 'activities_completed',
  consent: 'consent_completed',
};

async function ensureProfileProgressRow(prn) {
  if (!prn) {
    return;
  }

  await query(
    `
      INSERT INTO student_profile_progress (PRN)
      VALUES (?)
      ON DUPLICATE KEY UPDATE
        updated_at = CURRENT_TIMESTAMP
    `,
    [prn]
  );
}

async function updateProfileProgress(prn, stepKey) {
  const progressColumn = progressColumns[stepKey];

  if (!prn || !progressColumn) {
    return;
  }

  await ensureProfileProgressRow(prn);

  const isFinalStep = stepKey === 'consent';

  await query(
    `
      UPDATE student_profile_progress
      SET ${progressColumn} = TRUE,
          last_completed_step = ?,
          is_completed = ?,
          completed_at = CASE
            WHEN ? THEN COALESCE(completed_at, CURRENT_TIMESTAMP)
            ELSE NULL
          END
      WHERE PRN = ?
    `,
    [stepKey, isFinalStep ? 1 : 0, isFinalStep ? 1 : 0, prn]
  );
}

async function resetProfileVerification(prn) {
  if (!prn) {
    return;
  }

  await query('UPDATE student_credentials SET is_profile_verified = FALSE WHERE PRN = ?', [prn]);
}

studentFormRoutes.post('/personal_details', asyncHandler(async (req, res) => {
  const profilePhotoUrl = await uploadSingleFile(req, 'profilePhoto', 'students/profile-photo');

  const {
    prn,
    firstName,
    middleName,
    lastName,
    email,
    collegeEmail,
    mobile,
    address,
    country,
    city,
    district,
    state,
    pincode,
    dob,
    age,
    bloodGroup,
    gender,
    category,
    handicap,
    aadhaar,
    panNumber,
  } = req.body;

  const normalizedCollegeEmail = normalizeEmailValue(collegeEmail);

  if (normalizedCollegeEmail) {
    if (!normalizedCollegeEmail.endsWith('@ritindia.edu')) {
      res.status(400).json({ message: 'College email must use the @ritindia.edu domain.' });
      return;
    }

    const duplicateCredentialRows = await query(
      'SELECT PRN FROM student_credentials WHERE LOWER(email) = ? AND PRN <> ? LIMIT 1',
      [normalizedCollegeEmail, prn]
    );

    if (duplicateCredentialRows.length) {
      res.status(409).json({ message: 'College email is already used by another account.' });
      return;
    }
  }

  await query(
    `
      INSERT INTO student_personal
      (PRN, first_name, middle_name, last_name, personal_email, college_email, mobile, address, country, city, district, state, pincode,
       dob, age, blood_group, gender, category, handicap, aadhaar, pan_no, profile_photo_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        first_name = VALUES(first_name),
        middle_name = VALUES(middle_name),
        last_name = VALUES(last_name),
        personal_email = VALUES(personal_email),
        college_email = VALUES(college_email),
        mobile = VALUES(mobile),
        address = VALUES(address),
        country = VALUES(country),
        city = VALUES(city),
        district = VALUES(district),
        state = VALUES(state),
        pincode = VALUES(pincode),
        dob = VALUES(dob),
        age = VALUES(age),
        blood_group = VALUES(blood_group),
        gender = VALUES(gender),
        category = VALUES(category),
        handicap = VALUES(handicap),
        aadhaar = VALUES(aadhaar),
        pan_no = VALUES(pan_no),
        profile_photo_url = COALESCE(VALUES(profile_photo_url), profile_photo_url)
    `,
    [
      prn,
      firstName || null,
      middleName || null,
      lastName || null,
      email || null,
      normalizedCollegeEmail,
      mobile || null,
      address || null,
      normalizeLocationValue(country),
      normalizeLocationValue(city),
      normalizeLocationValue(district),
      normalizeLocationValue(state),
      pincode || null,
      dob || null,
      toNullableNumber(age),
      normalizeTextValue(bloodGroup),
      gender || null,
      category || null,
      toNullableBoolean(handicap),
      aadhaar || null,
      normalizeTextValue(panNumber),
      profilePhotoUrl,
    ]
  );

  if (normalizedCollegeEmail) {
    await query(
      `
        UPDATE student_credentials
        SET email = ?
        WHERE PRN = ?
      `,
      [normalizedCollegeEmail, prn]
    );
  }

  await updateProfileProgress(prn, 'personal');
  await resetProfileVerification(prn);

  res.json({ message: 'Personal details saved' });
}));

studentFormRoutes.post('/summary', asyncHandler(async (req, res) => {
  const { prn, summary } = req.body;

  if (!prn) {
    res.status(400).json({ message: 'PRN is required' });
    return;
  }

  await query(
    `
      INSERT INTO student_profile_summary (PRN, summary)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE
        summary = VALUES(summary)
    `,
    [prn, summary || null]
  );

  await resetProfileVerification(prn);

  res.json({ message: 'Profile summary saved' });
}));

studentFormRoutes.post('/education_details', asyncHandler(async (req, res) => {
  const tenthMarksheetUrl = await uploadSingleFile(req, 'marksheet10', 'students/education');
  const twelfthMarksheetUrl = await uploadSingleFile(req, 'marksheet12', 'students/education');
  const diplomaMarksheetUrl = await uploadSingleFile(req, 'diplomaMarksheet', 'students/education');
  const entranceExamCertificateUrl = await uploadSingleFile(req, 'entranceExamCertificate', 'students/education');
  const gapCertificateUrl = await uploadSingleFile(req, 'gapCertificate', 'students/education');

  const {
    prn,
    marks10,
    mathsMarks10,
    board10,
    year10,
    marks12,
    mathsMarks12,
    board12,
    year12,
    entranceExamType,
    entranceExamScore,
    diplomaMarks,
    diplomaInstitute,
    diplomaYear,
    gapStatus,
    gapReason,
    department,
    cgpa,
    percentage,
    activeBacklogs,
    deadBacklogs = '[]',
    graduationYear,
  } = req.body;

  const parsedDeadBacklogs = parseJsonField(deadBacklogs);
  const normalizedEducationTrack =
    diplomaInstitute || diplomaMarks || diplomaYear ? 'diploma' : 'twelfth';

  const existingEducationRows = await query(
    'SELECT * FROM student_education WHERE PRN = ? LIMIT 1',
    [prn]
  );
  const existingEducation = existingEducationRows[0] || {};

  const nextTenthMarks = toNullableNumber(marks10);
  const nextTenthMathsMarks = toNullableNumber(mathsMarks10);
  const nextTenthBoard = board10 || null;
  const nextTenthYear = toNullableNumber(year10);
  const nextTenthMarksheetUrl = tenthMarksheetUrl || existingEducation.tenth_marksheet_url || null;
  const nextTwelfthMarks =
    normalizedEducationTrack === 'twelfth' ? toNullableNumber(marks12) : null;
  const nextTwelfthMathsMarks =
    normalizedEducationTrack === 'twelfth' ? toNullableNumber(mathsMarks12) : null;
  const nextTwelfthBoard = normalizedEducationTrack === 'twelfth' ? board12 || null : null;
  const nextTwelfthYear =
    normalizedEducationTrack === 'twelfth' ? toNullableNumber(year12) : null;
  const nextEntranceExamType =
    normalizedEducationTrack === 'twelfth' ? normalizeTextValue(entranceExamType) : null;
  const nextEntranceExamScore =
    normalizedEducationTrack === 'twelfth' ? toNullableNumber(entranceExamScore) : null;
  const nextEntranceExamMarksheetUrl =
    normalizedEducationTrack === 'twelfth'
      ? entranceExamCertificateUrl || existingEducation.entrance_exam_marksheet_url || null
      : null;
  const nextTwelfthMarksheetUrl =
    normalizedEducationTrack === 'twelfth'
      ? twelfthMarksheetUrl || existingEducation.twelfth_marksheet_url || null
      : null;
  const nextDiplomaMarks =
    normalizedEducationTrack === 'diploma' ? toNullableNumber(diplomaMarks) : null;
  const nextDiplomaInstitute =
    normalizedEducationTrack === 'diploma' ? diplomaInstitute || null : null;
  const nextDiplomaYear =
    normalizedEducationTrack === 'diploma' ? toNullableNumber(diplomaYear) : null;
  const nextDiplomaMarksheetUrl =
    normalizedEducationTrack === 'diploma'
      ? diplomaMarksheetUrl || existingEducation.diploma_marksheet_url || null
      : null;
  const nextGap = gapStatus === 'Yes' ? 'YES' : 'NO';
  const nextGapReason = gapReason || null;
  const nextGapCertificateUrl = gapCertificateUrl || existingEducation.gap_certificate_url || null;
  const nextDepartment = department || null;
  const nextCgpa = toNullableNumber(cgpa);
  const nextPercentage = toNullableNumber(percentage);
  const nextActiveBacklogs = toNullableNumber(activeBacklogs);
  const nextDeadBacklogSemesters = serializeDeadBacklogSemesters(parsedDeadBacklogs) || null;
  const nextDeadBacklogCount =
    parsedDeadBacklogs.length > 0 ? getTotalDeadBacklogCount(parsedDeadBacklogs) : null;
  const nextPassingYear = toNullableNumber(graduationYear);

  const nextTenthVerified =
    Boolean(existingEducation.tenth_verified) &&
    numbersMatch(existingEducation.tenth_marks, nextTenthMarks) &&
    numbersMatch(existingEducation.tenth_maths_marks, nextTenthMathsMarks) &&
    valuesMatch(existingEducation.tenth_board, nextTenthBoard) &&
    numbersMatch(existingEducation.tenth_year, nextTenthYear) &&
    valuesMatch(existingEducation.tenth_marksheet_url, nextTenthMarksheetUrl);

  const nextTwelfthVerified =
    Boolean(existingEducation.twelfth_verified) &&
    numbersMatch(existingEducation.twelfth_marks, nextTwelfthMarks) &&
    numbersMatch(existingEducation.twelfth_maths_marks, nextTwelfthMathsMarks) &&
    valuesMatch(existingEducation.twelfth_board, nextTwelfthBoard) &&
    numbersMatch(existingEducation.twelfth_year, nextTwelfthYear) &&
    valuesMatch(existingEducation.twelfth_marksheet_url, nextTwelfthMarksheetUrl);

  const nextEntranceExamVerified =
    Boolean(existingEducation.entrance_exam_verified) &&
    valuesMatch(existingEducation.entrance_exam_type, nextEntranceExamType) &&
    numbersMatch(existingEducation.entrance_exam_score, nextEntranceExamScore) &&
    valuesMatch(existingEducation.entrance_exam_marksheet_url, nextEntranceExamMarksheetUrl);

  const nextDiplomaVerified =
    Boolean(existingEducation.diploma_verified) &&
    numbersMatch(existingEducation.diploma_marks, nextDiplomaMarks) &&
    valuesMatch(existingEducation.diploma_institute, nextDiplomaInstitute) &&
    numbersMatch(existingEducation.diploma_year, nextDiplomaYear) &&
    valuesMatch(existingEducation.diploma_marksheet_url, nextDiplomaMarksheetUrl);

  const nextGapVerified =
    Boolean(existingEducation.gap_verified) &&
    valuesMatch(existingEducation.gap, nextGap) &&
    valuesMatch(existingEducation.gap_reason, nextGapReason) &&
    valuesMatch(existingEducation.gap_certificate_url, nextGapCertificateUrl);

  const nextCgpaVerified =
    Boolean(existingEducation.cgpa_verified) &&
    numbersMatch(existingEducation.current_cgpa, nextCgpa) &&
    numbersMatch(existingEducation.percentage, nextPercentage);

  const nextBacklogsVerified =
    Boolean(existingEducation.backlogs_verified) &&
    numbersMatch(existingEducation.active_backlogs, nextActiveBacklogs) &&
    valuesMatch(existingEducation.dead_backlog_semesters, nextDeadBacklogSemesters) &&
    numbersMatch(existingEducation.dead_backlog_count, nextDeadBacklogCount);

  await query(
    `
      INSERT INTO student_education
      (PRN, tenth_marks, tenth_maths_marks, tenth_board, tenth_year, tenth_marksheet_url, tenth_verified,
       twelfth_marks, twelfth_maths_marks, twelfth_board, twelfth_year, entrance_exam_type, entrance_exam_score, entrance_exam_marksheet_url, entrance_exam_verified, twelfth_marksheet_url, twelfth_verified,
       diploma_marks, diploma_institute, diploma_year, diploma_marksheet_url, diploma_verified,
       gap, gap_reason, gap_certificate_url, gap_verified, department, current_cgpa, percentage, cgpa_verified, active_backlogs, dead_backlog_semesters, dead_backlog_count, backlogs_verified, passing_year)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        tenth_marks = VALUES(tenth_marks),
        tenth_maths_marks = VALUES(tenth_maths_marks),
        tenth_board = VALUES(tenth_board),
        tenth_year = VALUES(tenth_year),
        tenth_marksheet_url = COALESCE(VALUES(tenth_marksheet_url), tenth_marksheet_url),
        tenth_verified = VALUES(tenth_verified),
        twelfth_marks = VALUES(twelfth_marks),
        twelfth_maths_marks = VALUES(twelfth_maths_marks),
        twelfth_board = VALUES(twelfth_board),
        twelfth_year = VALUES(twelfth_year),
        entrance_exam_type = VALUES(entrance_exam_type),
        entrance_exam_score = VALUES(entrance_exam_score),
        entrance_exam_marksheet_url = COALESCE(VALUES(entrance_exam_marksheet_url), entrance_exam_marksheet_url),
        entrance_exam_verified = VALUES(entrance_exam_verified),
        twelfth_marksheet_url = COALESCE(VALUES(twelfth_marksheet_url), twelfth_marksheet_url),
        twelfth_verified = VALUES(twelfth_verified),
        diploma_marks = VALUES(diploma_marks),
        diploma_institute = VALUES(diploma_institute),
        diploma_year = VALUES(diploma_year),
        diploma_marksheet_url = COALESCE(VALUES(diploma_marksheet_url), diploma_marksheet_url),
        diploma_verified = VALUES(diploma_verified),
        gap = VALUES(gap),
        gap_reason = VALUES(gap_reason),
        gap_certificate_url = COALESCE(VALUES(gap_certificate_url), gap_certificate_url),
        gap_verified = VALUES(gap_verified),
        department = VALUES(department),
        current_cgpa = VALUES(current_cgpa),
        percentage = VALUES(percentage),
        cgpa_verified = VALUES(cgpa_verified),
        active_backlogs = VALUES(active_backlogs),
        dead_backlog_semesters = VALUES(dead_backlog_semesters),
        dead_backlog_count = VALUES(dead_backlog_count),
        backlogs_verified = VALUES(backlogs_verified),
        passing_year = VALUES(passing_year)
    `,
    [
      prn,
      nextTenthMarks,
      nextTenthMathsMarks,
      nextTenthBoard,
      nextTenthYear,
      nextTenthMarksheetUrl,
      nextTenthVerified ? 1 : 0,
      nextTwelfthMarks,
      nextTwelfthMathsMarks,
      nextTwelfthBoard,
      nextTwelfthYear,
      nextEntranceExamType,
      nextEntranceExamScore,
      nextEntranceExamMarksheetUrl,
      nextEntranceExamVerified ? 1 : 0,
      nextTwelfthMarksheetUrl,
      nextTwelfthVerified ? 1 : 0,
      nextDiplomaMarks,
      nextDiplomaInstitute,
      nextDiplomaYear,
      nextDiplomaMarksheetUrl,
      nextDiplomaVerified ? 1 : 0,
      nextGap,
      nextGapReason,
      nextGapCertificateUrl,
      nextGapVerified ? 1 : 0,
      nextDepartment,
      nextCgpa,
      nextPercentage,
      nextCgpaVerified ? 1 : 0,
      nextActiveBacklogs,
      nextDeadBacklogSemesters,
      nextDeadBacklogCount,
      nextBacklogsVerified ? 1 : 0,
      nextPassingYear,
    ]
  );

  await updateProfileProgress(prn, 'education');
  await resetProfileVerification(prn);

  res.json({ message: 'Education details saved' });
}));

studentFormRoutes.post('/skills', asyncHandler(async (req, res) => {
  const { prn, languages = '[]', tools = '[]', frameworks = '[]', otherSkills = '[]' } = req.body;

  const normalizedSkills = [
    ...parseJsonField(languages).map((skillName) => ({ skill_name: String(skillName).trim(), skill_type: 'language' })),
    ...parseJsonField(tools).map((skillName) => ({ skill_name: String(skillName).trim(), skill_type: 'tool' })),
    ...parseJsonField(frameworks).map((skillName) => ({ skill_name: String(skillName).trim(), skill_type: 'framework' })),
    ...parseJsonField(otherSkills).map((skillName) => ({ skill_name: String(skillName).trim(), skill_type: 'other' })),
  ].filter((skill) => skill.skill_name);

  const uniqueSkills = normalizedSkills.filter(
    (skill, index, skills) =>
      skills.findIndex(
        (entry) =>
          entry.skill_name.toLowerCase() === skill.skill_name.toLowerCase() &&
          entry.skill_type === skill.skill_type
      ) === index
  );

  await query('DELETE FROM student_skills WHERE PRN = ?', [prn]);

  if (!uniqueSkills.length) {
    await updateProfileProgress(prn, 'skills');
    await resetProfileVerification(prn);
    res.json({ message: 'Skills saved' });
    return;
  }

  await query('INSERT IGNORE INTO technical_skills (skill_name) VALUES ?', [
    uniqueSkills.map((skill) => [skill.skill_name]),
  ]);

  const skillRows = await query(
    `SELECT skill_id, skill_name FROM technical_skills WHERE skill_name IN (${uniqueSkills.map(() => '?').join(', ')})`,
    uniqueSkills.map((skill) => skill.skill_name)
  );

  const skillMap = new Map(
    skillRows.map((row) => [String(row.skill_name).toLowerCase(), row.skill_id])
  );

  await query('INSERT INTO student_skills (PRN, skill_id, skill_type) VALUES ?', [
    uniqueSkills.map((skill) => [
      prn,
      skillMap.get(skill.skill_name.toLowerCase()),
      skill.skill_type,
    ]),
  ]);

  await updateProfileProgress(prn, 'skills');
  await resetProfileVerification(prn);

  res.json({ message: 'Skills saved' });
}));

studentFormRoutes.post('/projects', asyncHandler(async (req, res) => {
  const { prn, projects = '[]' } = req.body;
  const parsedProjects = parseJsonField(projects);

  await query('DELETE FROM student_projects WHERE PRN = ?', [prn]);

  if (!parsedProjects.length) {
    await updateProfileProgress(prn, 'projects');
    await resetProfileVerification(prn);
    res.json({ message: 'Projects saved' });
    return;
  }

  await query(
    `
      INSERT INTO student_projects
      (PRN, project_number, title, description, tech_stack, github_link, live_link, include_in_resume)
      VALUES ?
    `,
    [
      parsedProjects.map((project, index) => [
        prn,
        index + 1,
        project.title || null,
        project.description || null,
        project.techStack || null,
        project.githubLink || null,
        project.liveLink || null,
        project.includeInResume === false ? 0 : 1,
      ]),
    ]
  );

  await updateProfileProgress(prn, 'projects');
  await resetProfileVerification(prn);

  res.json({ message: 'Projects saved' });
}));

studentFormRoutes.post('/experience', asyncHandler(async (req, res) => {
  const { prn, experience = '[]' } = req.body;
  const parsedExperience = parseJsonField(experience);
  const certificateUrls = await uploadIndexedFiles(req, 'experienceCertificate_', 'students/experience');
  const existingExperienceRows = await query(
    'SELECT * FROM student_experience WHERE PRN = ? ORDER BY exp_number ASC',
    [prn]
  );
  const existingExperienceMap = new Map(
    existingExperienceRows.map((row) => [row.exp_number, row])
  );

  if (parsedExperience.length > 3) {
    res.status(400).json({ message: 'Maximum 3 experience entries allowed' });
    return;
  }

  let nextExpNumber =
    existingExperienceRows.reduce((maximum, row) => Math.max(maximum, row.exp_number || 0), 0) + 1;

  const normalizedExperience = parsedExperience.map((entry, index) => {
    const expNumber = entry.expNumber ? Number(entry.expNumber) : nextExpNumber++;
    const existingEntry = existingExperienceMap.get(expNumber);
    const nextType = entry.type || null;
    const nextCompanyName = entry.companyName || null;
    const nextDurationUnit = entry.durationUnit || null;
    const parsedDurationValue = Number(entry.durationValue);
    const nextDurationValue =
      entry.durationValue === '' ||
      entry.durationValue === undefined ||
      entry.durationValue === null ||
      Number.isNaN(parsedDurationValue)
        ? null
        : parsedDurationValue;
    const nextDurationSummary = entry.durationSummary || entry.duration || null;
    const nextRole = entry.role || null;
    const nextDuration = entry.duration || nextDurationSummary || null;
    const nextDescription = entry.description || null;
    const nextCertificateUrl =
      certificateUrls[index] || entry.certificateUrl || existingEntry?.certificate_url || null;

    return {
      expNumber,
      type: nextType,
      companyName: nextCompanyName,
      durationUnit: nextDurationUnit,
      durationValue: nextDurationValue,
      durationSummary: nextDurationSummary,
      role: nextRole,
      duration: nextDuration,
      description: nextDescription,
      certificateUrl: nextCertificateUrl,
      isVerified:
        Boolean(existingEntry?.is_verified) &&
        valuesMatch(existingEntry?.type, nextType) &&
        valuesMatch(existingEntry?.company_name, nextCompanyName) &&
        valuesMatch(existingEntry?.duration_unit, nextDurationUnit) &&
        valuesMatch(existingEntry?.duration_value, nextDurationValue) &&
        valuesMatch(existingEntry?.duration_summary, nextDurationSummary) &&
        valuesMatch(existingEntry?.role, nextRole) &&
        valuesMatch(existingEntry?.duration, nextDuration) &&
        valuesMatch(existingEntry?.description, nextDescription) &&
        valuesMatch(existingEntry?.certificate_url, nextCertificateUrl),
    };
  });

  await query('DELETE FROM student_experience WHERE PRN = ?', [prn]);

  if (!normalizedExperience.length) {
    await updateProfileProgress(prn, 'experience');
    await resetProfileVerification(prn);
    res.json({ message: 'Experience saved' });
    return;
  }

  await query(
    `
      INSERT INTO student_experience
      (
        PRN,
        exp_number,
        type,
        company_name,
        duration_unit,
        duration_summary,
        duration_value,
        role,
        duration,
        description,
        certificate_url,
        is_verified
      )
      VALUES ?
    `,
    [
      normalizedExperience.map((entry) => [
        prn,
        entry.expNumber,
        entry.type || null,
        entry.companyName || null,
        entry.durationUnit || null,
        entry.durationSummary || null,
        entry.durationValue ?? null,
        entry.role || null,
        entry.duration || null,
        entry.description || null,
        entry.certificateUrl || null,
        entry.isVerified ? 1 : 0,
      ]),
    ]
  );

  await updateProfileProgress(prn, 'experience');
  await resetProfileVerification(prn);

  res.json({ message: 'Experience saved' });
}));

studentFormRoutes.post('/certifications', asyncHandler(async (req, res) => {
  const { prn, certifications = '[]' } = req.body;
  const parsedCertifications = parseJsonField(certifications);
  const certificateUrls = await uploadIndexedFiles(req, 'certificationFile_', 'students/certifications');
  const existingCertificationRows = await query(
    'SELECT * FROM student_certifications WHERE PRN = ? ORDER BY cert_number ASC',
    [prn]
  );
  const existingCertificationMap = new Map(
    existingCertificationRows.map((row) => [row.cert_number, row])
  );

  let nextCertNumber =
    existingCertificationRows.reduce((maximum, row) => Math.max(maximum, row.cert_number || 0), 0) + 1;

  const normalizedCertifications = parsedCertifications.map((entry, index) => {
    const certNumber = entry.certNumber ? Number(entry.certNumber) : nextCertNumber++;
    const existingEntry = existingCertificationMap.get(certNumber);
    const nextName = entry.name || null;
    const nextPlatform = entry.platform || null;
    const nextCertificateUrl =
      certificateUrls[index] || entry.certificateUrl || existingEntry?.certificate_url || null;

    return {
      certNumber,
      name: nextName,
      platform: nextPlatform,
      certificateUrl: nextCertificateUrl,
      isVerified:
        Boolean(existingEntry?.is_verified) &&
        valuesMatch(existingEntry?.name, nextName) &&
        valuesMatch(existingEntry?.platform, nextPlatform) &&
        valuesMatch(existingEntry?.certificate_url, nextCertificateUrl),
    };
  });

  await query('DELETE FROM student_certifications WHERE PRN = ?', [prn]);

  if (!normalizedCertifications.length) {
    await updateProfileProgress(prn, 'certifications');
    await resetProfileVerification(prn);
    res.json({ message: 'Certifications saved' });
    return;
  }

  await query(
    `
      INSERT INTO student_certifications
      (PRN, cert_number, name, platform, certificate_url, is_verified)
      VALUES ?
    `,
    [
      normalizedCertifications.map((entry) => [
        prn,
        entry.certNumber,
        entry.name || null,
        entry.platform || null,
        entry.certificateUrl || null,
        entry.isVerified ? 1 : 0,
      ]),
    ]
  );

  await updateProfileProgress(prn, 'certifications');
  await resetProfileVerification(prn);

  res.json({ message: 'Certifications saved' });
}));

studentFormRoutes.post('/activities', asyncHandler(async (req, res) => {
  const { prn, activities = '[]' } = req.body;
  const parsedActivities = parseJsonField(activities);
  const existingActivityRows = await query(
    'SELECT * FROM student_activities WHERE PRN = ? ORDER BY act_number ASC',
    [prn]
  );
  const existingActivityMap = new Map(
    existingActivityRows.map((row) => [row.act_number, row])
  );

  let nextActNumber =
    existingActivityRows.reduce((maximum, row) => Math.max(maximum, row.act_number || 0), 0) + 1;

  const normalizedActivities = parsedActivities.map((entry) => {
    const actNumber = entry.actNumber ? Number(entry.actNumber) : nextActNumber++;
    const existingEntry = existingActivityMap.get(actNumber);
    const nextTitle = entry.title || null;
    const nextDescription = entry.description || null;
    const nextLink = entry.links || null;

    return {
      actNumber,
      title: nextTitle,
      description: nextDescription,
      link: nextLink,
      isVerified:
        Boolean(existingEntry?.is_verified) &&
        valuesMatch(existingEntry?.title, nextTitle) &&
        valuesMatch(existingEntry?.description, nextDescription) &&
        valuesMatch(existingEntry?.link, nextLink),
    };
  });

  await query('DELETE FROM student_activities WHERE PRN = ?', [prn]);

  if (!normalizedActivities.length) {
    await updateProfileProgress(prn, 'activities');
    await resetProfileVerification(prn);
    res.json({ message: 'Activities saved' });
    return;
  }

  await query(
    `
      INSERT INTO student_activities
      (PRN, act_number, title, description, link, is_verified)
      VALUES ?
    `,
    [
      normalizedActivities.map((entry) => [
        prn,
        entry.actNumber,
        entry.title || null,
        entry.description || null,
        entry.link || null,
        entry.isVerified ? 1 : 0,
      ]),
    ]
  );

  await updateProfileProgress(prn, 'activities');
  await resetProfileVerification(prn);

  res.json({ message: 'Activities saved' });
}));

studentFormRoutes.post('/consent', asyncHandler(async (req, res) => {
  const { prn, accepted } = req.body;

  if (!prn) {
    res.status(400).json({ message: 'PRN is required' });
    return;
  }

  if (!toNullableBoolean(accepted)) {
    res.status(400).json({ message: 'Consent must be accepted before final submission.' });
    return;
  }

  await updateProfileProgress(prn, 'consent');
  await resetProfileVerification(prn);

  res.json({ message: 'Consent saved' });
}));

studentFormRoutes.get('/progress/:prn', asyncHandler(async (req, res) => {
  const { prn } = req.params;

  await ensureProfileProgressRow(prn);

  const rows = await query(
    `
      SELECT *
      FROM student_profile_progress
      WHERE PRN = ?
      LIMIT 1
    `,
    [prn]
  );

  res.json({
    message: 'Student profile progress fetched successfully',
    data: rows[0] || null,
  });
}));

module.exports = studentFormRoutes;
