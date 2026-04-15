
const express = require('express');
const db = require('../../config/db').db;
const { ensureCertificationDurationColumns } = require('../../utils/ensureCertificationDurationColumns');

const studentProfileGetRoutes = express.Router();
const DEFAULT_PRN = '2453014';

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

function toDisplayHandicap(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return value ? 'Yes' : 'No';
}

function buildFullName(personal) {
  return [personal.first_name, personal.middle_name, personal.last_name]
    .filter(Boolean)
    .join(' ');
}

function parseDeadBacklogs(semestersValue, totalCount) {
  const serializedValue = String(semestersValue || '').trim();

  if (!serializedValue) {
    return [];
  }

  return serializedValue
    .split(',')
    .map((entry) => {
      const [semester, count] = entry.split(':');
      return {
        semester: String(semester || '').trim(),
        count: String(count || '').trim() || String(totalCount ?? ''),
      };
    })
    .filter((entry) => entry.semester || entry.count);
}

function isAllowedDocumentUrl(url) {
  return /^https:\/\/res\.cloudinary\.com\//i.test(String(url || ''));
}

studentProfileGetRoutes.get('/document', async (req, res) => {
  const sourceUrl = req.query.url;
  const fileName = req.query.name || 'document.pdf';

  if (!sourceUrl || !isAllowedDocumentUrl(sourceUrl)) {
    res.status(400).json({
      message: 'Invalid document URL',
    });
    return;
  }

  try {
    const response = await fetch(sourceUrl);

    if (!response.ok) {
      res.status(response.status).json({
        message: 'Failed to fetch document from source',
      });
      return;
    }

    const contentType = response.headers.get('content-type') || 'application/pdf';
    const fileBuffer = Buffer.from(await response.arrayBuffer());

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    res.send(fileBuffer);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to stream document',
      error: error.message,
    });
  }
});

async function handleGetStudentProfile(req, res) {
  const prn =
    req.auth?.role === 'student'
      ? req.auth.prn
      : req.params.prn || req.query.prn || DEFAULT_PRN;

  try {
    await ensureCertificationDurationColumns();

    const personalRows = await query(
      'SELECT * FROM student_personal WHERE PRN = ? LIMIT 1',
      [prn]
    );

    if (!personalRows.length) {
      res.status(404).json({
        message: 'Student profile not found',
      });
      return;
    }

    const educationRows = await query(
      'SELECT * FROM student_education WHERE PRN = ? LIMIT 1',
      [prn]
    );

    const skillRows = await query(
      `
        SELECT skill_name, skill_type
        FROM student_skills
        WHERE PRN = ?
        ORDER BY skill_name ASC
      `,
      [prn]
    );

    const projectRows = await query(
      `
        SELECT project_number, title, description, tech_stack, github_link, live_link, include_in_resume
        FROM student_projects
        WHERE PRN = ?
        ORDER BY project_number ASC
      `,
      [prn]
    );

    const experienceRows = await query(
      `
        SELECT
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
        FROM student_experience
        WHERE PRN = ?
        ORDER BY exp_number ASC
      `,
      [prn]
    );

    const certificationRows = await query(
      `
        SELECT
          cert_number,
          name,
          platform,
          link,
          duration_unit,
          duration_summary,
          duration_value,
          duration,
          certificate_url,
          is_verified
        FROM student_certifications
        WHERE PRN = ?
        ORDER BY cert_number ASC
      `,
      [prn]
    );

    const activityRows = await query(
      `
        SELECT act_number, title, description, link, is_verified
        FROM student_activities
        WHERE PRN = ?
        ORDER BY act_number ASC
      `,
      [prn]
    );

    const credentialRows = await query(
      `
        SELECT email, is_profile_verified
        FROM student_credentials
        WHERE PRN = ?
        LIMIT 1
      `,
      [prn]
    );

    const summaryRows = await query(
      `
        SELECT summary
        FROM student_profile_summary
        WHERE PRN = ?
        LIMIT 1
      `,
      [prn]
    );

    const personal = personalRows[0];
    const education = educationRows[0] || {};
    const credential = credentialRows[0] || {};
    const summaryRecord = summaryRows[0] || {};

    const profile = {
      prn: personal.PRN,
      profilePhotoUrl: personal.profile_photo_url || '',
      firstName: personal.first_name || '',
      middleName: personal.middle_name || '',
      lastName: personal.last_name || '',
      fullName: buildFullName(personal),
      email: personal.personal_email || '',
      collegeEmail: personal.college_email || credential.email || '',
      mobile: personal.mobile || '',
      address: personal.address || '',
      country: personal.country || '',
      city: personal.city || '',
      district: personal.district || '',
      state: personal.state || '',
      pincode: personal.pincode || '',
      dob: personal.dob || '',
      age: personal.age || '',
      bloodGroup: personal.blood_group || '',
      gender: personal.gender || '',
      category: personal.category || '',
      handicap: toDisplayHandicap(personal.handicap),
      aadhaar: personal.aadhaar || '',
      panNumber: personal.pan_no || '',
      summary: summaryRecord.summary || '',
      department: education.department || '',
      currentCgpa: education.current_cgpa ?? '',
      currentPercentage: education.percentage ?? '',
      backlogs: education.active_backlogs ?? '',
      deadBacklogs: parseDeadBacklogs(
        education.dead_backlog_semesters,
        education.dead_backlog_count,
      ),
      passingYear: education.passing_year ?? '',
      gap: education.gap || '',
      gapReason: education.gap_reason || '',
      education: {
        tenth: education.tenth_year
          ? {
              schoolName: education.tenth_school_name || '',
              marks: education.tenth_marks,
              mathsMarks: education.tenth_maths_marks,
              board: education.tenth_board,
              year: education.tenth_year,
              marksheetUrl: education.tenth_marksheet_url,
            }
          : null,
        twelfth: education.twelfth_year
          ? {
              collegeName: education.twelfth_college_name || '',
              marks: education.twelfth_marks,
              mathsMarks: education.twelfth_maths_marks,
              board: education.twelfth_board,
              year: education.twelfth_year,
              entranceExamType: education.entrance_exam_type || '',
              entranceExamScore: education.entrance_exam_score ?? '',
              entranceExamCertificateUrl: education.entrance_exam_marksheet_url || '',
              marksheetUrl: education.twelfth_marksheet_url,
            }
          : null,
        diploma: education.diploma_year
          ? {
              marks: education.diploma_marks,
              institute: education.diploma_institute,
              year: education.diploma_year,
              marksheetUrl: education.diploma_marksheet_url,
            }
          : null,
        gapCertificateUrl: education.gap_certificate_url || '',
      },
      skills: {
        languages: skillRows
          .filter((skill) => skill.skill_type === 'language')
          .map((skill) => skill.skill_name),
        frameworks: skillRows
          .filter((skill) => skill.skill_type === 'framework')
          .map((skill) => skill.skill_name),
        tools: skillRows
          .filter((skill) => skill.skill_type === 'tool')
          .map((skill) => skill.skill_name),
        otherLanguages: skillRows
          .filter((skill) => skill.skill_type === 'other_language')
          .map((skill) => skill.skill_name),
      },

      projects: projectRows.map((project) => ({
        projectNumber: project.project_number,
        title: project.title || '',
        description: project.description || '',
        techStack: project.tech_stack || '',
        githubLink: project.github_link || '',
        liveLink: project.live_link || '',
        includeInResume: Boolean(project.include_in_resume),
      })),
      
      experience: experienceRows.map((item) => ({
        expNumber: item.exp_number,
        type: item.type || '',
        companyName: item.company_name || '',
        durationUnit: item.duration_unit || '',
        durationSummary: item.duration_summary || item.duration || '',
        durationValue: item.duration_value ?? '',
        role: item.role || '',
        duration: item.duration_summary || item.duration || '',
        description: item.description || '',
        certificateUrl: item.certificate_url || '',
      })),
      certifications: certificationRows.map((item) => ({
        certNumber: item.cert_number,
        name: item.name || '',
        platform: item.platform || '',
        link: item.link || '',
        durationUnit: item.duration_unit || '',
        durationSummary: item.duration_summary || item.duration || '',
        durationValue: item.duration_value ?? '',
        duration: item.duration_summary || item.duration || '',
        certificateUrl: item.certificate_url || '',
      })),
      activities: activityRows.map((item) => ({
        actNumber: item.act_number,
        title: item.title || '',
        description: item.description || '',
        link: item.link || '',
      })),
      verification: {
        isProfileVerified: Boolean(credential.is_profile_verified),
        education: {
          tenth: Boolean(education.tenth_verified),
          twelfth: Boolean(education.twelfth_verified),
          entranceExam: Boolean(education.entrance_exam_verified),
          diploma: Boolean(education.diploma_verified),
          gap: Boolean(education.gap_verified),
          cgpa: Boolean(education.cgpa_verified),
          backlogs: Boolean(education.backlogs_verified),
        },
        experience: Object.fromEntries(
          experienceRows.map((item) => [item.exp_number, Boolean(item.is_verified)])
        ),
        certifications: Object.fromEntries(
          certificationRows.map((item) => [item.cert_number, Boolean(item.is_verified)])
        ),
        activities: Object.fromEntries(
          activityRows.map((item) => [item.act_number, Boolean(item.is_verified)])
        ),
      },
    };

    res.json({
      message: 'Student profile fetched successfully',
      data: profile,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch student profile',
      error: error.message,
    });
  }
}

studentProfileGetRoutes.get('/', handleGetStudentProfile);
studentProfileGetRoutes.get('/:prn', handleGetStudentProfile);

module.exports = studentProfileGetRoutes;
