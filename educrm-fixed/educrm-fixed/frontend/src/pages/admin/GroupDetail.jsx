import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useLang } from '../../context/LangContext';
import api from '../../utils/api';
import { ArrowLeft, UserPlus, UserMinus, Users, ClipboardCheck, Save, CheckCircle, XCircle, Clock } from 'lucide-react';
import Modal from '../../components/ui/Modal';

export default function AdminGroupDetail() {
  const { id } = useParams();
  const { t } = useLang();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [students, setStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [saving, setSaving] = useState(false);
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('tab') === 'attendance' ? 'attendance' : 'students');

  // Attendance state
  const [lessons, setLessons] = useState([]);
  const [attMatrix, setAttMatrix] = useState({});
  const [attStudents, setAttStudents] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [attRecords, setAttRecords] = useState([]);
  const [attLoading, setAttLoading] = useState(false);
  const [attSaving, setAttSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get(`/groups/${id}`).catch(() => ({ data: null })),
      api.get(`/groups/${id}/students`).catch(() => ({ data: [] })),
      api.get('/users?role=student').catch(() => ({ data: [] })),
    ]).then(([g, s, all]) => {
      setGroup(g.data);
      const enrolled = Array.isArray(s.data) ? s.data : [];
      setStudents(enrolled);
      const enrolledIds = new Set(enrolled.map(e => e.id));
      const allS = Array.isArray(all.data) ? all.data : all.data?.users || [];
      setAllStudents(allS.filter(u => !enrolledIds.has(u.id)));
    }).finally(() => setLoading(false));
  };

  const loadAttendance = () => {
    setAttLoading(true);
    api.get(`/attendance/group/${id}`)
      .then(r => {
        setLessons(r.data.lessons || []);
        setAttStudents(r.data.students || []);
        setAttMatrix(r.data.matrix || {});
        if (!selectedLesson && r.data.lessons?.length) {
          setSelectedLesson(r.data.lessons[r.data.lessons.length - 1]);
        }
      })
      .catch(() => {})
      .finally(() => setAttLoading(false));
  };

  useEffect(() => { load(); }, [id]);
  useEffect(() => { if (tab === 'attendance') loadAttendance(); }, [tab]);

  useEffect(() => {
    if (!selectedLesson) return;
    // Build editable records for selected lesson
    const recs = attStudents.map(s => ({
      student_id: s.id,
      first_name: s.first_name,
      last_name: s.last_name,
      avatar_url: s.avatar_url,
      status: attMatrix[s.id]?.[selectedLesson.id]?.status || 'absent',
      minutes_late: attMatrix[s.id]?.[selectedLesson.id]?.minutes_late || 0,
    }));
    setAttRecords(recs);
  }, [selectedLesson, attMatrix, attStudents]);

  const updateAtt = (studentId, key, val) => {
    setAttRecords(prev => prev.map(r => r.student_id === studentId ? { ...r, [key]: val } : r));
  };

  const saveAttendance = async () => {
    if (!selectedLesson) return;
    setAttSaving(true);
    try {
      await api.post(`/attendance/lesson/${selectedLesson.id}`, {
        records: attRecords.map(r => ({
          student_id: r.student_id,
          status: r.status,
          minutes_late: r.status === 'late' ? parseInt(r.minutes_late || 0) : 0,
        }))
      });
      loadAttendance();
      alert('Davomat saqlandi ✓');
    } catch (err) { alert(err.response?.data?.error || 'Xatolik'); }
    finally { setAttSaving(false); }
  };

  const handleAdd = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      await api.post(`/groups/${id}/students`, { student_id: selectedId });
      setAddModal(false); setSelectedId(''); load();
    } catch (e) { alert(e.response?.data?.error || 'Error'); }
    finally { setSaving(false); }
  };

  const handleRemove = async (studentId) => {
    if (!confirm(t('confirmDelete'))) return;
    try {
      await api.delete(`/groups/${id}/students/${studentId}`);
      load();
    } catch { alert('Error'); }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /> {t('loading')}</div>;

  const statusColor = { present: 'var(--green)', late: 'var(--orange)', absent: 'var(--red)' };
  const statusBg = { present: 'var(--green-light)', late: 'var(--orange-light)', absent: 'var(--red-light)' };

  return (
    <div>
      <div className="flex-row mb-24" style={{ gap: 16 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/groups')} style={{ padding: '6px 10px' }}>
          <ArrowLeft size={15} />
        </button>
        <div>
          <div className="page-title">{group?.name || 'Guruh'}</div>
          <div className="page-subtitle">{group?.direction} · {students.length} ta o'quvchi</div>
        </div>
        <div style={{ flex: 1 }} />
        {tab === 'students' && (
          <button className="btn btn-primary" onClick={() => setAddModal(true)}>
            <UserPlus size={15} /> O'quvchi qo'shish
          </button>
        )}
      </div>

      {/* Group info */}
      <div className="card card-p mb-16">
        <div className="grid-3" style={{ gap: 24 }}>
          <div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Boshlanish sanasi</div>
            <div style={{ fontWeight: 600 }}>{group?.start_date ? new Date(group.start_date).toLocaleDateString('uz-UZ') : '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Tugash sanasi</div>
            <div style={{ fontWeight: 600 }}>{group?.end_date ? new Date(group.end_date).toLocaleDateString('uz-UZ') : '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Holat</div>
            <span className={`badge ${group?.is_active ? 'badge-green' : 'badge-gray'}`}>
              {group?.is_active ? t('active') : t('inactive')}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs mb-16" style={{ width: 340 }}>
        <button className={`tab-btn ${tab === 'students' ? 'active' : ''}`} onClick={() => setTab('students')}>
          <Users size={13} style={{ marginRight: 5 }} /> O'quvchilar
        </button>
        <button className={`tab-btn ${tab === 'attendance' ? 'active' : ''}`} onClick={() => setTab('attendance')}>
          <ClipboardCheck size={13} style={{ marginRight: 5 }} /> Davomat
        </button>
      </div>

      {/* Students tab */}
      {tab === 'students' && (
        <div className="card">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 15 }}>
            O'quvchilar ro'yxati
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>{t('name')}</th>
                  <th>{t('phone')}</th>
                  <th>XP</th>
                  <th>Qo'shilgan sana</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr><td colSpan={6}>
                    <div className="empty-state"><Users size={36} style={{ opacity: 0.3 }} /><div>O'quvchilar yo'q</div></div>
                  </td></tr>
                ) : students.map((s, i) => (
                  <tr key={s.id}>
                    <td style={{ color: 'var(--muted)', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>{i + 1}</td>
                    <td>
                      <div className="flex-row gap-8">
                        <div className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>{s.first_name?.[0]}{s.last_name?.[0]}</div>
                        <div style={{ fontWeight: 600, fontSize: 13.5 }}>{s.first_name} {s.last_name}</div>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12.5 }}>{s.phone}</td>
                    <td><span style={{ fontWeight: 700, color: 'var(--primary)', fontFamily: 'JetBrains Mono' }}>{s.xp || 0}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--muted)' }}>{s.joined_at ? new Date(s.joined_at).toLocaleDateString('uz-UZ') : '—'}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => handleRemove(s.id)}>
                        <UserMinus size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Attendance tab */}
      {tab === 'attendance' && (
        <div>
          {attLoading ? (
            <div className="loading-screen"><div className="spinner" /></div>
          ) : lessons.length === 0 ? (
            <div className="card card-p">
              <div className="empty-state" style={{ padding: 48 }}>
                <ClipboardCheck size={40} style={{ opacity: 0.2 }} />
                <div>Darslar mavjud emas</div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16 }}>
              {/* Lesson list */}
              <div className="card" style={{ height: 'fit-content' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 13 }}>Darslar</div>
                {lessons.map(l => (
                  <div key={l.id}
                    onClick={() => setSelectedLesson(l)}
                    style={{
                      padding: '10px 16px', cursor: 'pointer',
                      background: selectedLesson?.id === l.id ? 'var(--primary-light)' : 'transparent',
                      borderLeft: selectedLesson?.id === l.id ? '3px solid var(--primary)' : '3px solid transparent',
                      transition: 'all .15s',
                    }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: selectedLesson?.id === l.id ? 'var(--primary)' : 'var(--text)' }}>{l.title}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>
                      {l.lesson_date ? new Date(l.lesson_date).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </div>
                  </div>
                ))}
              </div>

              {/* Attendance editor */}
              <div className="card">
                <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>
                    {selectedLesson?.title} — Davomat
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={saveAttendance} disabled={attSaving}
                    style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    {attSaving ? <div className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /> : <Save size={13} />}
                    Saqlash
                  </button>
                </div>
                {attRecords.length === 0 ? (
                  <div className="empty-state" style={{ padding: 48 }}>
                    <Users size={36} style={{ opacity: 0.3 }} />
                    <div>O'quvchilar yo'q</div>
                  </div>
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>O'quvchi</th>
                          <th>Holat</th>
                          <th>Kechikish</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attRecords.map((r, i) => (
                          <tr key={r.student_id}>
                            <td style={{ color: 'var(--muted)', fontSize: 12, fontFamily: 'JetBrains Mono,monospace' }}>{i + 1}</td>
                            <td>
                              <div className="flex-row gap-8">
                                <div className="avatar" style={{ width: 30, height: 30, fontSize: 11 }}>{r.first_name?.[0]}{r.last_name?.[0]}</div>
                                <span style={{ fontWeight: 600, fontSize: 13.5 }}>{r.first_name} {r.last_name}</span>
                              </div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: 6 }}>
                                {['present', 'late', 'absent'].map(s => (
                                  <button key={s} onClick={() => updateAtt(r.student_id, 'status', s)} style={{
                                    padding: '4px 10px', borderRadius: 6, fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
                                    border: `1.5px solid ${r.status === s ? statusColor[s] : 'var(--border)'}`,
                                    background: r.status === s ? statusBg[s] : 'transparent',
                                    color: r.status === s ? statusColor[s] : 'var(--muted)',
                                    fontFamily: 'Sora,sans-serif', transition: 'all .1s',
                                  }}>
                                    {s === 'present' ? 'Keldi' : s === 'late' ? 'Kech' : 'Kelmadi'}
                                  </button>
                                ))}
                              </div>
                            </td>
                            <td>
                              {r.status === 'late' ? (
                                <input type="number" min="0" max="180" value={r.minutes_late}
                                  onChange={e => updateAtt(r.student_id, 'minutes_late', e.target.value)}
                                  style={{ width: 80, padding: '5px 8px', border: '1.5px solid var(--border)', borderRadius: 6, fontSize: 13, fontFamily: 'JetBrains Mono,monospace', outline: 'none', background: 'var(--orange-light)' }} />
                              ) : (
                                <span style={{ color: 'var(--muted2)', fontSize: 12 }}>—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add student modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="O'quvchi qo'shish"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setAddModal(false)}>{t('cancel')}</button>
            <button className="btn btn-primary" onClick={handleAdd} disabled={saving || !selectedId}>
              {saving ? t('loading') : "Qo'shish"}
            </button>
          </>
        }>
        <div className="form-group">
          <label className="form-label">O'quvchini tanlang</label>
          <select className="form-select" value={selectedId} onChange={e => setSelectedId(e.target.value)}>
            <option value="">— Tanlang —</option>
            {allStudents.map(s => (
              <option key={s.id} value={s.id}>{s.first_name} {s.last_name} · {s.phone}</option>
            ))}
          </select>
        </div>
      </Modal>
    </div>
  );
}
