import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../../context/LangContext';
import api from '../../utils/api';
import { CalendarCheck, BookOpen, ChevronRight } from 'lucide-react';

export default function TeacherAttendance() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lessonsLoading, setLessonsLoading] = useState(false);

  useEffect(() => {
    api.get('/groups/my').then(r => {
      setGroups(Array.isArray(r.data) ? r.data : []);
    }).catch(() => setGroups([])).finally(() => setLoading(false));
  }, []);

  const selectGroup = (g) => {
    setSelectedGroup(g);
    setLessonsLoading(true);
    api.get(`/groups/${g.id}/lessons`).then(r => {
      setLessons(Array.isArray(r.data) ? r.data : []);
    }).catch(() => setLessons([])).finally(() => setLessonsLoading(false));
  };

  return (
    <div>
      <div className="mb-24">
        <div className="page-title">{t('attendance')}</div>
        <div className="page-subtitle">Guruhni tanlang, so'ngra darsni</div>
      </div>

      <div className="grid-2">
        {/* Groups */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
            Guruhlar
          </div>
          {loading ? (
            <div className="loading-screen"><div className="spinner" /></div>
          ) : groups.length === 0 ? (
            <div className="card card-p" style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
              Guruhlar yo'q
            </div>
          ) : groups.map(g => (
            <div key={g.id}
              onClick={() => selectGroup(g)}
              className="card"
              style={{
                padding: '14px 18px', marginBottom: 8, cursor: 'pointer',
                border: selectedGroup?.id === g.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                background: selectedGroup?.id === g.id ? 'var(--primary-light)' : 'white',
                transition: 'all 0.15s',
              }}>
              <div className="flex-between">
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{g.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{g.direction} · {g.student_count || 0} o'quvchi</div>
                </div>
                <ChevronRight size={15} color={selectedGroup?.id === g.id ? 'var(--primary)' : 'var(--muted)'} />
              </div>
            </div>
          ))}
        </div>

        {/* Lessons */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
            {selectedGroup ? `${selectedGroup.name} — Darslar` : 'Darslar'}
          </div>

          {!selectedGroup ? (
            <div className="card card-p" style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, padding: 40 }}>
              <CalendarCheck size={32} style={{ opacity: 0.3, margin: '0 auto 10px' }} />
              <div>Avval guruhni tanlang</div>
            </div>
          ) : lessonsLoading ? (
            <div className="loading-screen"><div className="spinner" /></div>
          ) : lessons.length === 0 ? (
            <div className="card card-p" style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, padding: 40 }}>
              <BookOpen size={32} style={{ opacity: 0.3, margin: '0 auto 10px' }} />
              <div>Darslar yo'q</div>
            </div>
          ) : lessons.map(l => (
            <div key={l.id}
              onClick={() => navigate(`/teacher/groups/${selectedGroup.id}/lessons/${l.id}`)}
              className="card"
              style={{ padding: '14px 18px', marginBottom: 8, cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseOver={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
              onMouseOut={e => e.currentTarget.style.boxShadow = ''}>
              <div className="flex-between">
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{l.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                    {l.lesson_date ? new Date(l.lesson_date).toLocaleDateString('uz-UZ', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {l.video_url && <span className="badge badge-green" style={{ fontSize: 10 }}>Video</span>}
                  {l.homework_id && <span className="badge badge-blue" style={{ fontSize: 10 }}>HW</span>}
                  <ChevronRight size={15} color="var(--muted)" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
