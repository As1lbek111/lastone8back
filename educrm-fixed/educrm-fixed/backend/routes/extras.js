const router = require('express').Router();
const { pool } = require('../db');
const { auth, requireRole } = require('../middleware/auth');

// ── COURSES ──

// GET /api/courses
router.get('/courses', auth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM courses ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/courses
router.post('/courses', auth, requireRole('admin'), async (req, res) => {
  const { name, description, direction, price, duration_months } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO courses (name, description, direction, price, duration_months) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [name, description, direction, price || 0, duration_months || 3]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/courses/:id
router.put('/courses/:id', auth, requireRole('admin'), async (req, res) => {
  const { name, description, direction, price, duration_months } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE courses SET name=COALESCE($1,name), description=COALESCE($2,description),
       direction=COALESCE($3,direction), price=COALESCE($4,price), duration_months=COALESCE($5,duration_months)
       WHERE id=$6 RETURNING *`,
      [name, description, direction, price, duration_months, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/courses/:id
router.delete('/courses/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM courses WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── ROOMS ──

// GET /api/rooms
router.get('/rooms', auth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM rooms ORDER BY name');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/rooms
router.post('/rooms', auth, requireRole('admin'), async (req, res) => {
  const { name, capacity } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  try {
    const { rows } = await pool.query(
      'INSERT INTO rooms (name, capacity) VALUES ($1,$2) RETURNING *',
      [name, capacity || 20]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/rooms/:id
router.put('/rooms/:id', auth, requireRole('admin'), async (req, res) => {
  const { name, capacity } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE rooms SET name=COALESCE($1,name), capacity=COALESCE($2,capacity) WHERE id=$3 RETURNING *',
      [name, capacity, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/rooms/:id
router.delete('/rooms/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM rooms WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

// GET /api/rooms/:id/conflicts?start_time=HH:MM&week_days[]=MONDAY&exclude_group_id=5
router.get('/rooms/:id/conflicts', auth, async (req, res) => {
  const { start_time, week_days, exclude_group_id } = req.query;
  if (!start_time || !week_days) return res.json({ conflicts: [] });
  const days = Array.isArray(week_days) ? week_days : [week_days];
  try {
    await pool.query(`
      ALTER TABLE groups ADD COLUMN IF NOT EXISTS start_time VARCHAR(10);
      ALTER TABLE groups ADD COLUMN IF NOT EXISTS week_days TEXT[];
    `).catch(() => {});
    let q, params;
    if (exclude_group_id) {
      q = `SELECT g.id, g.name, g.start_time, g.week_days, u.first_name || ' ' || u.last_name AS teacher_name
           FROM groups g LEFT JOIN users u ON u.id = g.teacher_id
           WHERE g.room_id = $1 AND g.is_active = true AND g.start_time = $2
             AND g.week_days && $3::text[] AND g.id != $4`;
      params = [req.params.id, start_time, days, exclude_group_id];
    } else {
      q = `SELECT g.id, g.name, g.start_time, g.week_days, u.first_name || ' ' || u.last_name AS teacher_name
           FROM groups g LEFT JOIN users u ON u.id = g.teacher_id
           WHERE g.room_id = $1 AND g.is_active = true AND g.start_time = $2
             AND g.week_days && $3::text[]`;
      params = [req.params.id, start_time, days];
    }
    const { rows } = await pool.query(q, params);
    res.json({ conflicts: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
