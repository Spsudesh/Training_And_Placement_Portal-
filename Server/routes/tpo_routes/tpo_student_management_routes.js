const express = require('express');
const db = require('../../config/db').db;

const tpoStudentManagementRoutes = express.Router();

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

function formatDate(dateValue) {
  if (!dateValue) {
    return '';
  }

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function buildFullName(personal) {
  return [personal.first_name, personal.middle_name, personal.last_name]
    .filter(Boolean)
    .join(' ')
    .trim();
}

function buildLocation(personal) {
  return [personal.city, personal.district, personal.state]
    .filter(Boolean)
    .join(', ');
}

function getStatus(student) {
  if (student.personal.is_blacklisted) {
    return 'Blacklisted';
  }

  return student.isProfileVerified ? 'Verified' : 'Pending';
}

function createAvatarUrl(personal, fullName) {
  if (personal.profile_photo_url) {
    return personal.profile_photo_url;
  }

  return `https://ui-avatars.com/api/?background=e2e8f0&color=0f172a&name=${encodeURIComponent(
    fullName || personal.PRN,
  )}`;
}

function createProfileSummary(student, fullName) {
  const education = student.education || {};
  const skills = student.skills || {};
  const headline = [education.department, education.passing_year ? `Passing ${education.passing_year}` : '']
    .filter(Boolean)
    .join(' | ');
  const skillSummary = [
    ...(skills.languages || []),
    ...(skills.frameworks || []),
    ...(skills.tools || []),
    ...(skills.otherLanguages || []),
  ]
    .filter(Boolean)
    .slice(0, 6)
    .join(', ');

  if (!headline && !skillSummary) {
    return `${fullName || student.personal.PRN} has completed a placement profile and is available for review.`;
  }

  if (!skillSummary) {
    return `${fullName || student.personal.PRN} is currently listed under ${headline}.`;
  }

  return `${fullName || student.personal.PRN} is currently listed under ${headline} with skills in ${skillSummary}.`;
}

function createField(label, value) {
  return {
    label,
    value: value === null || value === undefined || value === '' ? '-' : String(value),
  };
}

function createDocument(label, url) {
  return url ? { label, url } : null;
}

function formatShortDate(dateValue) {
  if (!dateValue) {
    return '';
  }

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
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

function mapEducationDetails(education) {
  const details = [];
  const hasDiploma = Boolean(education?.diploma_year);

  details.push({
    title: '10th Standard',
    fields: [
      createField('Marks', education?.tenth_marks ? `${education.tenth_marks}%` : ''),
      createField('Maths Marks', education?.tenth_maths_marks),
      createField('Board', education?.tenth_board),
      createField('Passing Year', education?.tenth_year),
    ],
    document: createDocument('View Marksheet', education?.tenth_marksheet_url),
  });

  if (hasDiploma) {
    details.push({
      title: 'Diploma',
      fields: [
        createField('Marks', education?.diploma_marks ? `${education.diploma_marks}%` : ''),
        createField('Institute', education?.diploma_institute),
        createField('Passing Year', education?.diploma_year),
      ],
      document: createDocument('View Marksheet', education?.diploma_marksheet_url),
    });
  } else {
    details.push({
      title: '12th Standard',
      fields: [
        createField('Marks', education?.twelfth_marks ? `${education.twelfth_marks}%` : ''),
        createField('Maths Marks', education?.twelfth_maths_marks),
        createField('Board', education?.twelfth_board),
        createField('Passing Year', education?.twelfth_year),
        createField(
          education?.entrance_exam_type
            ? `${String(education.entrance_exam_type).toUpperCase()} Score`
            : 'Entrance Exam Score',
          education?.entrance_exam_score,
        ),
      ],
      document:
        createDocument('View Marksheet', education?.twelfth_marksheet_url) ||
        createDocument('View Entrance Score Card', education?.entrance_exam_marksheet_url),
    });
  }

  details.push({
    title: 'Current Degree',
    fields: [
      createField('Department', education?.department),
      createField('Current CGPA', education?.current_cgpa),
      createField('Percentage', education?.percentage),
      createField('Active Backlogs', education?.active_backlogs),
      createField('Dead Backlog Semesters', education?.dead_backlog_semesters),
      createField('Dead Backlog Count', education?.dead_backlog_count),
      createField('Passing Year', education?.passing_year),
    ],
    document: null,
  });

  if (education?.gap === 'YES' || education?.gap_certificate_url || education?.gap_reason) {
    details.push({
      title: 'Education Gap',
      fields: [
        createField('Gap Declared', education?.gap || 'YES'),
        createField('Reason', education?.gap_reason),
      ],
      document: createDocument('View Certificate', education?.gap_certificate_url),
    });
  }

  return details;
}

function mapSkills(skills) {
  return {
    Languages: skills?.languages || [],
    Frameworks: skills?.frameworks || [],
    Tools: skills?.tools || [],
    'Other Languages': skills?.otherLanguages || [],
  };
}

function mapProjects(projects) {
  return (projects || []).map((project) => ({
    title: project.title || `Project ${project.project_number}`,
    description: project.description || 'No description added.',
    techStack: project.tech_stack || '-',
  }));
}

function mapExperience(experience) {
  return (experience || []).map((entry) => ({
    company: entry.company_name || 'Experience',
    role: entry.role || entry.type || '-',
    duration: entry.duration_summary || entry.duration || '-',
    description: entry.description || 'No description added.',
    document: createDocument('View Certificate', entry.certificate_url),
  }));
}

function mapCertifications(certifications) {
  return (certifications || []).map((entry) => ({
    title: entry.name || `Certification ${entry.cert_number}`,
    platform: entry.platform || '-',
    description: entry.description || 'No description added.',
    document: createDocument('View Certificate', entry.certificate_url),
  }));
}

function mapActivities(activities) {
  return (activities || []).map((entry) => ({
    title: entry.title || `Activity ${entry.act_number}`,
    description: entry.description || 'No description added.',
  }));
}

function createStudentManagementPayload(student) {
  const fullName = buildFullName(student.personal);
  const education = student.education || {};
  const status = getStatus(student);
  const placementApplications = student.placementApplications || [];

  const driveHistory = placementApplications.map((application) => ({
    company: application.company || '-',
    role: application.role || '-',
    appliedOn: formatDate(application.submitted_at),
    outcome:
      application.application_status === 'pending_verification'
        ? 'Pending Verification'
        : application.application_status,
    currentStage:
      application.application_status === 'pending_verification'
        ? 'TPO Verification'
        : application.application_status,
    rounds: [
      {
        name: 'Applied',
        date: formatShortDate(application.submitted_at) || 'Pending',
        status: 'completed',
      },
      {
        name: 'TPO Verification',
        date: formatShortDate(application.updated_at) || 'Pending',
        status: application.application_status === 'pending_verification' ? 'current' : 'completed',
      },
    ],
  }));

  const ongoingDrives = placementApplications.map((application) => ({
    company: application.company || '-',
    role: application.role || '-',
    appliedOn: formatDate(application.submitted_at),
    status:
      application.application_status === 'pending_verification'
        ? 'Pending Verification'
        : application.application_status,
    currentRound:
      application.application_status === 'pending_verification'
        ? 'TPO Verification'
        : application.application_status,
  }));

  return {
    prn: String(student.personal.PRN || ''),
    name: fullName || String(student.personal.PRN || ''),
    department: education.department || '-',
    year: education.passing_year ? `Passing ${education.passing_year}` : '-',
    status,
    email: student.personal.email || '-',
    phone: student.personal.mobile || '-',
    location: buildLocation(student.personal) || '-',
    avatar: createAvatarUrl(student.personal, fullName),
    profileSummary: createProfileSummary(student, fullName),
    personalDetails: [
      createField('Full Name', fullName),
      createField('PRN', student.personal.PRN),
      createField('Email', student.personal.email),
      createField('Phone', student.personal.mobile),
      createField('Gender', student.personal.gender),
      createField('Date of Birth', formatDate(student.personal.dob)),
      createField('Blood Group', student.personal.blood_group),
      createField('Category', student.personal.category),
      createField('PAN Number', student.personal.pan_no),
      createField(
        'Address',
        [
          student.personal.address,
          student.personal.city,
          student.personal.district,
          student.personal.state,
          student.personal.pincode,
        ]
          .filter(Boolean)
          .join(', '),
      ),
    ],
    educationDetails: mapEducationDetails(education),
    skills: mapSkills(student.skills),
    projects: mapProjects(student.projects),
    experience: mapExperience(student.experience),
    certifications: mapCertifications(student.certifications),
    activities: mapActivities(student.activities),
    placementTrack: {
      ongoingDrives,
      driveHistory,
    },
  };
}

async function fetchStudentManagementRows() {
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

  const personalRows = await query(`
    SELECT sp.*, COALESCE(sc.is_profile_verified, FALSE) AS is_profile_verified
    FROM student_personal sp
    LEFT JOIN student_credentials sc ON sc.PRN = sp.PRN
    WHERE sc.is_profile_verified = TRUE
    ORDER BY sp.PRN ASC
  `);
  const educationRows = await query('SELECT * FROM student_education');
  const skillRows = await query(`
    SELECT PRN, skill_name, skill_type
    FROM student_skills
    ORDER BY PRN ASC, skill_name ASC
  `);
  const projectRows = await query('SELECT * FROM student_projects ORDER BY PRN ASC, project_number ASC');
  const experienceRows = await query('SELECT * FROM student_experience ORDER BY PRN ASC, exp_number ASC');
  const certificationRows = await query('SELECT * FROM student_certifications ORDER BY PRN ASC, cert_number ASC');
  const activityRows = await query('SELECT * FROM student_activities ORDER BY PRN ASC, act_number ASC');
  const placementApplicationRows = await query(`
    SELECT pa.PRN, pa.application_status, pa.submitted_at, pa.updated_at, o.company_name, o.job_title
    FROM placement_applications pa
    INNER JOIN tpo_opportunities o ON o.id = pa.opportunity_id
    ORDER BY pa.submitted_at DESC, pa.id DESC
  `);

  return {
    personalRows,
    educationRows,
    skillRows,
    projectRows,
    experienceRows,
    certificationRows,
    activityRows,
    placementApplicationRows,
  };
}

function buildGroupedMaps(rows) {
  const educationMap = new Map(rows.educationRows.map((row) => [row.PRN, row]));
  const skillsMap = new Map();
  const projectsMap = new Map();
  const experienceMap = new Map();
  const certificationsMap = new Map();
  const activitiesMap = new Map();
  const placementApplicationsMap = new Map();

  rows.skillRows.forEach((row) => {
    const current = skillsMap.get(row.PRN) || {
      languages: [],
      frameworks: [],
      tools: [],
      otherLanguages: [],
    };

    if (row.skill_type === 'language') current.languages.push(row.skill_name);
    if (row.skill_type === 'framework') current.frameworks.push(row.skill_name);
    if (row.skill_type === 'tool') current.tools.push(row.skill_name);
    if (row.skill_type === 'other_language') current.otherLanguages.push(row.skill_name);

    skillsMap.set(row.PRN, current);
  });

  rows.projectRows.forEach((row) => {
    const current = projectsMap.get(row.PRN) || [];
    current.push(row);
    projectsMap.set(row.PRN, current);
  });

  rows.experienceRows.forEach((row) => {
    const current = experienceMap.get(row.PRN) || [];
    current.push(row);
    experienceMap.set(row.PRN, current);
  });

  rows.certificationRows.forEach((row) => {
    const current = certificationsMap.get(row.PRN) || [];
    current.push(row);
    certificationsMap.set(row.PRN, current);
  });

  rows.activityRows.forEach((row) => {
    const current = activitiesMap.get(row.PRN) || [];
    current.push(row);
    activitiesMap.set(row.PRN, current);
  });

  rows.placementApplicationRows.forEach((row) => {
    const current = placementApplicationsMap.get(row.PRN) || [];
    current.push({
      company: row.company_name || '',
      role: row.job_title || '',
      application_status: row.application_status || 'pending_verification',
      submitted_at: row.submitted_at,
      updated_at: row.updated_at,
    });
    placementApplicationsMap.set(row.PRN, current);
  });

  return {
    educationMap,
    skillsMap,
    projectsMap,
    experienceMap,
    certificationsMap,
    activitiesMap,
    placementApplicationsMap,
  };
}

function buildStudentPayloads(rows) {
  const {
    educationMap,
    skillsMap,
    projectsMap,
    experienceMap,
    certificationsMap,
    activitiesMap,
    placementApplicationsMap,
  } = buildGroupedMaps(rows);

  return rows.personalRows.map((personal) =>
    createStudentManagementPayload({
      personal,
      isProfileVerified: Boolean(personal.is_profile_verified),
      education: educationMap.get(personal.PRN) || {},
      skills: skillsMap.get(personal.PRN) || {
        languages: [],
        frameworks: [],
        tools: [],
        otherLanguages: [],
      },
      projects: projectsMap.get(personal.PRN) || [],
      experience: experienceMap.get(personal.PRN) || [],
      certifications: certificationsMap.get(personal.PRN) || [],
      activities: activitiesMap.get(personal.PRN) || [],
      placementApplications: placementApplicationsMap.get(personal.PRN) || [],
    }),
  );
}

tpoStudentManagementRoutes.get('/students', async (req, res) => {
  try {
    const rows = await fetchStudentManagementRows();
    const students = buildStudentPayloads(rows);

    res.json({
      message: 'TPO student management records fetched successfully.',
      data: students,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch TPO student management records.',
      error: error.message,
    });
  }
});

tpoStudentManagementRoutes.get('/students/:prn', async (req, res) => {
  try {
    const rows = await fetchStudentManagementRows();
    const students = buildStudentPayloads(rows);
    const student = students.find((item) => item.prn === String(req.params.prn));

    if (!student) {
      res.status(404).json({
        message: 'Student not found.',
      });
      return;
    }

    res.json({
      message: 'TPO student management profile fetched successfully.',
      data: student,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch TPO student management profile.',
      error: error.message,
    });
  }
});

module.exports = tpoStudentManagementRoutes;
