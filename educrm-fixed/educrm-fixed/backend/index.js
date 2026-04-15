const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { initDB } = require('./db');
const authRoutes = require('./routes/auth');
const groupRoutes = require('./routes/groups');
const lessonRoutes = require('./routes/lessons');
const homeworkRoutes = require('./routes/homework');
const userRoutes = require('./routes/users');
const notificationRoutes = require('./routes/notifications');
const attendanceRoutes = require('./routes/attendance');
const extrasRouter = require('./routes/extras');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5174',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/homework', homeworkRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api', extrasRouter); // /api/courses, /api/rooms

app.get('/api/health', (req, res) => res.json({ status: 'OK', ts: new Date() }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'File too large' });
  res.status(500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
initDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 EduCRM Server: http://localhost:${PORT}`));
});
