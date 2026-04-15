import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLang } from '../../context/LangContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { ArrowLeft, BookOpen, CheckCircle, XCircle, Clock, ChevronRight } from 'lucide-react';

export default function StudentGroupDetail() {
  const { id } = useParams();
  const { t } = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [attStats, setAttStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [tab, setTab] = useState('lessons');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/groups/${id}`).catch(() => ({ data: null })),
      api.get(`/groups/${id}/lessons`).catch(() => ({ data: [] })),
      api.get(`/attendance/student/${user.id}/group/${id}`).catch(() => ({ data: null })),
      api.get(`/groups/${id}/students`).catch(() => ({ data: [] })),
    ]).then(([g, l, att, s]) => {
      setGroup(g.data);
      setLessons(Array.isArray(l.data) ? l.data : []);
      setAttStats(att.data);
      setStudents(Array.isArray(s.data) ? s.data : []);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading-screen"><div className="spinner" /> {t('loading')}</div>;

  const attPct = attStats?.stats?.pct || 0;

  return (
    <div>
      <div className="flex-row mb-24" style={{ gap: 16 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/student/groups')} style={{ padding: '6px 10px' }}>
          <ArrowLeft size={15} />
        </button>
        <div style={{ flex: 1 }}>
          <div className="page-title">{group?.name || 'Guruh'}</div>
          <div className="page-subtitle">{group?.direction} · {lessons.length} dars</div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
        <div className="card stat-card" style={{ padding: '14px 16px' }}>
          <div className="stat-label" style={{ fontSize: 11 }}>Jami darslar</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary)' }}>{lessons.length}</div>
        </div>
        <div className="card stat-card" style={{ padding: '14px 16px' }}>
          <div className="stat-label" style={{ fontSize: 11 }}>Keldim</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--green)' }}>{attStats?.stats?.present || 0}</div>
        </div>
        <div className="card stat-card" style={{ padding: '14px 16px' }}>
          <div className="stat-label" style={{ fontSize: 11 }}>Kech qoldim</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--orange)' }}>{attStats?.stats?.late || 0}</div>
        </div>
        <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div className="stat-label" style={{ fontSize: 11, marginBottom: 4 }}>Davomat</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: attPct >= 80 ? 'var(--green)' : attPct >= 60 ? 'var(--orange)' : 'var(--red)' }}>
            {attPct}%
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs mb-16" style={{ maxWidth: 320 }}>
        {[{ v: 'lessons', l: 'Darslar' }, { v: 'members', l: "A'zolar" }].map(tb => (
          <button key={tb.v} className={`tab-btn ${tab === tb.v ? 'active' : ''}`} onClick={() => setTab(tb.v)}>
            {tb.l}
          </button>
        ))}
      </div>

      {/* Lessons */}
      {tab === 'lessons' && (
        <div className="card">
          {lessons.length === 0 ? (
            <div className="empty-state" style={{ padding: 40 }}>
              <BookOpen size={36} style={{ opacity: 0.3 }} />
              <div>Darslar yo'q</div>
            </div>
          ) : lessons.map((l, i) => {
            const attRecord = attStats?.records?.find(r => r.lesson_id === l.id);
            const myStatus = attRecord?.status;
            return (
              <div key={l.id} style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}
                onClick={() => navigate(`/student/groups/${id}/lessons/${l.id}`)}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', flexShrink: 0 }}>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{l.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                    {l.lesson_date ? new Date(l.lesson_date).toLocaleDateString('uz-UZ', { weekday: 'short', month: 'short', day: 'numeric' }) : '—'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {l.video_url && <span className="badge badge-blue" style={{ fontSize: 10 }}>📹</span>}
                  {l.homework_id && (
                    <span className={`badge ${l.submission_id ? 'badge-green' : 'badge-orange'}`} style={{ fontSize: 10 }}>
                      {l.submission_id ? '✓ HW' : 'HW'}
                    </span>
                  )}
                  {myStatus && (
                    <span style={{ flexShrink: 0 }}>
                      {myStatus === 'present' && <CheckCircle size={15} color="var(--green)" />}
                      {myStatus === 'late' && <Clock size={15} color="var(--orange)" />}
                      {myStatus === 'absent' && <XCircle size={15} color="var(--red)" />}
                    </span>
                  )}
                  <ChevronRight size={14} color="var(--muted)" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Members */}
      {tab === 'members' && (
        <div className="card">
          {students.length === 0 ? (
            <div className="empty-state" style={{ padding: 40 }}>
              <div>A'zolar yo'q</div>
            </div>
          ) : students.map((s, i) => (
            <div key={s.id} style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)' }} className="flex-row gap-12">
              <div className="avatar" style={{ width: 36, height: 36, fontSize: 13, background: s.id === user?.id ? 'linear-gradient(135deg, var(--primary), #60a5fa)' : undefined }}>
                {s.first_name?.[0]}{s.last_name?.[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>
                  {s.first_name} {s.last_name}
                  {s.id === user?.id && <span style={{ fontSize: 11, color: 'var(--primary)', marginLeft: 6 }}>(Siz)</span>}
                </div>
              </div>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12.5, fontWeight: 700, color: 'var(--primary)' }}>
                {s.xp || 0} XP
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
