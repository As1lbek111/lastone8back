import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../../context/LangContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { Trophy, TrendingUp, BookOpen, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

const DAYS_UZ = ['Ya','Du','Se','Ch','Pa','Ju','Sh'];
const MONTHS_UZ = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];

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
        <button onClick={prev} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}><ChevronLeft size={16} /></button>
        <span style={{ fontSize: 14, fontWeight: 600 }}>{MONTHS_UZ[month]} {year}</span>
        <button onClick={next} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}><ChevronRight size={16} /></button>
      </div>
      <div className="cal-grid" style={{ marginBottom: 4 }}>
        {DAYS_UZ.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 10.5, color: 'var(--muted)', fontWeight: 600 }}>{d}</div>)}
      </div>
      <div className="cal-grid">
        {cells.map((d, i) => {
          if (!d) return <div key={`e${i}`} />;
          const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          const key = `${year}-${pad(month + 1)}-${pad(d)}`;
          return (
            <div key={d} className={`cal-day ${isToday ? 'today' : ''} ${dotSet.has(key) ? 'has-dot' : ''}`} style={{ fontSize: 12 }}>
              {d}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DonutChart({ value = 0, color = '#2563eb', size = 80 }) {
  const r = 28; const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(100, value) / 100) * circ;
  return (
    <svg width={size} height={size} viewBox="0 0 70 70">
      <circle cx="35" cy="35" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
      <circle cx="35" cy="35" r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        transform="rotate(-90 35 35)" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      <text x="35" y="40" textAnchor="middle" fontSize="13" fontWeight="800" fill="#0f172a">{value}%</text>
    </svg>
  );
}

export default function StudentDashboard() {
  const { t } = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [groups, setGroups] = useState([]);
  const [dots, setDots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/users/dashboard'),
      api.get('/groups/my'),
    ]).then(([dash, grps]) => {
      setData(dash.data);
      const g = Array.isArray(grps.data) ? grps.data : [];
      setGroups(g);
      const allDots = [];
      Promise.all(g.map(grp =>
        api.get(`/groups/${grp.id}/lessons`).then(lr => {
          (Array.isArray(lr.data) ? lr.data : []).forEach(l => { if (l.lesson_date) allDots.push(l.lesson_date); });
        }).catch(() => {})
      )).then(() => setDots([...allDots]));
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner" /> {t('loading')}</div>;

  const xp = data?.xp || 0;
  const level = data?.level || 1;
  const xpForNext = data?.xp_for_next || 300;
  const xpPct = Math.min(100, Math.round((xp / xpForNext) * 100));

  return (
    <div>
      <div className="flex-between mb-24">
        <div>
          <div className="page-title">Salom, {user?.first_name}! 👋</div>
          <div className="page-subtitle">Bugungi o'quv holatingiz</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'var(--accent-light)', border: '1px solid #fde68a', borderRadius: 10 }}>
          <span style={{ fontSize: 18 }}>💎</span>
          <span style={{ fontWeight: 700, fontSize: 16, fontFamily: 'JetBrains Mono, monospace' }}>
            {(data?.user?.coins || 0).toLocaleString()}
          </span>
        </div>
      </div>

      {/* XP + stats */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {/* XP card */}
        <div className="card" style={{ padding: 20, gridColumn: 'span 1' }}>
          <div className="stat-label">XP Ball · Daraja {level}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
            <div>
              <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--primary)', fontFamily: 'JetBrains Mono, monospace' }}>{xp}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>/ {xpForNext} XP</div>
            </div>
            <div style={{ flex: 1 }}>
              <div className="xp-bar">
                <div className="xp-fill" style={{ width: `${xpPct}%` }} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, textAlign: 'right' }}>{xpPct}%</div>
            </div>
          </div>
        </div>

        {/* Rating */}
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: '#fffbeb' }}><Trophy size={20} color="#f59e0b" /></div>
          <div className="stat-label">Reyting</div>
          <div className="stat-value" style={{ color: '#f59e0b' }}>#{data?.rating_position || '—'}</div>
        </div>

        {/* Groups */}
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: '#eff6ff' }}><BookOpen size={20} color="#2563eb" /></div>
          <div className="stat-label">Guruhlarim</div>
          <div className="stat-value" style={{ color: '#2563eb' }}>{groups.length}</div>
        </div>
      </div>

      <div className="grid-2">
        {/* Groups */}
        <div className="card">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }} className="flex-between">
            <div className="fw-600" style={{ fontSize: 15 }}>{t('myGroups')}</div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/student/groups')}
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {t('all')} <ArrowRight size={13} />
            </button>
          </div>
          {groups.length === 0 ? (
            <div className="empty-state" style={{ padding: 32 }}>
              <BookOpen size={32} style={{ opacity: 0.3 }} />
              <div>Guruh yo'q</div>
            </div>
          ) : groups.slice(0, 4).map(g => (
            <div key={g.id} style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
              onClick={() => navigate(`/student/groups/${g.id}`)}>
              <div className="flex-between">
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{g.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                    {g.teacher_name ? `👤 ${g.teacher_name}` : g.direction || '—'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span className={`badge ${g.is_active ? 'badge-green' : 'badge-gray'}`} style={{ fontSize: 10 }}>
                    {g.is_active ? 'Faol' : 'Tugagan'}
                  </span>
                  <ChevronRight size={14} color="var(--muted)" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Calendar */}
        <div className="card card-p">
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16 }}>Dars kalendari</div>
          <MiniCalendar dots={dots} />
          {data?.today_lessons?.length > 0 && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                Bugungi darslar
              </div>
              {data.today_lessons.map((l, i) => (
                <div key={i} style={{ fontSize: 13, fontWeight: 500, padding: '6px 0', borderBottom: i < data.today_lessons.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  📚 {l.title}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
