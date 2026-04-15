const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const initDB = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('student','teacher','admin')),
        birth_date DATE,
        gender VARCHAR(10),
        avatar_url VARCHAR(255),
        hh_id VARCHAR(50) UNIQUE,
        xp INTEGER DEFAULT 0,
        coins INTEGER DEFAULT 0,
        rating_position INTEGER,
        language VARCHAR(5) DEFAULT 'uz',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS groups (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        direction VARCHAR(100),
        teacher_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        start_date DATE,
        end_date DATE,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS group_students (
        id SERIAL PRIMARY KEY,
        group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
        student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        joined_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(group_id, student_id)
      );

      CREATE TABLE IF NOT EXISTS courses (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL UNIQUE,
        description TEXT,
        direction VARCHAR(100),
        price NUMERIC(12,2) DEFAULT 0,
        duration_months INTEGER DEFAULT 3,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS rooms (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        capacity INTEGER DEFAULT 20,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS lessons (
        id SERIAL PRIMARY KEY,
        group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        lesson_date DATE NOT NULL,
        video_url VARCHAR(500),
        video_filename VARCHAR(255),
        video_size_mb DECIMAL(10,2),
        duration_seconds INTEGER,
        description TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS homework (
        id SERIAL PRIMARY KEY,
        lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        due_date TIMESTAMP,
        max_files INTEGER DEFAULT 5,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS homework_submissions (
        id SERIAL PRIMARY KEY,
        homework_id INTEGER REFERENCES homework(id) ON DELETE CASCADE,
        student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        file_urls TEXT[],
        file_names TEXT[],
        comment TEXT,
        grade INTEGER,
        teacher_feedback TEXT,
        submitted_at TIMESTAMP DEFAULT NOW(),
        graded_at TIMESTAMP,
        submission_status VARCHAR(20) DEFAULT 'waiting'
          CHECK (submission_status IN ('waiting','returned','accepted','failed')),
        xp_awarded INTEGER DEFAULT 0,
        coins_awarded INTEGER DEFAULT 0,
        checked_at TIMESTAMP,
        UNIQUE(homework_id, student_id)
      );

      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
        student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'absent' CHECK (status IN ('present','absent','late')),
        marked_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(lesson_id, student_id)
      );

      CREATE TABLE IF NOT EXISTS video_watch_progress (
        id SERIAL PRIMARY KEY,
        lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
        student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        watched_seconds INTEGER DEFAULT 0,
        completed BOOLEAN DEFAULT false,
        last_watched TIMESTAMP DEFAULT NOW(),
        UNIQUE(lesson_id, student_id)
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        body TEXT,
        link VARCHAR(255),
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS teacher_attendance (
        id SERIAL PRIMARY KEY,
        teacher_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'present' CHECK (status IN ('present','absent','late')),
        minutes_late INTEGER DEFAULT 0,
        marked_at TIMESTAMP DEFAULT NOW(),
        marked_by INTEGER REFERENCES users(id),
        UNIQUE(teacher_id, lesson_id)
      );

      ALTER TABLE attendance ADD COLUMN IF NOT EXISTS minutes_late INTEGER DEFAULT 0;
    `);

    // Seed demo users if not exist
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('password123', 10);

    await client.query(`
      INSERT INTO users (first_name, last_name, phone, password_hash, role, hh_id, xp, coins)
      VALUES
        ('Admin','User','+998900000001','${hash}','admin',null,0,0),
        ('Aziz','Karimov','+998901234567','${hash}','teacher','10001',0,0),
        ('Asilbek','Mamadiyev','+998909748762','${hash}','student','10944',942,2987)
      ON CONFLICT (phone) DO NOTHING;

      INSERT INTO groups (name, direction, teacher_id, start_date, is_active)
      SELECT 'Bootcamp Full Stack N25', 'Programming', u.id, '2025-12-30', true
      FROM users u WHERE u.phone = '+998901234567'
      ON CONFLICT DO NOTHING;

      INSERT INTO group_students (group_id, student_id)
      SELECT g.id, u.id FROM groups g, users u
      WHERE g.name = 'Bootcamp Full Stack N25' AND u.phone = '+998909748762'
      ON CONFLICT DO NOTHING;
    `);

    console.log('✅ Database initialized');
  } catch (err) {
    console.error('DB init error:', err.message);
  } finally {
    client.release();
  }
};

module.exports = { pool, initDB };
