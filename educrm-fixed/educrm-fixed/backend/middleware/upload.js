const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ensureDir = (dir) => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); };

const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/videos');
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `video_${Date.now()}${ext}`);
  }
});

const homeworkStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/homework');
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `hw_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`);
  }
});

const videoFilter = (req, file, cb) => {
  const allowed = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error('Only video files allowed'));
};

const homeworkFilter = (req, file, cb) => {
  const allowed = ['.pdf', '.doc', '.docx', '.zip', '.rar', '.jpg', '.jpeg', '.png', '.txt', '.js', '.ts', '.html', '.css'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error('File type not allowed'));
};

const maxVideoMB = parseInt(process.env.MAX_VIDEO_SIZE_MB || '500');
const maxHwMB = parseInt(process.env.MAX_HOMEWORK_SIZE_MB || '50');

const uploadVideo = multer({
  storage: videoStorage,
  fileFilter: videoFilter,
  limits: { fileSize: maxVideoMB * 1024 * 1024 }
});

const uploadHomework = multer({
  storage: homeworkStorage,
  fileFilter: homeworkFilter,
  limits: { fileSize: maxHwMB * 1024 * 1024 }
});

module.exports = { uploadVideo, uploadHomework };
