const express = require('express');
const db = require('../../config/db').db;

const tpcStudentVerificationRoutes = express.Router();

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

function createField(id, label, value, extra = {}) {
  return {
    id,
    label,
    value: value === null || value === undefined || value === '' ? '-' : String(value),
    ...extra,
  };
}

function buildVerifiedFields(student) {
  const verifiedFields = {};

  if (student.education?.tenth_verified) {
    verifiedFields.education_tenth_marks = true;
  }
  if (student.education?.twelfth_verified) {
    verifiedFields.education_twelfth_marks = true;
  }
  if (student.education?.entrance_exam_verified) {
    verifiedFields.education_entrance_exam = true;
  }
  if (student.education?.diploma_verified) {
    verifiedFields.education_diploma_marks = true;
  }
  if (student.education?.gap_verified) {
    verifiedFields.education_gap = true;
  }
  if (student.education?.cgpa_verified) {
    verifiedFields.education_cgpa = true;
  }
  if (student.education?.backlogs_verified) {
    verifiedFields.education_backlogs = true;
  }

  student.experience.forEach((item) => {
    if (item.is_verified) {
      verifiedFields[`experience_${item.exp_number}_role`] = true;
    }
  });

  student.certifications.forEach((item) => {
    if (item.is_verified) {
      verifiedFields[`certification_${item.cert_number}`] = true;
    }
  });

  student.activities.forEach((item) => {
    if (item.is_verified) {
      verifiedFields[`activity_${item.act_number}`] = true;
    }
  });

  return verifiedFields;
}

function createVerificationPayload(student) {
  const fullName = buildFullName(student.personal);
  const location = buildLocation(student.personal);
  const education = student.education || {};
  const hasDiploma = Boolean(education.diploma_year);

  const personalFields = [
    createField('personal_name', 'Full Name', fullName),
    createField('personal_prn', 'PRN', student.personal.PRN),
    createField('personal_email', 'Personal Email', student.personal.personal_email),
    createField('personal_college_email', 'College Email', student.personal.college_email),
    createField('personal_phone', 'Phone', student.personal.mobile),
    createField('personal_dob', 'Date of Birth', formatDate(student.personal.dob)),
    createField('personal_aadhaar', 'Aadhaar Number', student.personal.aadhaar),
    createField('personal_blood_group', 'Blood Group', student.personal.blood_group),
    createField('personal_pan', 'PAN Number', student.personal.pan_no),
    createField(
      'personal_address',
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
  ];

  const educationFields = [
    createField(
      'education_tenth_marks',
      '10th Marks',
      education.tenth_marks ? `${education.tenth_marks}%` : '',
      {
        meta: [
          education.tenth_board ? `Board: ${education.tenth_board}` : '',
          education.tenth_maths_marks !== null && education.tenth_maths_marks !== undefined
            ? `Maths: ${education.tenth_maths_marks}`
            : '',
        ]
          .filter(Boolean)
          .join(' | '),
        documentUrl: education.tenth_marksheet_url || '',
        verifiable: Boolean(education.tenth_marksheet_url),
      },
    ),
    hasDiploma
      ? createField(
          'education_diploma_marks',
          'Diploma Marks',
          education.diploma_marks ? `${education.diploma_marks}%` : '',
          {
            meta: education.diploma_institute || '',
            documentUrl: education.diploma_marksheet_url || '',
            verifiable: Boolean(education.diploma_marksheet_url),
          },
        )
      : createField(
          'education_twelfth_marks',
          '12th Marks',
          education.twelfth_marks ? `${education.twelfth_marks}%` : '',
          {
            meta: [
              education.twelfth_board ? `Board: ${education.twelfth_board}` : '',
              education.twelfth_maths_marks !== null && education.twelfth_maths_marks !== undefined
                ? `Maths: ${education.twelfth_maths_marks}`
                : '',
            ]
              .filter(Boolean)
              .join(' | '),
            documentUrl: education.twelfth_marksheet_url || '',
            verifiable: Boolean(education.twelfth_marksheet_url),
          },
        ),
    ...(!hasDiploma &&
    (education.entrance_exam_type || education.entrance_exam_score || education.entrance_exam_marksheet_url)
      ? [
          createField(
            'education_entrance_exam',
            `${String(education.entrance_exam_type || 'Entrance Exam').toUpperCase()} Score`,
            education.entrance_exam_score,
            {
              documentUrl: education.entrance_exam_marksheet_url || '',
              verifiable: Boolean(education.entrance_exam_marksheet_url),
            },
          ),
        ]
      : []),
    ...(education.gap === 'YES' || education.gap_certificate_url
      ? [
          createField('education_gap', 'Gap Details', education.gap_reason || education.gap || 'Gap Declared', {
            documentUrl: education.gap_certificate_url || '',
            verifiable: Boolean(education.gap_certificate_url || education.gap === 'YES'),
          }),
        ]
      : []),
    createField('education_cgpa', 'Current CGPA', education.current_cgpa, {
      verifiable: education.current_cgpa !== null && education.current_cgpa !== undefined,
      rowLayout: 'half',
    }),
    createField('education_percentage', 'Percentage', education.percentage, {
      rowLayout: 'half',
    }),
    createField('education_backlogs', 'Active Backlogs', education.active_backlogs, {
      verifiable: education.active_backlogs !== null && education.active_backlogs !== undefined,
      rowLayout: 'half',
    }),
    createField('education_dead_backlogs', 'Dead Backlogs', education.dead_backlog_semesters, {
      meta:
        education.dead_backlog_count !== null && education.dead_backlog_count !== undefined
          ? `Count: ${education.dead_backlog_count}`
          : '',
      rowLayout: 'half',
    }),
    createField('education_department', 'Department', education.department),
    createField('education_passing_year', 'Passing Year', education.passing_year),
  ];

  const skillFields = [];
  if (student.skills.languages.length) {
    skillFields.push(createField('skills_languages', 'Languages', student.skills.languages.join(', ')));
  }
  if (student.skills.frameworks.length) {
    skillFields.push(createField('skills_frameworks', 'Frameworks', student.skills.frameworks.join(', ')));
  }
  if (student.skills.tools.length) {
    skillFields.push(createField('skills_tools', 'Tools', student.skills.tools.join(', ')));
  }
  if (student.skills.otherLanguages.length) {
    skillFields.push(createField('skills_other_languages', 'Other Languages', student.skills.otherLanguages.join(', ')));
  }

  const projectFields = student.projects.length
    ? student.projects.map((project) =>
        createField(
          `project_${project.project_number}`,
          project.title || `Project ${project.project_number}`,
          project.description || 'No description added',
          {
            meta: project.tech_stack || '',
          },
        )
      )
    : [createField('projects_none', 'Projects', 'No projects added')];

  const experienceFields = student.experience.length
    ? student.experience.flatMap((item) => [
        createField(
          `experience_${item.exp_number}_role`,
          `${item.company_name || 'Experience'} Role`,
          `${item.type || ''} ${item.role ? `| ${item.role}` : ''}`.trim(),
          {
            documentUrl: item.certificate_url || '',
            verifiable: true,
          },
        ),
        createField(`experience_${item.exp_number}_description`, 'Description', item.description),
      ])
    : [createField('experience_none', 'Experience', 'No experience added')];

  const certificationFields = student.certifications.length
    ? student.certifications.map((item) =>
        createField(
          `certification_${item.cert_number}`,
          item.name || `Certification ${item.cert_number}`,
          item.platform,
          {
            documentUrl: item.certificate_url || '',
            verifiable: true,
          },
        ),
      )
    : [createField('certifications_none', 'Certifications', 'No certifications added')];

  const activityFields = student.activities.length
    ? student.activities.map((item) =>
        createField(`activity_${item.act_number}`, item.title || `Activity ${item.act_number}`, item.description, {
          documentUrl: item.link || '',
          verifiable: true,
        }),
      )
    : [createField('activities_none', 'Activities', 'No activities added')];

  return {
    prn: student.personal.PRN,
    name: fullName || student.personal.PRN,
    department: education.department || '-',
    year: education.passing_year ? `Passing ${education.passing_year}` : '-',
    email: student.personal.email || '-',
    phone: student.personal.mobile || '-',
    location: location || '-',
    status: student.isProfileVerified ? 'Verified' : 'Pending',
    avatar: student.personal.profile_photo_url || 'https://ui-avatars.com/api/?background=e2e8f0&color=0f172a&name=' + encodeURIComponent(fullName || student.personal.PRN),
    verifiedFields: buildVerifiedFields(student),
    isProfileVerified: Boolean(student.isProfileVerified),
    sections: [
      {
        id: 'personal',
        title: 'Personal Details',
        description: 'Primary identity and contact details provided by the student.',
        fields: personalFields,
      },
      {
        id: 'education',
        title: 'Education Details',
        description: 'Academic records and supporting documents.',
        fields: educationFields,
      },
      {
        id: 'experience',
        title: 'Experience',
        description: 'Internships and practical exposure.',
        fields: experienceFields,
      },
      {
        id: 'certifications',
        title: 'Certifications',
        description: 'Industry certifications and course completions.',
        fields: certificationFields,
      },
      {
        id: 'activities',
        title: 'Activities',
        description: 'Co-curricular and extracurricular participation.',
        fields: activityFields,
      },
      {
        id: 'skills',
        title: 'Skills',
        description: 'Technical capabilities highlighted for placement drives.',
        fields: skillFields.length ? skillFields : [createField('skills_none', 'Skills', 'No skills added')],
      },
      {
        id: 'projects',
        title: 'Projects',
        description: 'Project work that supports the student profile.',
        fields: projectFields,
      },
    ],
  };
}

tpcStudentVerificationRoutes.get('/students', async (req, res) => {
  try {
    const personalRows = await query(`
      SELECT sp.*, COALESCE(sc.is_profile_verified, FALSE) AS is_profile_verified
      FROM student_personal sp
      LEFT JOIN student_credentials sc ON sc.PRN = sp.PRN
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

    const educationMap = new Map(educationRows.map((row) => [row.PRN, row]));
    const skillsMap = new Map();
    const projectsMap = new Map();
    const experienceMap = new Map();
    const certificationsMap = new Map();
    const activitiesMap = new Map();

    skillRows.forEach((row) => {
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

    projectRows.forEach((row) => {
      const current = projectsMap.get(row.PRN) || [];
      current.push(row);
      projectsMap.set(row.PRN, current);
    });
    experienceRows.forEach((row) => {
      const current = experienceMap.get(row.PRN) || [];
      current.push(row);
      experienceMap.set(row.PRN, current);
    });
    certificationRows.forEach((row) => {
      const current = certificationsMap.get(row.PRN) || [];
      current.push(row);
      certificationsMap.set(row.PRN, current);
    });
    activityRows.forEach((row) => {
      const current = activitiesMap.get(row.PRN) || [];
      current.push(row);
      activitiesMap.set(row.PRN, current);
    });

    const students = personalRows.map((personal) =>
      createVerificationPayload({
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
      }),
    );

    res.json({
      message: 'Student verification records fetched successfully',
      data: students,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch student verification records',
      error: error.message,
    });
  }
});

function buildVerificationUpdate(fieldId) {
  if (fieldId === 'education_tenth_marks') {
    return {
      sql: 'UPDATE student_education SET tenth_verified = TRUE WHERE PRN = ?',
      values: [],
    };
  }

  if (fieldId === 'education_twelfth_marks') {
    return {
      sql: 'UPDATE student_education SET twelfth_verified = TRUE WHERE PRN = ?',
      values: [],
    };
  }

  if (fieldId === 'education_entrance_exam') {
    return {
      sql: 'UPDATE student_education SET entrance_exam_verified = TRUE WHERE PRN = ?',
      values: [],
    };
  }

  if (fieldId === 'education_diploma_marks') {
    return {
      sql: 'UPDATE student_education SET diploma_verified = TRUE WHERE PRN = ?',
      values: [],
    };
  }

  if (fieldId === 'education_gap') {
    return {
      sql: 'UPDATE student_education SET gap_verified = TRUE WHERE PRN = ?',
      values: [],
    };
  }

  if (fieldId === 'education_cgpa') {
    return {
      sql: 'UPDATE student_education SET cgpa_verified = TRUE WHERE PRN = ?',
      values: [],
    };
  }

  if (fieldId === 'education_backlogs') {
    return {
      sql: 'UPDATE student_education SET backlogs_verified = TRUE WHERE PRN = ?',
      values: [],
    };
  }

  const experienceMatch = fieldId.match(/^experience_(\d+)_role$/);
  if (experienceMatch) {
    return {
      sql: 'UPDATE student_experience SET is_verified = TRUE WHERE PRN = ? AND exp_number = ?',
      values: [Number(experienceMatch[1])],
    };
  }

  const certificationMatch = fieldId.match(/^certification_(\d+)$/);
  if (certificationMatch) {
    return {
      sql: 'UPDATE student_certifications SET is_verified = TRUE WHERE PRN = ? AND cert_number = ?',
      values: [Number(certificationMatch[1])],
    };
  }

  const activityMatch = fieldId.match(/^activity_(\d+)$/);
  if (activityMatch) {
    return {
      sql: 'UPDATE student_activities SET is_verified = TRUE WHERE PRN = ? AND act_number = ?',
      values: [Number(activityMatch[1])],
    };
  }

  return null;
}

tpcStudentVerificationRoutes.post('/students/:prn/verify-field', async (req, res) => {
  const { prn } = req.params;
  const { fieldId } = req.body;

  try {
    const updateConfig = buildVerificationUpdate(fieldId);

    if (!updateConfig) {
      res.status(400).json({
        message: 'Unsupported verification field',
      });
      return;
    }

    await query(updateConfig.sql, [prn, ...updateConfig.values]);

    res.json({
      message: 'Field verified successfully',
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to verify field',
      error: error.message,
    });
  }
});

tpcStudentVerificationRoutes.post('/students/:prn/verify-profile', async (req, res) => {
  const { prn } = req.params;

  try {
    await query(
      'UPDATE student_credentials SET is_profile_verified = TRUE WHERE PRN = ?',
      [prn],
    );

    res.json({
      message: 'Profile verified successfully',
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to verify profile',
      error: error.message,
    });
  }
});

module.exports = tpcStudentVerificationRoutes;
