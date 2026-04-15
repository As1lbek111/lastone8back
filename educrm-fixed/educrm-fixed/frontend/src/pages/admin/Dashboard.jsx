import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../../context/LangContext';
import api from '../../utils/api';
import { GraduationCap, Users, BookOpen, ClipboardList, TrendingUp, ArrowRight } from 'lucide-react';

function StatCard({ icon, label, value, color, bg, trend, onClick }) {
  return (
    <div className="card stat-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default', transition: 'transform 0.15s, box-shadow 0.15s' }}
      onMouseOver={e => { if (onClick) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; } }}
      onMouseOut={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
      <div className="stat-icon" style={{ background: bg }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color }}>{value ?? '—'}</div>
      {trend && <div className="stat-trend">↑ {trend}</div>}
    </div>
  );
}

export default function AdminDashboard() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [recentStudents, setRecentStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/users?role=student&limit=100').catch(() => ({ data: [] })),
      api.get('/users?role=teacher&limit=100').catch(() => ({ data: [] })),
      api.get('/groups/my').catch(() => ({ data: [] })),
      api.get('/courses').catch(() => ({ data: [] })),
    ]).then(([students, teachers, grps, courses]) => {
      const s = Array.isArray(students.data) ? students.data : students.data?.users || [];
      const te = Array.isArray(teachers.data) ? teachers.data : teachers.data?.users || [];
      const g = Array.isArray(grps.data) ? grps.data : [];
      const c = Array.isArray(courses.data) ? courses.data : [];
      setStats({ students: s.length, teachers: te.length, groups: g.length, courses: c.length });
      setRecentStudents(s.slice(0, 5));
      setGroups(g.slice(0, 6));
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner" /> {t('loading')}
    </div>
  );

  return (
    <div>
      <div className="flex-between mb-24">
        <div>
          <div className="page-title">Bosh sahifa</div>
          <div className="page-subtitle">EduCRM boshqaruv paneli</div>
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>
          {new Date().toLocaleDateString('uz-UZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard
          icon={<GraduationCap size={20} />} label={t('totalStudents')}
          value={stats.students} color="#2563eb" bg="#eff6ff"
          onClick={() => navigate('/admin/students')}
        />
        <StatCard
          icon={<Users size={20} />} label={t('totalTeachers')}
          value={stats.teachers} color="#8b5cf6" bg="#f5f3ff"
          onClick={() => navigate('/admin/teachers')}
        />
        <StatCard
          icon={<BookOpen size={20} />} label={t('totalGroups')}
          value={stats.groups} color="#10b981" bg="#ecfdf5"
          onClick={() => navigate('/admin/groups')}
        />
        <StatCard
          icon={<ClipboardList size={20} />} label={t('totalCourses')}
          value={stats.courses} color="#f59e0b" bg="#fffbeb"
          onClick={() => navigate('/admin/courses')}
        />
      </div>

      <div className="grid-2">
        {/* Recent Students */}
        <div className="card">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }} className="flex-between">
            <div className="fw-600" style={{ fontSize: 15 }}>{t('students')}</div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/students')}
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {t('all')} <ArrowRight size={13} />
            </button>
          </div>
          <div>
            {recentStudents.length === 0 ? (
              <div className="empty-state" style={{ padding: 32 }}>
                <div className="empty-state-icon">📚</div>
                <div className="empty-state-text">O'quvchilar yo'q</div>
              </div>
            ) : recentStudents.map(s => (
              <div key={s.id} className="flex-row" style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
                <div className="avatar" style={{ width: 36, height: 36, fontSize: 13 }}>
                  {s.first_name?.[0]}{s.last_name?.[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{s.first_name} {s.last_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{s.phone}</div>
                </div>
                <span className="badge badge-blue" style={{ fontSize: 11 }}>{s.xp || 0} XP</span>
              </div>
            ))}
          </div>
        </div>

        {/* Groups overview */}
        <div className="card">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }} className="flex-between">
            <div className="fw-600" style={{ fontSize: 15 }}>{t('groups')}</div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/groups')}
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {t('all')} <ArrowRight size={13} />
            </button>
          </div>
          <div>
            {groups.length === 0 ? (
              <div className="empty-state" style={{ padding: 32 }}>
                <div className="empty-state-icon">📘</div>
                <div className="empty-state-text">Guruhlar yo'q</div>
              </div>
            ) : groups.map(g => (
              <div key={g.id} style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
                <div className="flex-between">
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{g.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{g.direction || '—'}</div>
                  </div>
                  <span className={`badge ${g.is_active ? 'badge-green' : 'badge-gray'}`}>
                    {g.is_active ? t('active') : t('inactive')}
                  </span>
                </div>
                <div style={{ marginTop: 8 }}>
                  <div className="progress">
                    <div className="progress-bar" style={{
                      width: `${Math.min(100, ((g.student_count || 0) / 20) * 100)}%`,
                      background: 'var(--primary)',
                    }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                    {g.student_count || 0} / 20 {t('students')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
