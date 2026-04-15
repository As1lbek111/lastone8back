import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { ClipboardCheck, Users, GraduationCap, ChevronRight, Search } from 'lucide-react';

export default function AdminAttendance() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('groups'); // 'groups' | 'teachers'

  useEffect(() => {
    Promise.all([
      api.get('/groups/my'),
      api.get('/users?role=teacher'),
    ]).then(([g, t]) => {
      setGroups(Array.isArray(g.data) ? g.data : []);
      const all = Array.isArray(t.data) ? t.data : t.data?.users || [];
      setTeachers(all);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const lower = q.toLowerCase();
  const filteredGroups = groups.filter(g =>
    g.name?.toLowerCase().includes(lower) ||
    g.teacher_name?.toLowerCase().includes(lower) ||
    g.direction?.toLowerCase().includes(lower)
  );
  const filteredTeachers = teachers.filter(t =>
    `${t.first_name} ${t.last_name}`.toLowerCase().includes(lower) ||
    t.phone?.includes(q)
  );

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div>
      <div className="flex-between mb-24">
        <div>
          <div className="page-title">Davomat boshqaruvi</div>
          <div className="page-subtitle">O'quvchi va o'qituvchi davomatlarini ko'rish va tahrirlash</div>
        </div>
      </div>

      {/* Search + Tabs */}
      <div className="card card-p mb-16" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input
            className="form-input"
            style={{ paddingLeft: 32, margin: 0 }}
            placeholder="Guruh yoki o'qituvchi nomi..."
            value={q}
            onChange={e => setQ(e.target.value)}
          />
        </div>
        <div className="tabs" style={{ width: 280 }}>
          <button className={`tab-btn ${tab === 'groups' ? 'active' : ''}`} onClick={() => setTab('groups')}>
            <GraduationCap size={13} style={{ marginRight: 5 }} /> Guruhlar ({groups.length})
          </button>
          <button className={`tab-btn ${tab === 'teachers' ? 'active' : ''}`} onClick={() => setTab('teachers')}>
            <Users size={13} style={{ marginRight: 5 }} /> O'qituvchilar ({teachers.length})
          </button>
        </div>
      </div>

      {/* Groups tab */}
      {tab === 'groups' && (
        <div className="card">
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 14, color: 'var(--muted)' }}>
            Guruhni bosing — o'quvchilar davomatini boshqarish
          </div>
          {filteredGroups.length === 0 ? (
            <div className="empty-state" style={{ padding: 48 }}>
              <ClipboardCheck size={40} style={{ opacity: 0.2 }} />
              <div>Guruhlar topilmadi</div>
            </div>
          ) : filteredGroups.map((g, i) => (
            <div
              key={g.id}
              onClick={() => navigate(`/admin/groups/${g.id}?tab=attendance`)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 20px',
                borderBottom: i < filteredGroups.length - 1 ? '1px solid var(--border)' : 'none',
                cursor: 'pointer',
                transition: 'background 0.1s',
              }}
              onMouseOver={e => e.currentTarget.style.background = 'var(--bg2)'}
              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{
                width: 42, height: 42, borderRadius: 10,
                background: 'var(--primary-light)', color: 'var(--primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 16, flexShrink: 0,
              }}>
                {g.name?.[0]?.toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{g.name}</div>
                <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>
                  {g.teacher_name || '—'} · {g.student_count || 0} ta o'quvchi
                  {g.direction && ` · ${g.direction}`}
                </div>
              </div>
              <span className={`badge ${g.is_active ? 'badge-green' : 'badge-gray'}`}>
                {g.is_active ? 'Faol' : 'Nofaol'}
              </span>
              <ChevronRight size={16} color="var(--muted)" />
            </div>
          ))}
        </div>
      )}

      {/* Teachers tab */}
      {tab === 'teachers' && (
        <div className="card">
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 14, color: 'var(--muted)' }}>
            O'qituvchini bosing — davomatini ko'rish va tahrirlash
          </div>
          {filteredTeachers.length === 0 ? (
            <div className="empty-state" style={{ padding: 48 }}>
              <Users size={40} style={{ opacity: 0.2 }} />
              <div>O'qituvchilar topilmadi</div>
            </div>
          ) : filteredTeachers.map((t, i) => (
            <div
              key={t.id}
              onClick={() => navigate(`/admin/teachers/${t.id}/attendance`)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 20px',
                borderBottom: i < filteredTeachers.length - 1 ? '1px solid var(--border)' : 'none',
                cursor: 'pointer', transition: 'background 0.1s',
              }}
              onMouseOver={e => e.currentTarget.style.background = 'var(--bg2)'}
              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
            >
              <div className="avatar" style={{ width: 42, height: 42, fontSize: 15, flexShrink: 0 }}>
                {t.first_name?.[0]}{t.last_name?.[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{t.first_name} {t.last_name}</div>
                <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>
                  {t.phone || '—'}
                  {t.direction && ` · ${t.direction}`}
                </div>
              </div>
              <ChevronRight size={16} color="var(--muted)" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
