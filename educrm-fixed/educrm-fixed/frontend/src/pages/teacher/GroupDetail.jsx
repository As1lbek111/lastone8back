import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLang } from '../../context/LangContext';
import api from '../../utils/api';
import Modal from '../../components/ui/Modal';
import {
  ArrowLeft, Users, BookOpen, Plus, CalendarCheck,
  ChevronRight, CheckCircle, XCircle, Clock, FileText
} from 'lucide-react';

export default function TeacherGroupDetail() {
  const { id } = useParams();
  const { t } = useLang();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [students, setStudents] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [tab, setTab] = useState('students');
  const [loading, setLoading] = useState(true);

  // Lesson modal
  const [lessonModal, setLessonModal] = useState(false);
  const [lessonForm, setLessonForm] = useState({ title: '', lesson_date: '', description: '' });
  const [savingLesson, setSavingLesson] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get(`/groups/${id}`).catch(() => ({ data: null })),
      api.get(`/groups/${id}/students`).catch(() => ({ data: [] })),
      api.get(`/groups/${id}/lessons`).catch(() => ({ data: [] })),
    ]).then(([g, s, l]) => {
      setGroup(g.data);
      setStudents(Array.isArray(s.data) ? s.data : []);
      setLessons(Array.isArray(l.data) ? l.data : []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const addLesson = async () => {
    if (!lessonForm.title || !lessonForm.lesson_date) return;
    setSavingLesson(true);
    try {
      await api.post('/lessons', { ...lessonForm, group_id: id });
      setLessonModal(false);
      setLessonForm({ title: '', lesson_date: '', description: '' });
      load();
    } catch (err) { alert(err.response?.data?.error || 'Error'); }
    finally { setSavingLesson(false); }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /> {t('loading')}</div>;

  const presentCount = lessons.filter(l => l.attendance_count > 0).length;

  return (
    <div>
      {/* Header */}
      <div className="flex-row mb-24" style={{ gap: 16 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/teacher/groups')} style={{ padding: '6px 10px' }}>
          <ArrowLeft size={15} />
        </button>
        <div style={{ flex: 1 }}>
          <div className="page-title">{group?.name || 'Guruh'}</div>
          <div className="page-subtitle">{group?.direction} · {students.length} o'quvchi · {lessons.length} dars</div>
        </div>
        {tab === 'lessons' && (
          <button className="btn btn-primary" onClick={() => setLessonModal(true)}>
            <Plus size={15} /> {t('addLesson')}
          </button>
        )}
      </div>

      {/* Summary cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 24 }}>
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: '#eff6ff' }}><Users size={18} color="#2563eb" /></div>
          <div className="stat-label">O'quvchilar</div>
          <div className="stat-value" style={{ color: '#2563eb', fontSize: 24 }}>{students.length}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: '#ecfdf5' }}><BookOpen size={18} color="#10b981" /></div>
          <div className="stat-label">Darslar</div>
          <div className="stat-value" style={{ color: '#10b981', fontSize: 24 }}>{lessons.length}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: '#fffbeb' }}><CalendarCheck size={18} color="#f59e0b" /></div>
          <div className="stat-label">Boshlanish</div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>
            {group?.start_date ? new Date(group.start_date).toLocaleDateString('uz-UZ') : '—'}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs mb-16" style={{ maxWidth: 360 }}>
        {[
          { v: 'students', l: "O'quvchilar" },
          { v: 'lessons', l: "Darslar" },
          { v: 'attendance', l: "Davomat" },
        ].map(tab_ => (
          <button key={tab_.v} className={`tab-btn ${tab === tab_.v ? 'active' : ''}`} onClick={() => setTab(tab_.v)}>
            {tab_.l}
          </button>
        ))}
      </div>

      {/* Tab: Students */}
      {tab === 'students' && (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>{t('name')}</th>
                  <th>{t('phone')}</th>
                  <th>XP</th>
                  <th>Kumush</th>
                  <th>Qo'shilgan</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr><td colSpan={6}>
                    <div className="empty-state"><Users size={32} style={{ opacity: 0.3 }} /><div>O'quvchilar yo'q</div></div>
                  </td></tr>
                ) : students.map((s, i) => (
                  <tr key={s.id}>
                    <td style={{ color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{i + 1}</td>
                    <td>
                      <div className="flex-row gap-8">
                        <div className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
                          {s.first_name?.[0]}{s.last_name?.[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13.5 }}>{s.first_name} {s.last_name}</div>
                          {s.hh_id && <div style={{ fontSize: 11, color: 'var(--muted)' }}>ID: {s.hh_id}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12.5 }}>{s.phone}</td>
                    <td><span style={{ fontWeight: 700, color: 'var(--primary)', fontFamily: 'JetBrains Mono, monospace' }}>{s.xp || 0}</span></td>
                    <td><span style={{ fontWeight: 600, color: 'var(--accent)', fontFamily: 'JetBrains Mono, monospace' }}>💎 {s.coins || 0}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {s.joined_at ? new Date(s.joined_at).toLocaleDateString('uz-UZ') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Lessons */}
      {tab === 'lessons' && (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Dars nomi</th>
                  <th>Sana</th>
                  <th>Video</th>
                  <th>Uy vazifasi</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {lessons.length === 0 ? (
                  <tr><td colSpan={6}>
                    <div className="empty-state"><BookOpen size={32} style={{ opacity: 0.3 }} /><div>Darslar yo'q</div></div>
                  </td></tr>
                ) : lessons.map((l, i) => (
                  <tr key={l.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/teacher/groups/${id}/lessons/${l.id}`)}>
                    <td style={{ color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{i + 1}</td>
                    <td><div style={{ fontWeight: 600, fontSize: 13.5 }}>{l.title}</div></td>
                    <td style={{ fontSize: 13, color: 'var(--muted)' }}>
                      {l.lesson_date ? new Date(l.lesson_date).toLocaleDateString('uz-UZ') : '—'}
                    </td>
                    <td>
                      {l.video_url
                        ? <span className="badge badge-green">✓ Yuklangan</span>
                        : <span className="badge badge-gray">Yo'q</span>}
                    </td>
                    <td>
                      {l.homework_id
                        ? <span className="badge badge-blue">✓ Bor</span>
                        : <span className="badge badge-gray">Yo'q</span>}
                    </td>
                    <td><ChevronRight size={15} color="var(--muted)" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Attendance matrix */}
      {tab === 'attendance' && (
        <AttendanceMatrix groupId={id} students={students} />
      )}

      {/* Add Lesson Modal */}
      <Modal open={lessonModal} onClose={() => setLessonModal(false)} title={t('addLesson')}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setLessonModal(false)}>{t('cancel')}</button>
            <button className="btn btn-primary" onClick={addLesson} disabled={savingLesson}>
              {savingLesson ? t('loading') : t('save')}
            </button>
          </>
        }>
        <div className="form-group">
          <label className="form-label">{t('lessonTitle')}</label>
          <input className="form-input" value={lessonForm.title} onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })} placeholder="Masalan: Lesson 1 - Introduction" />
        </div>
        <div className="form-group">
          <label className="form-label">{t('lessonDate')}</label>
          <input type="date" className="form-input" value={lessonForm.lesson_date} onChange={e => setLessonForm({ ...lessonForm, lesson_date: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Tavsif</label>
          <textarea className="form-textarea" value={lessonForm.description} onChange={e => setLessonForm({ ...lessonForm, description: e.target.value })} />
        </div>
      </Modal>
    </div>
  );
}

function AttendanceMatrix({ groupId, students }) {
  const { t } = useLang();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/attendance/group/${groupId}`).then(r => setData(r.data)).catch(() => setData(null)).finally(() => setLoading(false));
  }, [groupId]);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!data) return <div className="empty-state card card-p"><div>Davomat ma'lumotlari topilmadi</div></div>;

  const { lessons, students: matStudents, matrix } = data;

  const statusIcon = (status) => {
    if (status === 'present') return <CheckCircle size={14} color="#10b981" />;
    if (status === 'late') return <Clock size={14} color="#f59e0b" />;
    return <XCircle size={14} color="#ef4444" />;
  };

  const statsBg = (status) => {
    if (status === 'present') return 'var(--green-light)';
    if (status === 'late') return 'var(--orange-light)';
    return 'var(--red-light)';
  };

  return (
    <div className="card" style={{ overflowX: 'auto' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>
        Davomat jadvali
        <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 400, marginLeft: 8 }}>
          {lessons.length} dars
        </span>
      </div>
      {lessons.length === 0 || matStudents.length === 0 ? (
        <div className="empty-state" style={{ padding: 40 }}>
          <CalendarCheck size={36} style={{ opacity: 0.3 }} />
          <div>Davomat ma'lumotlari yo'q</div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ minWidth: 600 }}>
            <thead>
              <tr>
                <th style={{ minWidth: 180 }}>O'quvchi</th>
                {lessons.map(l => (
                  <th key={l.id} style={{ textAlign: 'center', minWidth: 60, fontSize: 11 }}>
                    {new Date(l.lesson_date).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit' })}
                  </th>
                ))}
                <th style={{ textAlign: 'center' }}>Jami</th>
              </tr>
            </thead>
            <tbody>
              {matStudents.map(s => {
                const present = lessons.filter(l => matrix[s.id]?.[l.id] === 'present').length;
                const late = lessons.filter(l => matrix[s.id]?.[l.id] === 'late').length;
                const pct = lessons.length ? Math.round(((present + late * 0.5) / lessons.length) * 100) : 0;
                return (
                  <tr key={s.id}>
                    <td>
                      <div className="flex-row gap-8">
                        <div className="avatar" style={{ width: 28, height: 28, fontSize: 10 }}>
                          {s.first_name?.[0]}{s.last_name?.[0]}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{s.first_name} {s.last_name}</span>
                      </div>
                    </td>
                    {lessons.map(l => {
                      const status = matrix[s.id]?.[l.id] || 'absent';
                      return (
                        <td key={l.id} style={{ textAlign: 'center', background: statsBg(status), padding: '8px 0' }}>
                          {statusIcon(status)}
                        </td>
                      );
                    })}
                    <td style={{ textAlign: 'center' }}>
                      <span style={{
                        fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700,
                        color: pct >= 80 ? 'var(--green)' : pct >= 60 ? 'var(--accent)' : 'var(--red)',
                      }}>{pct}%</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 16, fontSize: 12, color: 'var(--muted)' }}>
        <div className="flex-row gap-6"><CheckCircle size={12} color="#10b981" /> Keldi</div>
        <div className="flex-row gap-6"><Clock size={12} color="#f59e0b" /> Kech qoldi</div>
        <div className="flex-row gap-6"><XCircle size={12} color="#ef4444" /> Kelmadi</div>
      </div>
    </div>
  );
}
