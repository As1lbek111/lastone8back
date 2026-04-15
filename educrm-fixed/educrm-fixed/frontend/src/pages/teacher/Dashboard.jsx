import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../../context/LangContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { BookOpen, Users, CalendarCheck, ClipboardCheck, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

const MONTHS_UZ = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
const DAYS_UZ = ['Ya','Du','Se','Ch','Pa','Ju','Sh'];

function MiniCalendar({ dots = [] }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dotSet = new Set(dots.map(d => d?.slice(0, 10)).filter(Boolean));
  const prev = () => month === 0 ? (setMonth(11), setYear(y => y - 1)) : setMonth(m => m - 1);
  const next = () => month === 11 ? (setMonth(0), setYear(y => y + 1)) : setMonth(m => m + 1);
  const pad = n => String(n).padStart(2, '0');
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: 12 }}>
        <button onClick={prev} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}>
          <ChevronLeft size={16} />
        </button>
        <span style={{ fontSize: 14, fontWeight: 600 }}>{MONTHS_UZ[month]} {year}</span>
        <button onClick={next} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}>
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="cal-grid" style={{ marginBottom: 4 }}>
        {DAYS_UZ.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 10.5, color: 'var(--muted)', fontWeight: 600, padding: '2px 0' }}>{d}</div>)}
      </div>
      <div className="cal-grid">
        {cells.map((d, i) => {
          if (!d) return <div key={`e${i}`} />;
          const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          const key = `${year}-${pad(month + 1)}-${pad(d)}`;
          return (
            <div key={d} className={`cal-day ${isToday ? 'today' : ''} ${dotSet.has(key) ? 'has-dot' : ''}`}
              style={{ fontSize: 12.5 }}>
              {d}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TeacherDashboard() {
  const { t } = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [dots, setDots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/groups/my').then(r => {
      const g = Array.isArray(r.data) ? r.data : [];
      setGroups(g);
      const allDots = [];
      Promise.all(g.map(grp =>
        api.get(`/groups/${grp.id}/lessons`).then(lr => {
          (Array.isArray(lr.data) ? lr.data : []).forEach(l => {
            if (l.lesson_date) allDots.push(l.lesson_date);
          });
        }).catch(() => {})
      )).then(() => setDots([...allDots]));
    }).catch(() => setGroups([])).finally(() => setLoading(false));
  }, []);

  const totalStudents = groups.reduce((s, g) => s + (parseInt(g.student_count) || 0), 0);

  return (
    <div>
      <div className="flex-between mb-24">
        <div>
          <div className="page-title">Xush kelibsiz, {user?.first_name}! 👋</div>
          <div className="page-subtitle">Bugungi ish jadvali</div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: '#eff6ff' }}><BookOpen size={20} color="#2563eb" /></div>
          <div className="stat-label">Guruhlarim</div>
          <div className="stat-value" style={{ color: '#2563eb' }}>{groups.length}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: '#f5f3ff' }}><Users size={20} color="#7c3aed" /></div>
          <div className="stat-label">Jami o'quvchilar</div>
          <div className="stat-value" style={{ color: '#7c3aed' }}>{totalStudents}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: '#ecfdf5' }}><CalendarCheck size={20} color="#10b981" /></div>
          <div className="stat-label">Bu oylik darslar</div>
          <div className="stat-value" style={{ color: '#10b981' }}>{dots.length}</div>
        </div>
      </div>

      <div className="grid-2">
        {/* Groups list */}
        <div className="card">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }} className="flex-between">
            <div className="fw-600" style={{ fontSize: 15 }}>Mening guruhlarim</div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/teacher/groups')}
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {t('all')} <ArrowRight size={13} />
            </button>
          </div>
          {loading ? (
            <div className="loading-screen" style={{ minHeight: 100 }}><div className="spinner" /></div>
          ) : groups.length === 0 ? (
            <div className="empty-state" style={{ padding: 32 }}>
              <BookOpen size={32} style={{ opacity: 0.3 }} />
              <div>Guruhlar yo'q</div>
            </div>
          ) : groups.map(g => (
            <div key={g.id} style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
              onClick={() => navigate(`/teacher/groups/${g.id}`)}>
              <div className="flex-between">
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{g.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{g.direction || '—'}</div>
                </div>
                <div className="flex-row gap-8">
                  <span className="badge badge-blue" style={{ fontSize: 11 }}>
                    <Users size={10} /> {g.student_count || 0}
                  </span>
                  <span className={`badge ${g.is_active ? 'badge-green' : 'badge-gray'}`} style={{ fontSize: 11 }}>
                    {g.is_active ? t('active') : t('inactive')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Calendar */}
        <div className="card card-p">
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16 }}>Dars kalendari</div>
          <MiniCalendar dots={dots} />
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--muted)' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
              Dars o'tilgan kunlar
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
