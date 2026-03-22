const express = require('express');
const fs = require('fs/promises');
const upload = require('../../config/upload');
const { uploadFile } = require('../../config/storageService');
const db = require('../../config/db').db;

const studentFormRoutes = express.Router();

studentFormRoutes.use(upload.any());

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

function getUploadedFile(req, fieldName) {
  return req.files?.find((file) => file.fieldname === fieldName) ?? null;
}

async function uploadSingleFile(req, fieldName, folder) {
  const file = getUploadedFile(req, fieldName);

  if (!file) {
    return null;
  }

  try {
    return await uploadFile(file, folder);
  } finally {
    await fs.unlink(file.path).catch(() => {});
  }
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

      try {
        uploadedFiles[index] = await uploadFile(file, folder);
      } finally {
        await fs.unlink(file.path).catch(() => {});
      }
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

function asyncHandler(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      res.status(500).json({
        message: 'Failed to save data',
        error:
          error.code === 'CLOUDINARY_AUTH_FAILED' ||
          error.code === 'CLOUDINARY_CONFIG_INVALID' ||
          error.code === 'CLOUDINARY_CONFIG_MISSING'
            ? 'File upload is not configured correctly on the server. Please verify Cloudinary credentials in Server/.env.'
            : error.message,
      });
    }
  };
}

studentFormRoutes.post('/personal_details', asyncHandler(async (req, res) => {
  const profilePhotoUrl = await uploadSingleFile(req, 'profilePhoto', 'students/profile-photo');

  const {
    prn,
    firstName,
    middleName,
    lastName,
    email,
    mobile,
    address,
    country,
    city,
    district,
    state,
    pincode,
    dob,
    age,
    gender,
    category,
    handicap,
    aadhaar,
  } = req.body;

  await query(
    `
      INSERT INTO student_personal
      (PRN, first_name, middle_name, last_name, email, mobile, address, country, city, district, state, pincode,
       dob, age, gender, category, handicap, aadhaar, profile_photo_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        first_name = VALUES(first_name),
        middle_name = VALUES(middle_name),
        last_name = VALUES(last_name),
        email = VALUES(email),
        mobile = VALUES(mobile),
        address = VALUES(address),
        country = VALUES(country),
        city = VALUES(city),
        district = VALUES(district),
        state = VALUES(state),
        pincode = VALUES(pincode),
        dob = VALUES(dob),
        age = VALUES(age),
        gender = VALUES(gender),
        category = VALUES(category),
        handicap = VALUES(handicap),
        aadhaar = VALUES(aadhaar),
        profile_photo_url = COALESCE(VALUES(profile_photo_url), profile_photo_url)
    `,
    [
      prn,
      firstName || null,
      middleName || null,
      lastName || null,
      email || null,
      mobile || null,
      address || null,
      normalizeLocationValue(country),
      normalizeLocationValue(city),
      normalizeLocationValue(district),
      normalizeLocationValue(state),
      pincode || null,
      dob || null,
      toNullableNumber(age),
      gender || null,
      category || null,
      toNullableBoolean(handicap),
      aadhaar || null,
      profilePhotoUrl,
    ]
  );

  res.json({ message: 'Personal details saved' });
}));

studentFormRoutes.post('/education_details', asyncHandler(async (req, res) => {
  const tenthMarksheetUrl = await uploadSingleFile(req, 'marksheet10', 'students/education');
  const twelfthMarksheetUrl = await uploadSingleFile(req, 'marksheet12', 'students/education');
  const diplomaMarksheetUrl = await uploadSingleFile(req, 'diplomaMarksheet', 'students/education');
  const gapCertificateUrl = await uploadSingleFile(req, 'gapCertificate', 'students/education');

  const {
    prn,
    marks10,
    board10,
    year10,
    marks12,
    board12,
    year12,
    diplomaMarks,
    diplomaInstitute,
    diplomaYear,
    gapStatus,
    gapReason,
    department,
    cgpa,
    backlogs,
    graduationYear,
  } = req.body;

  await query(
    `
      INSERT INTO student_education
      (PRN, tenth_marks, tenth_board, tenth_year, tenth_marksheet_url,
       twelfth_marks, twelfth_board, twelfth_year, twelfth_marksheet_url,
       diploma_marks, diploma_institute, diploma_year, diploma_marksheet_url,
       gap, gap_reason, gap_certificate_url, department, current_cgpa, backlogs, passing_year)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        tenth_marks = VALUES(tenth_marks),
        tenth_board = VALUES(tenth_board),
        tenth_year = VALUES(tenth_year),
        tenth_marksheet_url = COALESCE(VALUES(tenth_marksheet_url), tenth_marksheet_url),
        twelfth_marks = VALUES(twelfth_marks),
        twelfth_board = VALUES(twelfth_board),
        twelfth_year = VALUES(twelfth_year),
        twelfth_marksheet_url = COALESCE(VALUES(twelfth_marksheet_url), twelfth_marksheet_url),
        diploma_marks = VALUES(diploma_marks),
        diploma_institute = VALUES(diploma_institute),
        diploma_year = VALUES(diploma_year),
        diploma_marksheet_url = COALESCE(VALUES(diploma_marksheet_url), diploma_marksheet_url),
        gap = VALUES(gap),
        gap_reason = VALUES(gap_reason),
        gap_certificate_url = COALESCE(VALUES(gap_certificate_url), gap_certificate_url),
        department = VALUES(department),
        current_cgpa = VALUES(current_cgpa),
        backlogs = VALUES(backlogs),
        passing_year = VALUES(passing_year)
    `,
    [
      prn,
      toNullableNumber(marks10),
      board10 || null,
      toNullableNumber(year10),
      tenthMarksheetUrl,
      toNullableNumber(marks12),
      board12 || null,
      toNullableNumber(year12),
      twelfthMarksheetUrl,
      toNullableNumber(diplomaMarks),
      diplomaInstitute || null,
      toNullableNumber(diplomaYear),
      diplomaMarksheetUrl,
      gapStatus === 'Yes' ? 'YES' : 'NO',
      gapReason || null,
      gapCertificateUrl,
      department || null,
      toNullableNumber(cgpa),
      toNullableNumber(backlogs),
      toNullableNumber(graduationYear),
    ]
  );

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

  res.json({ message: 'Skills saved' });
}));

studentFormRoutes.post('/projects', asyncHandler(async (req, res) => {
  const { prn, projects = '[]' } = req.body;
  const parsedProjects = parseJsonField(projects);

  if (parsedProjects.length > 3) {
    res.status(400).json({ message: 'Maximum 3 projects allowed' });
    return;
  }

  await query('DELETE FROM student_projects WHERE PRN = ?', [prn]);

  if (!parsedProjects.length) {
    res.json({ message: 'Projects saved' });
    return;
  }

  await query(
    `
      INSERT INTO student_projects
      (PRN, project_number, title, description, tech_stack, github_link, live_link)
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
      ]),
    ]
  );

  res.json({ message: 'Projects saved' });
}));

studentFormRoutes.post('/experience', asyncHandler(async (req, res) => {
  const { prn, experience = '[]' } = req.body;
  const parsedExperience = parseJsonField(experience);
  const certificateUrls = await uploadIndexedFiles(req, 'experienceCertificate_', 'students/experience');

  if (parsedExperience.length > 3) {
    res.status(400).json({ message: 'Maximum 3 experience entries allowed' });
    return;
  }

  await query('DELETE FROM student_experience WHERE PRN = ?', [prn]);

  if (!parsedExperience.length) {
    res.json({ message: 'Experience saved' });
    return;
  }

  await query(
    `
      INSERT INTO student_experience
      (PRN, exp_number, type, company_name, role, duration, description, certificate_url)
      VALUES ?
    `,
    [
      parsedExperience.map((entry, index) => [
        prn,
        index + 1,
        entry.type || null,
        entry.companyName || null,
        entry.role || null,
        entry.duration || null,
        entry.description || null,
        certificateUrls[index] || null,
      ]),
    ]
  );

  res.json({ message: 'Experience saved' });
}));

studentFormRoutes.post('/certifications', asyncHandler(async (req, res) => {
  const { prn, certifications = '[]' } = req.body;
  const parsedCertifications = parseJsonField(certifications);
  const certificateUrls = await uploadIndexedFiles(req, 'certificationFile_', 'students/certifications');

  await query('DELETE FROM student_certifications WHERE PRN = ?', [prn]);

  if (!parsedCertifications.length) {
    res.json({ message: 'Certifications saved' });
    return;
  }

  await query(
    `
      INSERT INTO student_certifications
      (PRN, cert_number, name, platform, certificate_url)
      VALUES ?
    `,
    [
      parsedCertifications.map((entry, index) => [
        prn,
        index + 1,
        entry.name || null,
        entry.platform || null,
        certificateUrls[index] || null,
      ]),
    ]
  );

  res.json({ message: 'Certifications saved' });
}));

studentFormRoutes.post('/activities', asyncHandler(async (req, res) => {
  const { prn, activities = '[]' } = req.body;
  const parsedActivities = parseJsonField(activities);

  await query('DELETE FROM student_activities WHERE PRN = ?', [prn]);

  if (!parsedActivities.length) {
    res.json({ message: 'Activities saved' });
    return;
  }

  await query(
    `
      INSERT INTO student_activities
      (PRN, act_number, title, description, link)
      VALUES ?
    `,
    [
      parsedActivities.map((entry, index) => [
        prn,
        index + 1,
        entry.title || null,
        entry.description || null,
        entry.links || null,
      ]),
    ]
  );

  res.json({ message: 'Activities saved' });
}));

module.exports = studentFormRoutes;
