import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLang } from '../../context/LangContext';
import api from '../../utils/api';
import Modal from '../../components/ui/Modal';
import { ArrowLeft, CheckCircle, XCircle, Clock, Save, Plus, Upload, Send } from 'lucide-react';

export default function TeacherLessonView() {
  const { groupId, lessonId } = useParams();
  const { t } = useLang();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [tab, setTab] = useState('attendance');
  const [loading, setLoading] = useState(true);
  const [savingAtt, setSavingAtt] = useState(false);
  const [attSaved, setAttSaved] = useState(false);

  // Homework modal
  const [hwModal, setHwModal] = useState(false);
  const [hwForm, setHwForm] = useState({ title: '', description: '', due_date: '' });
  const [savingHw, setSavingHw] = useState(false);

  // Grade modal
  const [gradeModal, setGradeModal] = useState(null); // submission object
  const [gradeForm, setGradeForm] = useState({ grade: '', teacher_feedback: '' });
  const [savingGrade, setSavingGrade] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get(`/lessons/${lessonId}`),
      api.get(`/attendance/lesson/${lessonId}`),
    ]).then(([l, att]) => {
      setLesson(l.data);
      setAttendance(att.data.map(a => ({ ...a, status: a.status || 'absent' })));
      if (l.data?.homework_id) {
        api.get(`/homework/${l.data.homework_id}/submissions`).then(r => {
          setSubmissions(Array.isArray(r.data) ? r.data : []);
        }).catch(() => {});
      }
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [lessonId]);

  const cycleStatus = (studentId) => {
    setAttendance(prev => prev.map(a => {
      if (a.student_id !== studentId) return a;
      const next = { present: 'late', late: 'absent', absent: 'present' };
      return { ...a, status: next[a.status] || 'absent' };
    }));
    setAttSaved(false);
  };

  const setStatus = (studentId, status) => {
    setAttendance(prev => prev.map(a => a.student_id === studentId ? { ...a, status } : a));
    setAttSaved(false);
  };

  const markAll = (status) => {
    setAttendance(prev => prev.map(a => ({ ...a, status })));
    setAttSaved(false);
  };

  const saveAttendance = async () => {
    setSavingAtt(true);
    try {
      await api.post(`/attendance/lesson/${lessonId}`, {
        records: attendance.map(a => ({ student_id: a.student_id, status: a.status }))
      });
      setAttSaved(true);
    } catch (err) { alert(err.response?.data?.error || 'Error'); }
    finally { setSavingAtt(false); }
  };

  const saveHomework = async () => {
    if (!hwForm.title) return;
    setSavingHw(true);
    try {
      await api.post(`/lessons/${lessonId}/homework`, hwForm);
      setHwModal(false);
      setHwForm({ title: '', description: '', due_date: '' });
      load();
    } catch (err) { alert(err.response?.data?.error || 'Error'); }
    finally { setSavingHw(false); }
  };

  const saveGrade = async () => {
    if (!gradeForm.grade) return;
    setSavingGrade(true);
    try {
      await api.put(`/homework/${lesson.homework_id}/grade/${gradeModal.student_id}`, {
        grade: parseInt(gradeForm.grade),
        teacher_feedback: gradeForm.teacher_feedback,
      });
      setGradeModal(null);
      load();
    } catch (err) { alert(err.response?.data?.error || 'Error'); }
    finally { setSavingGrade(false); }
  };

  const statusColor = { present: 'var(--green)', late: 'var(--orange)', absent: 'var(--red)' };
  const statusBg = { present: 'var(--green-light)', late: 'var(--orange-light)', absent: 'var(--red-light)' };
  const statusIcon = { present: <CheckCircle size={14} />, late: <Clock size={14} />, absent: <XCircle size={14} /> };
  const statusLabel = { present: t('present'), late: t('late'), absent: t('absent') };

  const presentCount = attendance.filter(a => a.status === 'present').length;
  const lateCount = attendance.filter(a => a.status === 'late').length;
  const absentCount = attendance.filter(a => a.status === 'absent').length;

  const submissionStatusColor = { waiting: 'badge-orange', accepted: 'badge-green', returned: 'badge-blue', failed: 'badge-red' };

  if (loading) return <div className="loading-screen"><div className="spinner" /> {t('loading')}</div>;

  return (
    <div>
      {/* Header */}
      <div className="flex-row mb-24" style={{ gap: 16 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/teacher/groups/${groupId}`)} style={{ padding: '6px 10px' }}>
          <ArrowLeft size={15} />
        </button>
        <div style={{ flex: 1 }}>
          <div className="page-title">{lesson?.title || 'Dars'}</div>
          <div className="page-subtitle">
            {lesson?.lesson_date ? new Date(lesson.lesson_date).toLocaleDateString('uz-UZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}
          </div>
        </div>
        {!lesson?.homework_id && (
          <button className="btn btn-outline" onClick={() => setHwModal(true)}>
            <Plus size={15} /> {t('addHomework')}
          </button>
        )}
      </div>

      {/* Attendance summary */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20 }}>
        <div className="card stat-card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <CheckCircle size={16} color="var(--green)" />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Keldi</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--green)' }}>{presentCount}</div>
        </div>
        <div className="card stat-card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Clock size={16} color="var(--orange)" />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Kech qoldi</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--orange)' }}>{lateCount}</div>
        </div>
        <div className="card stat-card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <XCircle size={16} color="var(--red)" />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Kelmadi</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--red)' }}>{absentCount}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs mb-16" style={{ maxWidth: 360 }}>
        {[
          { v: 'attendance', l: t('attendance') },
          { v: 'homework', l: t('homework') },
        ].map(tb => (
          <button key={tb.v} className={`tab-btn ${tab === tb.v ? 'active' : ''}`} onClick={() => setTab(tb.v)}>
            {tb.l}
          </button>
        ))}
      </div>

      {/* Attendance tab */}
      {tab === 'attendance' && (
        <div className="card">
          {/* Bulk actions */}
          <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12.5, color: 'var(--muted)', marginRight: 4 }}>Barchasi:</span>
            {['present', 'late', 'absent'].map(s => (
              <button key={s} onClick={() => markAll(s)} style={{
                padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', border: `1.5px solid ${statusColor[s]}`,
                background: statusBg[s], color: statusColor[s],
                fontFamily: 'Sora, sans-serif',
              }}>
                {statusLabel[s]}
              </button>
            ))}
            <div style={{ flex: 1 }} />
            <button className="btn btn-primary btn-sm" onClick={saveAttendance} disabled={savingAtt} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {attSaved ? <CheckCircle size={13} /> : <Save size={13} />}
              {savingAtt ? t('loading') : attSaved ? 'Saqlandi ✓' : t('saveAttendance')}
            </button>
          </div>

          {attendance.length === 0 ? (
            <div className="empty-state" style={{ padding: 40 }}>
              <div>O'quvchilar yo'q</div>
            </div>
          ) : attendance.map(a => (
            <div key={a.student_id} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '12px 20px', borderBottom: '1px solid var(--border)',
            }}>
              <div className="avatar" style={{ width: 36, height: 36, fontSize: 13 }}>
                {a.first_name?.[0]}{a.last_name?.[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{a.first_name} {a.last_name}</div>
              </div>
              {/* 3-button status selector */}
              <div style={{ display: 'flex', gap: 6 }}>
                {['present', 'late', 'absent'].map(s => (
                  <button key={s} onClick={() => setStatus(a.student_id, s)} style={{
                    padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                    cursor: 'pointer',
                    border: `1.5px solid ${a.status === s ? statusColor[s] : 'var(--border)'}`,
                    background: a.status === s ? statusBg[s] : 'transparent',
                    color: a.status === s ? statusColor[s] : 'var(--muted)',
                    fontFamily: 'Sora, sans-serif', transition: 'all 0.1s',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    {a.status === s && statusIcon[s]}
                    {statusLabel[s]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Homework tab */}
      {tab === 'homework' && (
        <div>
          {!lesson?.homework_id ? (
            <div className="card card-p" style={{ textAlign: 'center', padding: 48 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Uy vazifasi qo'shilmagan</div>
              <button className="btn btn-primary" onClick={() => setHwModal(true)}>
                <Plus size={15} /> {t('addHomework')}
              </button>
            </div>
          ) : (
            <div className="card">
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }} className="flex-between">
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{lesson.hw_title}</div>
                  {lesson.hw_due_date && (
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                      Muddat: {new Date(lesson.hw_due_date).toLocaleDateString('uz-UZ')}
                    </div>
                  )}
                </div>
                <span className="badge badge-blue">{submissions.length} topshiriq</span>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>O'quvchi</th>
                      <th>Topshirilgan vaqt</th>
                      <th>Holat</th>
                      <th>Baho</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.length === 0 ? (
                      <tr><td colSpan={5}>
                        <div className="empty-state" style={{ padding: 32 }}>
                          <div>Hali topshiriqlar yo'q</div>
                        </div>
                      </td></tr>
                    ) : submissions.map(sub => (
                      <tr key={sub.id}>
                        <td>
                          <div className="flex-row gap-8">
                            <div className="avatar" style={{ width: 28, height: 28, fontSize: 10 }}>
                              {sub.first_name?.[0]}{sub.last_name?.[0]}
                            </div>
                            <span style={{ fontWeight: 600, fontSize: 13 }}>{sub.first_name} {sub.last_name}</span>
                          </div>
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--muted)' }}>
                          {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString('uz-UZ') : '—'}
                        </td>
                        <td>
                          <span className={`badge ${submissionStatusColor[sub.submission_status] || 'badge-gray'}`}>
                            {sub.submission_status || 'waiting'}
                          </span>
                        </td>
                        <td>
                          {sub.grade != null
                            ? <span style={{ fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: sub.grade >= 60 ? 'var(--green)' : 'var(--red)' }}>
                                {sub.grade}/100
                              </span>
                            : <span style={{ color: 'var(--muted)', fontSize: 12 }}>—</span>}
                        </td>
                        <td>
                          <button className="btn btn-primary btn-sm" onClick={() => { setGradeModal(sub); setGradeForm({ grade: sub.grade || '', teacher_feedback: sub.teacher_feedback || '' }); }}>
                            Baholash
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Homework Modal */}
      <Modal open={hwModal} onClose={() => setHwModal(false)} title={t('addHomework')}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setHwModal(false)}>{t('cancel')}</button>
            <button className="btn btn-primary" onClick={saveHomework} disabled={savingHw}>
              {savingHw ? t('loading') : t('save')}
            </button>
          </>
        }>
        <div className="form-group">
          <label className="form-label">Sarlavha</label>
          <input className="form-input" value={hwForm.title} onChange={e => setHwForm({ ...hwForm, title: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Tavsif</label>
          <textarea className="form-textarea" value={hwForm.description} onChange={e => setHwForm({ ...hwForm, description: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Muddat</label>
          <input type="datetime-local" className="form-input" value={hwForm.due_date} onChange={e => setHwForm({ ...hwForm, due_date: e.target.value })} />
        </div>
      </Modal>

      {/* Grade Modal */}
      <Modal open={!!gradeModal} onClose={() => setGradeModal(null)} title="Uy vazifasini baholash"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setGradeModal(null)}>{t('cancel')}</button>
            <button className="btn btn-primary" onClick={saveGrade} disabled={savingGrade}>
              {savingGrade ? t('loading') : 'Baholash'}
            </button>
          </>
        }>
        {gradeModal && (
          <div>
            <div style={{ marginBottom: 16, padding: '12px 16px', background: 'var(--surface2)', borderRadius: 8 }}>
              <div style={{ fontWeight: 600 }}>{gradeModal.first_name} {gradeModal.last_name}</div>
              {gradeModal.comment && <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 4 }}>{gradeModal.comment}</div>}
              {gradeModal.file_urls?.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  {gradeModal.file_urls.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--primary)', marginRight: 8 }}>
                      📎 {gradeModal.file_names?.[i] || `Fayl ${i + 1}`}
                    </a>
                  ))}
                </div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Baho (0–100)</label>
              <input type="number" min="0" max="100" className="form-input"
                value={gradeForm.grade} onChange={e => setGradeForm({ ...gradeForm, grade: e.target.value })} />
              <div className="form-hint">60+ qabul qilindi · 80+ kumush mukofot</div>
            </div>
            <div className="form-group">
              <label className="form-label">Izoh</label>
              <textarea className="form-textarea" value={gradeForm.teacher_feedback}
                onChange={e => setGradeForm({ ...gradeForm, teacher_feedback: e.target.value })} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
