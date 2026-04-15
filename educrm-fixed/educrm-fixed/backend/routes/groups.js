const router = require('express').Router();
const { pool } = require('../db');
const { auth, requireRole } = require('../middleware/auth');

// GET /api/groups/my
router.get('/my', auth, async (req, res) => {
  try {
    let rows;
    if (req.user.role?.toLowerCase() === 'student') {
      const result = await pool.query(`
        SELECT g.*,
          u.first_name || ' ' || u.last_name AS teacher_name,
          u.avatar_url AS teacher_avatar,
          (SELECT COUNT(*) FROM group_students WHERE group_id = g.id)::int AS student_count
        FROM groups g
        JOIN group_students gs ON gs.group_id = g.id
        LEFT JOIN users u ON u.id = g.teacher_id
        WHERE gs.student_id = $1
        ORDER BY g.is_active DESC, g.start_date DESC
      `, [req.user.id]);
      rows = result.rows;
    } else if (req.user.role?.toLowerCase() === 'teacher') {
      const result = await pool.query(`
        SELECT g.*,
          (SELECT COUNT(*) FROM group_students WHERE group_id = g.id)::int AS student_count
        FROM groups g WHERE g.teacher_id = $1
        ORDER BY g.is_active DESC, g.start_date DESC
      `, [req.user.id]);
      rows = result.rows;
    } else {
      // admin
      const result = await pool.query(`
        SELECT g.*,
          u.first_name || ' ' || u.last_name AS teacher_name,
          (SELECT COUNT(*) FROM group_students WHERE group_id = g.id)::int AS student_count
        FROM groups g LEFT JOIN users u ON u.id = g.teacher_id
        ORDER BY g.is_active DESC, g.created_at DESC
      `);
      rows = result.rows;
    }
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/groups/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT g.*,
        u.first_name || ' ' || u.last_name AS teacher_name,
        (SELECT COUNT(*) FROM group_students WHERE group_id = g.id)::int AS student_count
      FROM groups g LEFT JOIN users u ON u.id = g.teacher_id
      WHERE g.id = $1
    `, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/groups/:id/lessons
router.get('/:id/lessons', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT l.*,
        h.id AS homework_id,
        h.title AS homework_title,
        h.description AS homework_description,
        h.due_date AS homework_due_date,
        hs.id AS submission_id,
        hs.submitted_at,
        hs.grade,
        (SELECT COUNT(*) FROM video_watch_progress vp WHERE vp.lesson_id = l.id AND vp.student_id = $2) > 0 AS watched,
        (SELECT completed FROM video_watch_progress vp WHERE vp.lesson_id = l.id AND vp.student_id = $2 LIMIT 1) AS watch_completed
      FROM lessons l
      LEFT JOIN homework h ON h.lesson_id = l.id
      LEFT JOIN homework_submissions hs ON hs.homework_id = h.id AND hs.student_id = $2
      WHERE l.group_id = $1
      ORDER BY l.lesson_date DESC, l.created_at DESC
    `, [req.params.id, req.user.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/groups/:id/students
router.get('/:id/students', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT u.id, u.first_name, u.last_name, u.phone, u.avatar_url, u.xp, u.coins, u.gender, gs.joined_at
      FROM users u
      JOIN group_students gs ON gs.student_id = u.id
      WHERE gs.group_id = $1
      ORDER BY u.first_name
    `, [req.params.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/groups — admin/teacher creates group
router.post('/', auth, requireRole('teacher', 'admin'), async (req, res) => {
  const { name, direction, start_date, end_date, teacher_id } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const tid = teacher_id || (req.user.role?.toLowerCase() === 'teacher' ? req.user.id : null);
  try {
    const { rows } = await pool.query(
      'INSERT INTO groups (name, direction, teacher_id, start_date, end_date) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [name, direction, tid, start_date || null, end_date || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/groups/:id
router.put('/:id', auth, requireRole('teacher', 'admin'), async (req, res) => {
  const { name, direction, start_date, end_date, teacher_id, is_active, room_id, course_id, start_time, week_days } = req.body;
  try {
    // Add missing columns if they don't exist yet
    await pool.query(`
      ALTER TABLE groups ADD COLUMN IF NOT EXISTS room_id INTEGER;
      ALTER TABLE groups ADD COLUMN IF NOT EXISTS course_id INTEGER;
      ALTER TABLE groups ADD COLUMN IF NOT EXISTS start_time VARCHAR(10);
      ALTER TABLE groups ADD COLUMN IF NOT EXISTS week_days TEXT[];
    `).catch(() => {});
    const { rows } = await pool.query(`
      UPDATE groups SET
        name=COALESCE($1,name), direction=COALESCE($2,direction),
        teacher_id=COALESCE($3,teacher_id), start_date=COALESCE($4,start_date),
        end_date=COALESCE($5,end_date), is_active=COALESCE($6,is_active),
        room_id=COALESCE($7,room_id), course_id=COALESCE($8,course_id),
        start_time=COALESCE($9,start_time), week_days=COALESCE($10,week_days)
      WHERE id=$11 RETURNING *
    `, [name, direction, teacher_id, start_date, end_date, is_active, room_id, course_id, start_time, week_days, req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/groups/:id
router.delete('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM groups WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/groups/:id/students — add student to group
router.post('/:id/students', auth, requireRole('admin'), async (req, res) => {
  const { student_id } = req.body;
  if (!student_id) return res.status(400).json({ error: 'student_id required' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      'INSERT INTO group_students (group_id, student_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [req.params.id, student_id]
    );
    // Notify student they were added to group
    const grpRes = await client.query('SELECT name FROM groups WHERE id=$1', [req.params.id]);
    const grpName = grpRes.rows[0]?.name || 'guruh';
    await client.query(
      `INSERT INTO notifications (user_id, type, title, body) VALUES ($1,'group_added',$2,$3)`,
      [student_id, `Guruhga qo'shildingiz`, `Siz "${grpName}" guruhiga qo'shildingiz`]
    );
    await client.query('COMMIT');
    res.status(201).json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally { client.release(); }
});

// DELETE /api/groups/:id/students/:studentId
router.delete('/:id/students/:studentId', auth, requireRole('admin'), async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM group_students WHERE group_id=$1 AND student_id=$2',
      [req.params.id, req.params.studentId]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
