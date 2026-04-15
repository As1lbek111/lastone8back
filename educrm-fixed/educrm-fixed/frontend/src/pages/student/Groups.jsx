import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../../context/LangContext';
import api from '../../utils/api';
import { BookOpen, Users, ChevronRight } from 'lucide-react';

export default function StudentGroups() {
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
          <div>Siz hech qanday guruhga qo'shilmagansiz</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {groups.map(g => (
            <div key={g.id} className="card"
              style={{ padding: 20, cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
              onClick={() => navigate(`/student/groups/${g.id}`)}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
              onMouseOut={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
              <div className="flex-between" style={{ marginBottom: 12 }}>
                <span className={`badge ${g.is_active ? 'badge-green' : 'badge-gray'}`}>
                  {g.is_active ? 'Faol' : 'Tugagan'}
                </span>
                <ChevronRight size={16} color="var(--muted)" />
              </div>

              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{g.name}</div>
              <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 14 }}>{g.direction || '—'}</div>

              {g.teacher_name && (
                <div className="flex-row gap-8" style={{ marginBottom: 12 }}>
                  <div className="avatar" style={{ width: 26, height: 26, fontSize: 9, background: 'linear-gradient(135deg, #7c3aed, #a78bfa)' }}>
                    {g.teacher_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <span style={{ fontSize: 12.5, color: 'var(--text2)', fontWeight: 500 }}>{g.teacher_name}</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: 16, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <div className="flex-row gap-6">
                  <Users size={13} color="var(--muted)" />
                  <span style={{ fontSize: 12.5, fontWeight: 600 }}>{g.student_count || 0}</span>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>o'quvchi</span>
                </div>
                {g.start_date && (
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {new Date(g.start_date).toLocaleDateString('uz-UZ')}
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
