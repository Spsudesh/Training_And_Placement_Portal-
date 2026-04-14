const express = require('express');
const bcrypt = require('bcrypt');
const { requireAuth, requireRole } = require('../../middleware/authMiddleware');
const router = express.Router();
const db = require('../../config/db').db;

const SALT_ROUNDS = 12;
const ALLOWED_EMAIL_DOMAIN = '@ritindia.edu';

function normalizeEmail(email = '') {
  return email.trim().toLowerCase();
}

function isAllowedInstitutionEmail(email) {
  return normalizeEmail(email).endsWith(ALLOWED_EMAIL_DOMAIN);
}

// Get all TPC list
router.get('/list', requireAuth, requireRole('tpo'), async (req, res) => {
  try {
    const promiseDb = db.promise();
    const [rows] = await promiseDb.query(
      `
        SELECT id, email, department, is_active, created_at, name, tpc_code
        FROM TPC_Credentials
        ORDER BY created_at DESC
      `,
    );

    return res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error('Fetch TPC List Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch TPC list.',
      error: error.message,
    });
  }
});

// Get TPC by ID
router.get('/:id', requireAuth, requireRole('tpo'), async (req, res) => {
  const { id } = req.params;

  try {
    const promiseDb = db.promise();
    const [rows] = await promiseDb.query(
      `
        SELECT id, email, department, is_active, created_at, name, tpc_code
        FROM TPC_Credentials
        WHERE id = ?
        LIMIT 1
      `,
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'TPC not found.',
      });
    }

    return res.json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error('Fetch TPC Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch TPC.',
      error: error.message,
    });
  }
});

// Create TPC credentials
router.post('/create', requireAuth, requireRole('tpo'), async (req, res) => {
  const { email, password, name, department_name } = req.body;

  console.log('🔍 TPC Create Request Received:');
  console.log('  Email:', email);
  console.log('  Name:', name);
  console.log('  Password:', password ? '****' : 'MISSING');
  console.log('  Department:', department_name);

  const normalizedEmail = normalizeEmail(email);
  const normalizedPassword = String(password || '').trim();
  const normalizedName = String(name || '').trim();
  const normalizedDepartment = String(department_name || '').trim();

  console.log('🔍 Normalized Values:');
  console.log('  Normalized Email:', normalizedEmail);
  console.log('  Normalized Name:', normalizedName);
  console.log('  Normalized Department:', normalizedDepartment);

  if (!normalizedEmail || !normalizedPassword || !normalizedName || !normalizedDepartment) {
    console.log('❌ Validation failed - missing required fields');
    return res.status(400).json({
      success: false,
      message: 'Email, password, name, and department are required.',
    });
  }

  if (!isAllowedInstitutionEmail(normalizedEmail)) {
    console.log('❌ Email validation failed - not @ritindia.edu');
    return res.status(400).json({
      success: false,
      message: 'Only @ritindia.edu email addresses are allowed.',
    });
  }

  try {
    const promiseDb = db.promise();

    // Check if email already exists
    const [existingTPCs] = await promiseDb.query(
      'SELECT id, email FROM TPC_Credentials WHERE LOWER(email) = ? LIMIT 1',
      [normalizedEmail],
    );

    if (existingTPCs.length > 0) {
      console.log('❌ Email already exists:', normalizedEmail);
      return res.status(409).json({
        success: false,
        message: 'Email already registered as TPC.',
      });
    }

    const hashedPassword = await bcrypt.hash(normalizedPassword, SALT_ROUNDS);
    console.log('✅ Password hashed successfully');

    // Generate unique tpc_code from email and timestamp
    const emailPrefix = normalizedEmail.split('@')[0];
    const timestamp = Date.now().toString().slice(-6);
    const tpcCode = `TPC_${emailPrefix.toUpperCase()}_${timestamp}`;

    console.log('💾 Attempting to INSERT into TPC_Credentials:');
    console.log('  tpc_code:', tpcCode);
    console.log('  name:', normalizedName);
    console.log('  email:', normalizedEmail);
    console.log('  department:', normalizedDepartment);
    console.log('  is_active: 1');

    const [result] = await promiseDb.query(
      `
        INSERT INTO TPC_Credentials
          (tpc_code, name, email, password, department, is_active)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      [tpcCode, normalizedName, normalizedEmail, hashedPassword, normalizedDepartment, 1],
    );

    console.log('✅ TPC Created Successfully:');
    console.log('  Insert ID:', result.insertId);
    console.log('  Affected Rows:', result.affectedRows);

    return res.status(201).json({
      success: true,
      message: 'TPC created successfully.',
      data: {
        id: result.insertId,
        tpc_code: tpcCode,
        name: normalizedName,
        email: normalizedEmail,
        department: normalizedDepartment,
        is_active: 1,
      },
    });
  } catch (error) {
    console.error('❌ Create TPC Error:', error.message);
    console.error('   Stack:', error.stack);
    return res.status(500).json({
      success: false,
      message: 'Failed to create TPC.',
      error: error.message,
    });
  }
});

// Update TPC credentials
router.put('/:id', requireAuth, requireRole('tpo'), async (req, res) => {
  const { id } = req.params;
  const { password, department_name, is_active } = req.body;

  try {
    const promiseDb = db.promise();

    // Check if TPC exists
    const [existing] = await promiseDb.query(
      'SELECT id FROM TPC_Credentials WHERE id = ? LIMIT 1',
      [id],
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'TPC not found.',
      });
    }

    const updates = [];
    const values = [];

    if (password) {
      const normalizedPassword = String(password).trim();
      if (normalizedPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters.',
        });
      }
      const hashedPassword = await bcrypt.hash(normalizedPassword, SALT_ROUNDS);
      updates.push('password = ?');
      values.push(hashedPassword);
    }

    if (department_name) {
      updates.push('department = ?');
      values.push(String(department_name).trim());
    }

    if (is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No updates provided.',
      });
    }

    values.push(id);

    const query = `UPDATE TPC_Credentials SET ${updates.join(', ')} WHERE id = ?`;
    await promiseDb.query(query, values);

    return res.json({
      success: true,
      message: 'TPC updated successfully.',
    });
  } catch (error) {
    console.error('Update TPC Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update TPC.',
      error: error.message,
    });
  }
});

// Delete TPC
router.delete('/:id', requireAuth, requireRole('tpo'), async (req, res) => {
  const { id } = req.params;

  try {
    const promiseDb = db.promise();

    const [result] = await promiseDb.query(
      'DELETE FROM TPC_Credentials WHERE id = ?',
      [id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'TPC not found.',
      });
    }

    return res.json({
      success: true,
      message: 'TPC deleted successfully.',
    });
  } catch (error) {
    console.error('Delete TPC Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete TPC.',
      error: error.message,
    });
  }
});

module.exports = router;
