import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../../context/LangContext';
import api from '../../utils/api';
import { BookOpen, Users, ArrowRight, CalendarCheck } from 'lucide-react';

export default function TeacherGroups() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/groups/my').then(r => {
      setGroups(Array.isArray(r.data) ? r.data : []);
    }).catch(() => setGroups([])).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner" /> {t('loading')}</div>;

  return (
    <div>
      <div className="mb-24">
        <div className="page-title">{t('myGroups')}</div>
        <div className="page-subtitle">{groups.length} ta guruh</div>
      </div>

      {groups.length === 0 ? (
        <div className="empty-state card card-p" style={{ padding: 60 }}>
          <BookOpen size={48} style={{ opacity: 0.2 }} />
          <div>Sizga guruh biriktirilmagan</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {groups.map(g => (
            <div key={g.id} className="card" style={{ padding: 20, cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
              onClick={() => navigate(`/teacher/groups/${g.id}`)}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
              onMouseOut={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
              <div className="flex-between" style={{ marginBottom: 14 }}>
                <span className={`badge ${g.is_active ? 'badge-green' : 'badge-gray'}`}>
                  {g.is_active ? t('active') : t('inactive')}
                </span>
                <ArrowRight size={15} color="var(--muted)" />
              </div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{g.name}</div>
              <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 14 }}>{g.direction || '—'}</div>

              <div style={{ display: 'flex', gap: 16, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                <div className="flex-row gap-6">
                  <Users size={14} color="var(--muted)" />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{g.student_count || 0}</span>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>o'quvchi</span>
                </div>
                {g.start_date && (
                  <div className="flex-row gap-6">
                    <CalendarCheck size={14} color="var(--muted)" />
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {new Date(g.start_date).toLocaleDateString('uz-UZ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
