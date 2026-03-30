const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const db = require('../../config/db').db;

const SALT_ROUNDS = 12;
const ALLOWED_EMAIL_DOMAIN = '@ritindia.edu';
const allowedRoles = new Set(['student', 'tpc', 'tpo']);
const STATIC_TPO_ACCOUNT = {
  PRN: 'TPO001',
  email: 'tpo@ritindia.edu',
  password: 'TPO',
  role: 'tpo',
  is_profile_verified: 1,
  is_active: 1,
};

function normalizeEmail(email = '') {
  return email.trim().toLowerCase();
}

function isAllowedInstitutionEmail(email) {
  return normalizeEmail(email).endsWith(ALLOWED_EMAIL_DOMAIN);
}

router.post('/signup', async (req, res) => {
  const { PRN, email, password, role } = req.body;

  const normalizedPrn = String(PRN || '').trim();
  const normalizedEmail = normalizeEmail(email);
  const normalizedPassword = String(password || '').trim();
  const normalizedRole = String(role || '').trim().toLowerCase();

  if (!normalizedPrn || !normalizedEmail || !normalizedPassword || !normalizedRole) {
    return res.status(400).json({
      success: false,
      message: 'PRN, email, password, and role are required.',
    });
  }

  if (!isAllowedInstitutionEmail(normalizedEmail)) {
    return res.status(400).json({
      success: false,
      message: 'Only @ritindia.edu email addresses are allowed for signup.',
    });
  }

  if (!allowedRoles.has(normalizedRole)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid role selected.',
    });
  }

  try {
    const promiseDb = db.promise();
    const [existingUsers] = await promiseDb.query(
      'SELECT PRN, email FROM Student_Credentials WHERE PRN = ? OR LOWER(email) = ? LIMIT 1',
      [normalizedPrn, normalizedEmail],
    );

    if (existingUsers.length > 0) {
      const duplicateUser = existingUsers[0];

      if (String(duplicateUser.PRN) === normalizedPrn) {
        return res.status(409).json({
          success: false,
          message: 'PRN already exists.',
        });
      }

      return res.status(409).json({
        success: false,
        message: 'Email already registered.',
      });
    }

    const hashedPassword = await bcrypt.hash(normalizedPassword, SALT_ROUNDS);

    await promiseDb.query(
      `INSERT INTO Student_Credentials
        (PRN, email, Password, role, is_profile_verified, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [normalizedPrn, normalizedEmail, hashedPassword, normalizedRole, 0, 1],
    );

    await promiseDb.query(
      `
        INSERT INTO student_personal (PRN, college_email)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE
          college_email = VALUES(college_email)
      `,
      [normalizedPrn, normalizedEmail],
    );

    await promiseDb.query(
      `
        INSERT INTO student_profile_progress (PRN)
        VALUES (?)
        ON DUPLICATE KEY UPDATE
          updated_at = CURRENT_TIMESTAMP
      `,
      [normalizedPrn],
    );

    return res.status(201).json({
      success: true,
      message: 'Signup successful.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create account.',
      error: error.message,
    });
  }
});

router.post('/login', async (req, res) => {
  const { email, password, role } = req.body;

  const normalizedEmail = normalizeEmail(email);
  const normalizedPassword = String(password || '').trim();
  const selectedRole = String(role || '').trim().toLowerCase();

  if (!normalizedEmail || !normalizedPassword) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required.',
    });
  }

  if (normalizedEmail === STATIC_TPO_ACCOUNT.email) {
    if (selectedRole && selectedRole !== STATIC_TPO_ACCOUNT.role) {
      return res.status(403).json({
        success: false,
        message: 'Selected role does not match this account.',
      });
    }

    if (normalizedPassword !== STATIC_TPO_ACCOUNT.password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    return res.json({
      success: true,
      message: 'Login successful.',
      user: {
        PRN: STATIC_TPO_ACCOUNT.PRN,
        email: STATIC_TPO_ACCOUNT.email,
        role: STATIC_TPO_ACCOUNT.role,
        isProfileVerified: Boolean(STATIC_TPO_ACCOUNT.is_profile_verified),
      },
    });
  }

  try {
    const promiseDb = db.promise();
    const [rows] = await promiseDb.query(
      `SELECT PRN, email, Password, role, is_profile_verified, is_active
       FROM Student_Credentials
       WHERE LOWER(email) = ?
       LIMIT 1`,
      [normalizedEmail],
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const user = rows[0];

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Your account is inactive. Please contact the administrator.',
      });
    }

    if (selectedRole && user.role !== selectedRole) {
      return res.status(403).json({
        success: false,
        message: 'Selected role does not match this account.',
      });
    }

    const passwordMatches = await bcrypt.compare(normalizedPassword, user.Password);

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    return res.json({
      success: true,
      message: 'Login successful.',
      user: {
        PRN: user.PRN,
        email: user.email,
        role: user.role,
        isProfileVerified: Boolean(user.is_profile_verified),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to login.',
      error: error.message,
    });
  }
});

module.exports = router;
