const router = require('express').Router();
const { pool } = require('../db');
const { auth, requireRole } = require('../middleware/auth');
const { uploadHomework } = require('../middleware/upload');

// POST /api/homework/:id/submit
router.post('/:id/submit', auth, requireRole('student'), uploadHomework.array('files', 5), async (req, res) => {
  const { comment } = req.body;
  const client = await pool.connect();
  try {
    const hwCheck = await client.query(`
      SELECT h.*, l.group_id, l.title AS lesson_title FROM homework h
      JOIN lessons l ON l.id = h.lesson_id WHERE h.id = $1
    `, [req.params.id]);
    if (!hwCheck.rows.length) return res.status(404).json({ error: 'Homework not found' });

    const inGroup = await client.query(
      'SELECT 1 FROM group_students WHERE group_id = $1 AND student_id = $2',
      [hwCheck.rows[0].group_id, req.user.id]
    );
    if (!inGroup.rows.length) return res.status(403).json({ error: 'Not in this group' });

    const file_urls = req.files?.map(f => `/uploads/homework/${f.filename}`) || [];
    const file_names = req.files?.map(f => f.originalname) || [];

    const { rows } = await client.query(`
      INSERT INTO homework_submissions (homework_id, student_id, file_urls, file_names, comment, submission_status)
      VALUES ($1,$2,$3,$4,$5,'waiting')
      ON CONFLICT (homework_id, student_id) DO UPDATE SET
        file_urls=$3, file_names=$4, comment=$5, submitted_at=NOW(), submission_status='waiting'
      RETURNING *
    `, [req.params.id, req.user.id, file_urls, file_names, comment]);

    await client.query('UPDATE users SET xp = xp + 5 WHERE id = $1', [req.user.id]);

    const teacherRes = await client.query(`SELECT teacher_id FROM groups WHERE id = $1`, [hwCheck.rows[0].group_id]);
    if (teacherRes.rows[0]?.teacher_id) {
      const studentRes = await client.query('SELECT first_name, last_name FROM users WHERE id = $1', [req.user.id]);
      const s = studentRes.rows[0];
      await client.query(`INSERT INTO notifications (user_id,type,title,body,link) VALUES ($1,'homework_submitted',$2,$3,$4)`,
        [teacherRes.rows[0].teacher_id, `Yangi topshirish: ${hwCheck.rows[0].title}`,
         `${s.first_name} ${s.last_name} uy vazifasini topshirdi`, `/teacher/homework/${req.params.id}`]);
    }

    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
  finally { client.release(); }
});

// GET /api/homework/:id/submissions
router.get('/:id/submissions', auth, requireRole('teacher', 'admin'), async (req, res) => {
  const { status } = req.query;
  try {
    let where = 'hs.homework_id = $1';
    const params = [req.params.id];
    if (status && status !== 'all') { where += ` AND hs.submission_status = $2`; params.push(status); }
    const { rows } = await pool.query(`
      SELECT hs.*, u.first_name, u.last_name, u.avatar_url, u.xp AS student_xp, u.coins AS student_coins
      FROM homework_submissions hs JOIN users u ON u.id = hs.student_id
      WHERE ${where} ORDER BY hs.submitted_at DESC
    `, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/homework/:id/submissions/counts
router.get('/:id/submissions/counts', auth, requireRole('teacher', 'admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT submission_status, COUNT(*)::int AS count FROM homework_submissions WHERE homework_id=$1 GROUP BY submission_status`,
      [req.params.id]
    );
    const counts = { waiting: 0, returned: 0, accepted: 0, failed: 0 };
    rows.forEach(r => { counts[r.submission_status] = r.count; });
    const totalRes = await pool.query(`
      SELECT COUNT(*)::int AS total FROM group_students gs
      JOIN homework h ON h.id=$1 JOIN lessons l ON l.id=h.lesson_id
      WHERE gs.group_id=l.group_id
    `, [req.params.id]);
    counts.total = totalRes.rows[0]?.total || 0;
    res.json(counts);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/homework/:id/grade/:student_id
router.put('/:id/grade/:student_id', auth, requireRole('teacher', 'admin'), async (req, res) => {
  const { grade, teacher_feedback, submission_status } = req.body;
  if (grade === undefined) return res.status(400).json({ error: 'Grade required' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const xp = Math.round(grade / 25);
    const coins = grade >= 80 ? Math.round(grade / 3) : Math.round(grade / 6);
    const status = submission_status || (grade >= 60 ? 'accepted' : 'returned');

    const { rows } = await client.query(`
      UPDATE homework_submissions SET grade=$1, teacher_feedback=$2, graded_at=NOW(),
        checked_at=NOW(), submission_status=$3, xp_awarded=$4, coins_awarded=$5
      WHERE homework_id=$6 AND student_id=$7 RETURNING *
    `, [grade, teacher_feedback, status, xp, coins, req.params.id, req.params.student_id]);

    if (!rows.length) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Not found' }); }

    await client.query('UPDATE users SET xp=xp+$1, coins=coins+$2 WHERE id=$3', [xp, coins, req.params.student_id]);

    const hwRes = await client.query('SELECT title FROM homework WHERE id=$1', [req.params.id]);
    await client.query(`INSERT INTO notifications (user_id,type,title,body) VALUES ($1,'homework_graded',$2,$3)`,
      [req.params.student_id, `Uy vazifangiz baholandi: ${hwRes.rows[0]?.title}`,
       `Ball: ${grade}/100 · XP: +${xp} · Kumush: +${coins}`]);

    await client.query('COMMIT');
    res.json({ ...rows[0], xp_awarded: xp, coins_awarded: coins });
  } catch (err) { await client.query('ROLLBACK'); res.status(500).json({ error: err.message }); }
  finally { client.release(); }
});

// GET /api/homework/group/:groupId - homework list (image 4 style)
router.get('/group/:groupId', auth, requireRole('teacher', 'admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT h.*, l.title AS lesson_title, l.lesson_date,
        COUNT(DISTINCT hs.student_id)::int AS total_submitted,
        COUNT(DISTINCT CASE WHEN hs.submission_status='waiting' THEN hs.student_id END)::int AS waiting_count,
        COUNT(DISTINCT CASE WHEN hs.submission_status='returned' THEN hs.student_id END)::int AS returned_count,
        COUNT(DISTINCT CASE WHEN hs.submission_status='accepted' THEN hs.student_id END)::int AS accepted_count,
        COUNT(DISTINCT CASE WHEN hs.submission_status='failed' THEN hs.student_id END)::int AS failed_count,
        (SELECT COUNT(*)::int FROM group_students WHERE group_id=$1) AS group_size
      FROM homework h JOIN lessons l ON l.id=h.lesson_id
      LEFT JOIN homework_submissions hs ON hs.homework_id=h.id
      WHERE l.group_id=$1
      GROUP BY h.id, l.title, l.lesson_date
      ORDER BY h.created_at DESC
    `, [req.params.groupId]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/homework/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT h.*, l.title AS lesson_title, l.lesson_date, l.group_id FROM homework h JOIN lessons l ON l.id=h.lesson_id WHERE h.id=$1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
