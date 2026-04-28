const express = require('express');
const db = require('../../../config/db').db;

const swotRoutes = express.Router();

async function ensureSwotCacheTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS student_swot_cache (
      id BIGINT NOT NULL AUTO_INCREMENT,
      PRN VARCHAR(20) NOT NULL,
      prompt_text LONGTEXT NOT NULL,
      response_json LONGTEXT NOT NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uniq_student_swot_cache_prn (PRN)
    )
  `);
}

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

function buildFullName(personal) {
  return [personal.first_name, personal.middle_name, personal.last_name]
    .filter(Boolean)
    .join(' ')
    .trim();
}

function compactList(values) {
  return values
    .map((value) => String(value || '').trim())
    .filter(Boolean);
}

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function extractJsonPayload(content) {
  if (!content) {
    return null;
  }

  const direct = safeJsonParse(content);
  if (direct) {
    return direct;
  }

  const fencedMatch = String(content).match(/```json\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    const parsed = safeJsonParse(fencedMatch[1].trim());
    if (parsed) {
      return parsed;
    }
  }

  const firstBrace = String(content).indexOf('{');
  const lastBrace = String(content).lastIndexOf('}');

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return safeJsonParse(String(content).slice(firstBrace, lastBrace + 1));
  }

  return null;
}

function arePromptsEqual(firstPrompt, secondPrompt) {
  return String(firstPrompt || '') === String(secondPrompt || '');
}

async function fetchStudentProfileSnapshot(prn) {
  const [
    personalRows,
    educationRows,
    skillRows,
    projectRows,
    experienceRows,
    certificationRows,
    activityRows,
    summaryRows,
  ] = await Promise.all([
    query('SELECT * FROM student_personal WHERE PRN = ? LIMIT 1', [prn]),
    query('SELECT * FROM student_education WHERE PRN = ? LIMIT 1', [prn]),
    query(
      `
        SELECT skill_name, skill_type
        FROM student_skills
        WHERE PRN = ?
        ORDER BY skill_name ASC
      `,
      [prn],
    ),
    query(
      `
        SELECT project_number, title, description, tech_stack
        FROM student_projects
        WHERE PRN = ?
        ORDER BY project_number ASC
      `,
      [prn],
    ),
    query(
      `
        SELECT exp_number, type, company_name, role, duration_summary, duration, description
        FROM student_experience
        WHERE PRN = ?
        ORDER BY exp_number ASC
      `,
      [prn],
    ),
    query(
      `
        SELECT cert_number, name, platform, duration_summary, duration
        FROM student_certifications
        WHERE PRN = ?
        ORDER BY cert_number ASC
      `,
      [prn],
    ),
    query(
      `
        SELECT act_number, title, description
        FROM student_activities
        WHERE PRN = ?
        ORDER BY act_number ASC
      `,
      [prn],
    ),
    query(
      `
        SELECT summary
        FROM student_profile_summary
        WHERE PRN = ?
        LIMIT 1
      `,
      [prn],
    ),
  ]);

  if (!personalRows.length) {
    return null;
  }

  const personal = personalRows[0];
  const education = educationRows[0] || {};

  return {
    prn,
    fullName: buildFullName(personal) || prn,
    department: education.department || '',
    cgpa: education.current_cgpa ?? '',
    percentage: education.percentage ?? '',
    passingYear: education.passing_year ?? '',
    summary: summaryRows[0]?.summary || '',
    skills: {
      technical: compactList(
        skillRows
          .filter((skill) => ['language', 'framework', 'tool'].includes(skill.skill_type))
          .map((skill) => skill.skill_name),
      ),
      nonTechnical: compactList(
        skillRows
          .filter((skill) => skill.skill_type === 'other_language')
          .map((skill) => skill.skill_name),
      ),
    },
    projects: projectRows.map((project) => ({
      title: project.title || '',
      description: project.description || '',
      techStack: project.tech_stack || '',
    })),
    experience: experienceRows.map((experience) => ({
      title: experience.role || experience.type || '',
      company: experience.company_name || '',
      duration: experience.duration_summary || experience.duration || '',
      description: experience.description || '',
    })),
    certifications: certificationRows.map((certification) => ({
      name: certification.name || '',
      platform: certification.platform || '',
      duration: certification.duration_summary || certification.duration || '',
    })),
    activities: activityRows.map((activity) => ({
      title: activity.title || '',
      description: activity.description || '',
    })),
  };
}

function buildSwotPrompt(profile) {
  const lines = [
    `Student Name: ${profile.fullName}`,
    `PRN: ${profile.prn}`,
    `Department: ${profile.department || 'Not specified'}`,
    `Current CGPA: ${profile.cgpa || 'Not specified'}`,
    `Current Percentage: ${profile.percentage || 'Not specified'}`,
    `Passing Year: ${profile.passingYear || 'Not specified'}`,
    `Profile Summary: ${profile.summary || 'Not specified'}`,
    `Technical Skills: ${profile.skills.technical.join(', ') || 'None listed'}`,
    `Non-Technical Skills: ${profile.skills.nonTechnical.join(', ') || 'None listed'}`,
    `Projects: ${
      profile.projects.length
        ? profile.projects
            .map(
              (project) =>
                `${project.title}${project.techStack ? ` [${project.techStack}]` : ''}: ${project.description || 'No description'}`,
            )
            .join(' || ')
        : 'None listed'
    }`,
    `Experience: ${
      profile.experience.length
        ? profile.experience
            .map(
              (item) =>
                `${item.title}${item.company ? ` at ${item.company}` : ''}${item.duration ? ` (${item.duration})` : ''}: ${item.description || 'No description'}`,
            )
            .join(' || ')
        : 'None listed'
    }`,
    `Certifications: ${
      profile.certifications.length
        ? profile.certifications
            .map(
              (item) =>
                `${item.name}${item.platform ? ` from ${item.platform}` : ''}${item.duration ? ` (${item.duration})` : ''}`,
            )
            .join(' || ')
        : 'None listed'
    }`,
    `Extra Curricular Activities: ${
      profile.activities.length
        ? profile.activities
            .map((item) => `${item.title}: ${item.description || 'No description'}`)
            .join(' || ')
        : 'None listed'
    }`,
  ];

  return `
You are an expert placement mentor, SWOT analyst, and career coach for engineering students.

Analyze the student profile below and create a practical, honest, motivating SWOT report.
Base your reasoning only on the profile details provided, but you may infer likely patterns carefully.

Student Profile:
${lines.join('\n')}

Return STRICT JSON only with this exact structure:
{
  "headline": "short one-line summary",
  "overview": "2-4 sentence overall evaluation",
  "swot": {
    "strengths": [{"title": "...", "detail": "..."}],
    "weaknesses": [{"title": "...", "detail": "..."}],
    "opportunities": [{"title": "...", "detail": "..."}],
    "threats": [{"title": "...", "detail": "..."}]
  },
  "futureRoles": [{"role": "...", "fit": "High|Medium|Stretch", "reason": "..."}],
  "nextTopics": [{"topic": "...", "priority": "High|Medium|Low", "reason": "..."}],
  "actionPlan": [{"step": "...", "timeline": "...", "detail": "..."}],
  "guidance": {
    "resumeAdvice": "...",
    "interviewAdvice": "...",
    "learningAdvice": "...",
    "confidenceAdvice": "..."
  },
  "encouragement": "positive but realistic closing note"
}

Rules:
- Keep the language professional, student-friendly, and actionable.
- Mention future job roles based on current skills and profile depth.
- Mention what topics the student should cover next.
- Point out missing or weak areas clearly but respectfully.
- Avoid markdown. Return JSON only.
`;
}

async function requestGroqAnalysis(prompt) {
  const apiKey = String(process.env.GROQ_API_KEY || '').trim();
  const model = String(process.env.GROQ_MODEL || 'llama-3.3-70b-versatile').trim();
  const apiUrl = String(process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions').trim();

  if (!apiKey) {
    const error = new Error('GROQ_API_KEY is not configured on the server.');
    error.statusCode = 500;
    throw error;
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.35,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You produce accurate, structured SWOT analysis for student placement preparation and you always return valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      payload?.error?.message || 'Failed to get SWOT analysis from Groq.',
    );
    error.statusCode = response.status || 500;
    throw error;
  }

  const content = payload?.choices?.[0]?.message?.content || '';
  const parsed = extractJsonPayload(content);

  if (!parsed) {
    const error = new Error('Groq returned an unexpected SWOT response format.');
    error.statusCode = 502;
    throw error;
  }

  return parsed;
}

async function getCachedSwotAnalysis(prn) {
  await ensureSwotCacheTable();

  const rows = await query(
    `
      SELECT prompt_text, response_json, updated_at
      FROM student_swot_cache
      WHERE PRN = ?
      LIMIT 1
    `,
    [prn],
  );

  if (!rows.length) {
    return null;
  }

  const cachedRow = rows[0];
  const cachedResponse = safeJsonParse(cachedRow.response_json);

  if (!cachedResponse) {
    return null;
  }

  return {
    promptText: cachedRow.prompt_text,
    responseJson: cachedResponse,
    updatedAt: cachedRow.updated_at,
  };
}

async function saveCachedSwotAnalysis(prn, prompt, responseJson) {
  await ensureSwotCacheTable();

  await query(
    `
      INSERT INTO student_swot_cache (PRN, prompt_text, response_json)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
        prompt_text = VALUES(prompt_text),
        response_json = VALUES(response_json),
        updated_at = CURRENT_TIMESTAMP
    `,
    [prn, prompt, JSON.stringify(responseJson)],
  );
}

swotRoutes.post('/analyze', async (req, res) => {
  try {
    const prn = String(req.auth?.prn || '').trim();

    if (!prn) {
      return res.status(400).json({
        success: false,
        message: 'Student PRN is missing from the session.',
      });
    }

    const profile = await fetchStudentProfileSnapshot(prn);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found for SWOT analysis.',
      });
    }

    const prompt = buildSwotPrompt(profile);
    const cachedAnalysis = await getCachedSwotAnalysis(prn);

    if (cachedAnalysis && arePromptsEqual(cachedAnalysis.promptText, prompt)) {
      return res.json({
        success: true,
        message: 'SWOT analysis fetched from cache.',
        data: {
          student: {
            prn: profile.prn,
            fullName: profile.fullName,
            department: profile.department,
          },
          analysis: cachedAnalysis.responseJson,
          cache: {
            hit: true,
            comparedWithExactPrompt: true,
            updatedAt: cachedAnalysis.updatedAt,
          },
        },
      });
    }

    const analysis = await requestGroqAnalysis(prompt);
    await saveCachedSwotAnalysis(prn, prompt, analysis);

    return res.json({
      success: true,
      message: 'SWOT analysis generated successfully.',
      data: {
        student: {
          prn: profile.prn,
          fullName: profile.fullName,
          department: profile.department,
        },
        analysis,
        cache: {
          hit: false,
          comparedWithExactPrompt: true,
        },
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to generate SWOT analysis.',
    });
  }
});

module.exports = swotRoutes;
