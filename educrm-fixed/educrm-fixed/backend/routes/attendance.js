const router = require('express').Router();
const { pool } = require('../db');
const { auth, requireRole } = require('../middleware/auth');

// GET /api/attendance/lesson/:lessonId — student list with their status
router.get('/lesson/:lessonId', auth, requireRole('teacher', 'admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        u.id AS student_id,
        u.first_name, u.last_name, u.avatar_url,
        COALESCE(a.status, 'absent') AS status,
        COALESCE(a.minutes_late, 0) AS minutes_late,
        a.marked_at
      FROM group_students gs
      JOIN lessons l ON l.id = $1
      JOIN users u ON u.id = gs.student_id
      LEFT JOIN attendance a ON a.lesson_id = $1 AND a.student_id = u.id
      WHERE gs.group_id = l.group_id
      ORDER BY u.first_name, u.last_name
    `, [req.params.lessonId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/attendance/lesson/:lessonId — bulk save student attendance
// body: { records: [{ student_id, status, minutes_late }] }
router.post('/lesson/:lessonId', auth, requireRole('teacher', 'admin'), async (req, res) => {
  const { records } = req.body;
  if (!Array.isArray(records)) return res.status(400).json({ error: 'records array required' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const r of records) {
      const minutesLate = r.status === 'late' ? (r.minutes_late || 0) : 0;
      await client.query(`
        INSERT INTO attendance (lesson_id, student_id, status, minutes_late, marked_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (lesson_id, student_id)
        DO UPDATE SET status = $3, minutes_late = $4, marked_at = NOW()
      `, [req.params.lessonId, r.student_id, r.status || 'absent', minutesLate]);
    }
    // Notify absent students
    const absentStudents = records.filter(r => r.status === 'absent');
    if (absentStudents.length > 0) {
      const lessonRes = await client.query('SELECT title FROM lessons WHERE id=$1', [req.params.lessonId]);
      const lessonTitle = lessonRes.rows[0]?.title || 'Dars';
      for (const r of absentStudents) {
        await client.query(
          `INSERT INTO notifications (user_id, type, title, body) VALUES ($1,'attendance_absent',$2,$3)`,
          [r.student_id, `Davomatingiz belgilandi`, `"${lessonTitle}" darsida qatnashmadingiz deb belgilandi`]
        );
      }
    }
    await client.query('COMMIT');
    res.json({ success: true, count: records.length });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// GET /api/attendance/group/:groupId — full matrix for admin/teacher
router.get('/group/:groupId', auth, requireRole('teacher', 'admin'), async (req, res) => {
  try {
    const lessonsRes = await pool.query(
      `SELECT id, title, lesson_date FROM lessons WHERE group_id = $1 ORDER BY lesson_date ASC`,
      [req.params.groupId]
    );
    const studentsRes = await pool.query(`
      SELECT u.id, u.first_name, u.last_name, u.avatar_url
      FROM users u
      JOIN group_students gs ON gs.student_id = u.id
      WHERE gs.group_id = $1 ORDER BY u.first_name
    `, [req.params.groupId]);
    const attRes = await pool.query(`
      SELECT a.lesson_id, a.student_id, a.status, a.minutes_late
      FROM attendance a
      JOIN lessons l ON l.id = a.lesson_id
      WHERE l.group_id = $1
    `, [req.params.groupId]);

    const matrix = {};
    attRes.rows.forEach(r => {
      if (!matrix[r.student_id]) matrix[r.student_id] = {};
      matrix[r.student_id][r.lesson_id] = { status: r.status, minutes_late: r.minutes_late || 0 };
    });

    res.json({ lessons: lessonsRes.rows, students: studentsRes.rows, matrix });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/attendance/student/:studentId/group/:groupId
router.get('/student/:studentId/group/:groupId', auth, async (req, res) => {
  if (req.user.role === 'student' && req.user.id !== parseInt(req.params.studentId)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const { rows } = await pool.query(`
      SELECT l.id AS lesson_id, l.title, l.lesson_date,
        COALESCE(a.status, 'absent') AS status,
        COALESCE(a.minutes_late, 0) AS minutes_late
      FROM lessons l
      LEFT JOIN attendance a ON a.lesson_id = l.id AND a.student_id = $1
      WHERE l.group_id = $2
      ORDER BY l.lesson_date DESC
    `, [req.params.studentId, req.params.groupId]);

    const total = rows.length;
    const present = rows.filter(r => r.status === 'present').length;
    const late = rows.filter(r => r.status === 'late').length;
    const absent = rows.filter(r => r.status === 'absent').length;
    const pct = total ? Math.round(((present + late * 0.5) / total) * 100) : 0;

    res.json({ records: rows, stats: { total, present, late, absent, pct } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── TEACHER ATTENDANCE (admin only) ──

// GET /api/attendance/teacher/lesson/:lessonId
router.get('/teacher/lesson/:lessonId', auth, requireRole('admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        u.id AS teacher_id, u.first_name, u.last_name, u.avatar_url,
        COALESCE(ta.status, 'present') AS status,
        COALESCE(ta.minutes_late, 0) AS minutes_late,
        ta.marked_at
      FROM lessons l
      JOIN users u ON u.id = l.created_by
      LEFT JOIN teacher_attendance ta ON ta.lesson_id = $1 AND ta.teacher_id = u.id
      WHERE l.id = $1
      UNION
      SELECT
        u.id AS teacher_id, u.first_name, u.last_name, u.avatar_url,
        COALESCE(ta.status, 'present') AS status,
        COALESCE(ta.minutes_late, 0) AS minutes_late,
        ta.marked_at
      FROM groups g
      JOIN lessons l ON l.group_id = g.id AND l.id = $1
      JOIN users u ON u.id = g.teacher_id AND u.id != COALESCE(l.created_by, -1)
      LEFT JOIN teacher_attendance ta ON ta.lesson_id = $1 AND ta.teacher_id = u.id
    `, [req.params.lessonId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/attendance/teacher/lesson/:lessonId — admin marks teacher attendance
router.post('/teacher/lesson/:lessonId', auth, requireRole('admin'), async (req, res) => {
  const { teacher_id, status, minutes_late } = req.body;
  if (!teacher_id) return res.status(400).json({ error: 'teacher_id required' });
  const mins = status === 'late' ? (minutes_late || 0) : 0;
  try {
    await pool.query(`
      INSERT INTO teacher_attendance (lesson_id, teacher_id, status, minutes_late, marked_by)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (teacher_id, lesson_id)
      DO UPDATE SET status = $3, minutes_late = $4, marked_at = NOW(), marked_by = $5
    `, [req.params.lessonId, teacher_id, status || 'present', mins, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/attendance/teacher/:teacherId/summary — teacher's overall attendance stats
router.get('/teacher/:teacherId/summary', auth, requireRole('admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT DISTINCT
        l.id AS lesson_id, l.title, l.lesson_date, g.name AS group_name,
        COALESCE(ta.status, 'present') AS status,
        COALESCE(ta.minutes_late, 0) AS minutes_late
      FROM lessons l
      JOIN groups g ON g.id = l.group_id
      LEFT JOIN teacher_attendance ta ON ta.lesson_id = l.id AND ta.teacher_id = $1
      WHERE g.teacher_id = $1 OR l.created_by = $1
      ORDER BY l.lesson_date DESC
    `, [req.params.teacherId]);

    const total = rows.length;
    const present = rows.filter(r => r.status === 'present').length;
    const late = rows.filter(r => r.status === 'late').length;
    const absent = rows.filter(r => r.status === 'absent').length;
    const totalLateMinutes = rows.reduce((s, r) => s + (r.minutes_late || 0), 0);

    res.json({ records: rows, stats: { total, present, late, absent, totalLateMinutes } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
