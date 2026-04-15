const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const { auth } = require('../middleware/auth');
require('dotenv').config();

// POST /api/auth/login — accepts email OR phone, handles both DB schemas
router.post('/login', async (req, res) => {
  const { phone, email, password } = req.body;
  const identifier = phone || email;
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Phone/email and password required' });
  }

  try {
    // Try phone first
    let result = await pool.query('SELECT * FROM users WHERE phone = $1', [identifier]).catch(() => ({ rows: [] }));

    // If not found, try email column
    if (!result.rows.length) {
      result = await pool.query('SELECT * FROM users WHERE email = $1', [identifier]).catch(() => ({ rows: [] }));
    }

    if (!result.rows.length) return res.status(401).json({ error: 'Invalid credentials' });

    const user = result.rows[0];

    // Support both password_hash (Express schema) and password (NestJS/Prisma schema)
    const storedHash = user.password_hash || user.password;
    if (!storedHash) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, storedHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    // Normalize role to lowercase (NestJS stores as ADMIN/TEACHER/STUDENT)
    const role = (user.role || 'student').toLowerCase();

    const firstName = user.first_name || (user.fullName ? user.fullName.split(' ')[0] : '');
    const lastName = user.last_name || (user.fullName ? user.fullName.split(' ').slice(1).join(' ') : '');

    const token = jwt.sign(
      { id: user.id, role, first_name: firstName, last_name: lastName },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const { password_hash, password: pw, ...userData } = user;
    res.json({ token, user: { ...userData, role, first_name: firstName, last_name: lastName } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    const { password_hash, password, ...user } = rows[0];
    const role = (user.role || 'student').toLowerCase();
    const first_name = user.first_name || (user.fullName ? user.fullName.split(' ')[0] : '');
    const last_name = user.last_name || (user.fullName ? user.fullName.split(' ').slice(1).join(' ') : '');
    res.json({ ...user, role, first_name, last_name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/auth/language
router.put('/language', auth, async (req, res) => {
  const { language } = req.body;
  if (!['uz', 'en'].includes(language)) return res.status(400).json({ error: 'Invalid language' });
  try {
    await pool.query('UPDATE users SET language = $1 WHERE id = $2', [language, req.user.id]).catch(() => {});
    res.json({ success: true, language });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/auth/password
router.put('/password', auth, async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) return res.status(400).json({ error: 'Both fields required' });
  if (new_password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const storedHash = rows[0]?.password_hash || rows[0]?.password;
    const valid = await bcrypt.compare(current_password, storedHash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

    const hash = await bcrypt.hash(new_password, 10);
    // Try both column names
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.user.id])
      .catch(() => pool.query('UPDATE users SET password = $1 WHERE id = $2', [hash, req.user.id]));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
