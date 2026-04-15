const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { pool } = require('../db');
const { auth, requireRole } = require('../middleware/auth');

// GET /api/users?role=student|teacher|admin
router.get('/', auth, requireRole('teacher', 'admin'), async (req, res) => {
  const { role } = req.query;
  try {
    let query = 'SELECT * FROM users';
    const params = [];
    if (role) {
      // Handle both lowercase and uppercase roles
      query += ' WHERE LOWER(role) = $1';
      params.push(role.toLowerCase());
    }
    query += ' ORDER BY created_at DESC';
    const { rows } = await pool.query(query, params);

    // Normalize each user
    const users = rows.map(u => {
      const { password_hash, password, ...rest } = u;
      const first_name = rest.first_name || (rest.fullName ? rest.fullName.split(' ')[0] : '');
      const last_name = rest.last_name || (rest.fullName ? rest.fullName.split(' ').slice(1).join(' ') : '');
      return { ...rest, first_name, last_name, role: (rest.role || '').toLowerCase() };
    });

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/dashboard — student dashboard stats
router.get('/dashboard', auth, async (req, res) => {
  try {
    const userRes = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (!userRes.rows.length) return res.status(404).json({ error: 'Not found' });
    const u = userRes.rows[0];

    const rankRes = await pool.query(`
      SELECT COUNT(*) + 1 AS position FROM users
      WHERE LOWER(role) = 'student' AND xp > (SELECT COALESCE(xp,0) FROM users WHERE id = $1)
    `, [req.user.id]).catch(() => ({ rows: [{ position: 0 }] }));

    const xp = u.xp || 0;
    const level = Math.floor(xp / 300) + 1;
    const xpForNext = level * 300;

    const todayLessons = await pool.query(`
      SELECT l.title, l.lesson_date FROM lessons l
      JOIN group_students gs ON gs.group_id = l.group_id
      WHERE gs.student_id = $1 AND l.lesson_date = CURRENT_DATE
      ORDER BY l.created_at
    `, [req.user.id]).catch(() => ({ rows: [] }));

    const calendarDots = await pool.query(`
      SELECT DISTINCT l.lesson_date::text FROM lessons l
      JOIN group_students gs ON gs.group_id = l.group_id
      WHERE gs.student_id = $1
        AND DATE_TRUNC('month', l.lesson_date) = DATE_TRUNC('month', CURRENT_DATE)
      ORDER BY l.lesson_date
    `, [req.user.id]).catch(() => ({ rows: [] }));

    const first_name = u.first_name || (u.fullName ? u.fullName.split(' ')[0] : '');
    const last_name = u.last_name || (u.fullName ? u.fullName.split(' ').slice(1).join(' ') : '');

    res.json({
      user: { ...u, first_name, last_name },
      xp,
      level,
      xp_for_next: xpForNext,
      rating_position: parseInt(rankRes.rows[0].position),
      today_lessons: todayLessons.rows,
      calendar_dots: calendarDots.rows.map(r => r.lesson_date),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/rating
router.get('/rating', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT id, first_name, last_name, avatar_url, xp, coins,
        RANK() OVER (ORDER BY xp DESC) AS position
      FROM users WHERE LOWER(role) = 'student'
      ORDER BY xp DESC LIMIT 50
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/profile
router.put('/profile', auth, async (req, res) => {
  const { first_name, last_name, birth_date, gender } = req.body;
  try {
    const { rows } = await pool.query(`
      UPDATE users SET
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        birth_date = COALESCE($3, birth_date),
        gender = COALESCE($4, gender)
      WHERE id = $5
      RETURNING *
    `, [first_name, last_name, birth_date, gender, req.user.id]);
    const { password_hash, password, ...user } = rows[0];
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users — admin creates user
router.post('/', auth, requireRole('admin'), async (req, res) => {
  const { first_name, last_name, phone, email, password, role, birth_date, gender, hh_id } = req.body;
  if (!first_name || !last_name || !password || !role) {
    return res.status(400).json({ error: 'Required fields missing' });
  }
  if (!phone && !email) {
    return res.status(400).json({ error: 'Phone or email required' });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (first_name, last_name, phone, password_hash, role, birth_date, gender, hh_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id, first_name, last_name, phone, role, birth_date, gender, hh_id`,
      [first_name, last_name, phone || null, hash, role, birth_date || null, gender || 'male', hh_id || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Bu telefon raqam allaqachon mavjud' });
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:id
router.put('/:id', auth, requireRole('admin'), async (req, res) => {
  const { first_name, last_name, phone, birth_date, gender, hh_id, password } = req.body;
  try {
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      const { rows } = await pool.query(`
        UPDATE users SET first_name=COALESCE($1,first_name), last_name=COALESCE($2,last_name),
          phone=COALESCE($3,phone), birth_date=COALESCE($4,birth_date), gender=COALESCE($5,gender),
          hh_id=COALESCE($6,hh_id), password_hash=$7
        WHERE id=$8 RETURNING id, first_name, last_name, phone, role, birth_date, gender, hh_id
      `, [first_name, last_name, phone, birth_date, gender, hh_id, hash, req.params.id]);
      return res.json(rows[0]);
    }
    const { rows } = await pool.query(`
      UPDATE users SET first_name=COALESCE($1,first_name), last_name=COALESCE($2,last_name),
        phone=COALESCE($3,phone), birth_date=COALESCE($4,birth_date), gender=COALESCE($5,gender),
        hh_id=COALESCE($6,hh_id)
      WHERE id=$7 RETURNING id, first_name, last_name, phone, role, birth_date, gender, hh_id
    `, [first_name, last_name, phone, birth_date, gender, hh_id, req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/users/:id
router.delete('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
