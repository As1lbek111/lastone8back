const router = require('express').Router();
const path = require('path');
const fs = require('fs');
const { pool } = require('../db');
const { auth, requireRole } = require('../middleware/auth');
const { uploadVideo } = require('../middleware/upload');

// GET /api/lessons/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT l.*,
        h.id AS homework_id, h.title AS hw_title, h.description AS hw_desc, h.due_date AS hw_due_date,
        hs.id AS submission_id, hs.file_urls, hs.file_names, hs.grade, hs.teacher_feedback, hs.submitted_at,
        vp.watched_seconds, vp.completed AS watch_completed
      FROM lessons l
      LEFT JOIN homework h ON h.lesson_id = l.id
      LEFT JOIN homework_submissions hs ON hs.homework_id = h.id AND hs.student_id = $2
      LEFT JOIN video_watch_progress vp ON vp.lesson_id = l.id AND vp.student_id = $2
      WHERE l.id = $1
    `, [req.params.id, req.user.id]);

    if (!rows.length) return res.status(404).json({ error: 'Lesson not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/lessons - teacher creates lesson with video
router.post('/', auth, requireRole('teacher', 'admin'), uploadVideo.single('video'), async (req, res) => {
  const { group_id, title, lesson_date, description } = req.body;
  if (!group_id || !title || !lesson_date) {
    return res.status(400).json({ error: 'group_id, title, lesson_date required' });
  }

  let video_url = null, video_filename = null, video_size_mb = null;
  if (req.file) {
    video_url = `/uploads/videos/${req.file.filename}`;
    video_filename = req.file.originalname;
    video_size_mb = (req.file.size / (1024 * 1024)).toFixed(2);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(`
      INSERT INTO lessons (group_id, title, lesson_date, video_url, video_filename, video_size_mb, description, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
    `, [group_id, title, lesson_date, video_url, video_filename, video_size_mb, description, req.user.id]);

    // Notify all students in the group
    const studentsRes = await client.query(
      'SELECT student_id FROM group_students WHERE group_id=$1', [group_id]
    );
    for (const s of studentsRes.rows) {
      await client.query(
        `INSERT INTO notifications (user_id, type, title, body) VALUES ($1,'new_lesson',$2,$3)`,
        [s.student_id, `Yangi dars: ${title}`, `Guruhingizda yangi dars qo'shildi`]
      );
    }
    await client.query('COMMIT');
    res.status(201).json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally { client.release(); }
});

// PUT /api/lessons/:id - update lesson / upload video
router.put('/:id', auth, requireRole('teacher', 'admin'), uploadVideo.single('video'), async (req, res) => {
  const { title, lesson_date, description } = req.body;
  try {
    const existing = await pool.query('SELECT * FROM lessons WHERE id = $1', [req.params.id]);
    if (!existing.rows.length) return res.status(404).json({ error: 'Lesson not found' });

    let video_url = existing.rows[0].video_url;
    let video_filename = existing.rows[0].video_filename;
    let video_size_mb = existing.rows[0].video_size_mb;

    if (req.file) {
      // Remove old video file
      if (existing.rows[0].video_url) {
        const oldPath = path.join(__dirname, '..', existing.rows[0].video_url);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      video_url = `/uploads/videos/${req.file.filename}`;
      video_filename = req.file.originalname;
      video_size_mb = (req.file.size / (1024 * 1024)).toFixed(2);
    }

    const { rows } = await pool.query(`
      UPDATE lessons SET title = COALESCE($1, title), lesson_date = COALESCE($2, lesson_date),
        description = COALESCE($3, description), video_url = $4, video_filename = $5, video_size_mb = $6
      WHERE id = $7 RETURNING *
    `, [title, lesson_date, description, video_url, video_filename, video_size_mb, req.params.id]);

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/lessons/:id
router.delete('/:id', auth, requireRole('teacher', 'admin'), async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT video_url FROM lessons WHERE id = $1', [req.params.id]);
    if (rows[0]?.video_url) {
      const filePath = path.join(__dirname, '..', rows[0].video_url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await pool.query('DELETE FROM lessons WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/lessons/:id/progress - save watch progress
router.post('/:id/progress', auth, async (req, res) => {
  const { watched_seconds, completed } = req.body;
  try {
    await pool.query(`
      INSERT INTO video_watch_progress (lesson_id, student_id, watched_seconds, completed, last_watched)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (lesson_id, student_id) DO UPDATE SET
        watched_seconds = GREATEST(video_watch_progress.watched_seconds, $3),
        completed = $4, last_watched = NOW()
    `, [req.params.id, req.user.id, watched_seconds || 0, completed || false]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/lessons/:id/homework - teacher adds homework to lesson
router.post('/:id/homework', auth, requireRole('teacher', 'admin'), async (req, res) => {
  const { title, description, due_date } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  try {
    const { rows } = await pool.query(`
      INSERT INTO homework (lesson_id, title, description, due_date, created_by)
      VALUES ($1,$2,$3,$4,$5) RETURNING *
    `, [req.params.id, title, description, due_date, req.user.id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
