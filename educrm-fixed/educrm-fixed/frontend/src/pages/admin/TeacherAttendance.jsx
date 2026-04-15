import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { ArrowLeft, CheckCircle, XCircle, Clock, Save } from 'lucide-react';

export default function AdminTeacherAttendance() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [summary, setSummary]  = useState(null);
  const [records, setRecords]  = useState([]);
  const [loading, setLoading]  = useState(true);
  const [saving, setSaving]    = useState(null); // lessonId being saved

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get(`/users?role=teacher`),
      api.get(`/attendance/teacher/${id}/summary`),
    ]).then(([users, sum]) => {
      const all = Array.isArray(users.data) ? users.data : users.data?.users || [];
      setTeacher(all.find(u => u.id === parseInt(id)));
      setSummary(sum.data);
      setRecords((sum.data.records || []).map(r => ({ ...r, _status: r.status, _minutes: r.minutes_late || 0 })));
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const updateRecord = (lessonId, key, val) => {
    setRecords(prev => prev.map(r => r.lesson_id === lessonId ? { ...r, [key]: val } : r));
  };

  const saveRecord = async (r) => {
    setSaving(r.lesson_id);
    try {
      await api.post(`/attendance/teacher/lesson/${r.lesson_id}`, {
        teacher_id: parseInt(id),
        status: r._status,
        minutes_late: r._status === 'late' ? parseInt(r._minutes || 0) : 0,
      });
      // Update original values
      setRecords(prev => prev.map(rec =>
        rec.lesson_id === r.lesson_id
          ? { ...rec, status: rec._status, minutes_late: rec._minutes }
          : rec
      ));
    } catch (err) { alert(err.response?.data?.error || 'Xatolik'); }
    finally { setSaving(null); }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  const stats = summary?.stats || {};
  const statusColor = { present:'var(--green)', late:'var(--orange)', absent:'var(--red)' };
  const statusBg    = { present:'var(--green-light)', late:'var(--orange-light)', absent:'var(--red-light)' };

  return (
    <div>
      <div className="flex-row mb-24" style={{ gap:16 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/teachers')} style={{ padding:'6px 10px' }}>
          <ArrowLeft size={15} />
        </button>
        <div style={{ flex:1 }}>
          <div className="page-title">
            {teacher ? `${teacher.first_name} ${teacher.last_name}` : "O'qituvchi"} — Davomat
          </div>
          <div className="page-subtitle">O'qituvchi davomati va kechikish hisobi</div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="stats-grid" style={{ gridTemplateColumns:'repeat(4,1fr)', marginBottom:24 }}>
        <div className="card stat-card" style={{ padding:'16px 20px' }}>
          <div className="stat-label" style={{ fontSize:11 }}>Jami darslar</div>
          <div style={{ fontSize:28, fontWeight:800, color:'var(--primary)' }}>{stats.total || 0}</div>
        </div>
        <div className="card stat-card" style={{ padding:'16px 20px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
            <CheckCircle size={14} color="var(--green)" />
            <span style={{ fontSize:11, fontWeight:600, color:'var(--muted)', textTransform:'uppercase', letterSpacing:.5 }}>Keldi</span>
          </div>
          <div style={{ fontSize:28, fontWeight:800, color:'var(--green)' }}>{stats.present || 0}</div>
        </div>
        <div className="card stat-card" style={{ padding:'16px 20px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
            <Clock size={14} color="var(--orange)" />
            <span style={{ fontSize:11, fontWeight:600, color:'var(--muted)', textTransform:'uppercase', letterSpacing:.5 }}>Kech qoldi</span>
          </div>
          <div style={{ fontSize:28, fontWeight:800, color:'var(--orange)' }}>{stats.late || 0}</div>
          <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>Jami: {stats.totalLateMinutes || 0} daqiqa</div>
        </div>
        <div className="card stat-card" style={{ padding:'16px 20px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
            <XCircle size={14} color="var(--red)" />
            <span style={{ fontSize:11, fontWeight:600, color:'var(--muted)', textTransform:'uppercase', letterSpacing:.5 }}>Kelmadi</span>
          </div>
          <div style={{ fontSize:28, fontWeight:800, color:'var(--red)' }}>{stats.absent || 0}</div>
        </div>
      </div>

      {/* Records table */}
      <div className="card">
        <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', fontWeight:600, fontSize:15 }}>
          Dars tarixi — Davomatni tahrirlash
        </div>
        {records.length === 0 ? (
          <div className="empty-state" style={{ padding:48 }}>
            <div>Darslar topilmadi</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Dars</th>
                  <th>Guruh</th>
                  <th>Sana</th>
                  <th>Holat</th>
                  <th>Kechikish (daqiqa)</th>
                  <th>Saqlash</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr key={r.lesson_id}>
                    <td style={{ color:'var(--muted)', fontFamily:'JetBrains Mono,monospace', fontSize:12 }}>{i+1}</td>
                    <td style={{ fontWeight:600, fontSize:13.5 }}>{r.title}</td>
                    <td style={{ fontSize:13, color:'var(--text2)' }}>{r.group_name}</td>
                    <td style={{ fontSize:12.5, color:'var(--muted)' }}>
                      {r.lesson_date ? new Date(r.lesson_date).toLocaleDateString('uz-UZ', { weekday:'short', day:'numeric', month:'short' }) : '—'}
                    </td>
                    <td>
                      <div style={{ display:'flex', gap:6 }}>
                        {['present','late','absent'].map(s => (
                          <button key={s} onClick={() => updateRecord(r.lesson_id, '_status', s)} style={{
                            padding:'4px 10px', borderRadius:6, fontSize:11.5, fontWeight:600,
                            cursor:'pointer', border:`1.5px solid ${r._status===s ? statusColor[s] : 'var(--border)'}`,
                            background: r._status===s ? statusBg[s] : 'transparent',
                            color: r._status===s ? statusColor[s] : 'var(--muted)',
                            fontFamily:'Sora,sans-serif', transition:'all .1s',
                          }}>
                            {s==='present'?'Keldi':s==='late'?'Kech':' Kelmadi'}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td>
                      {r._status === 'late' ? (
                        <input
                          type="number" min="0" max="180"
                          value={r._minutes}
                          onChange={e => updateRecord(r.lesson_id, '_minutes', e.target.value)}
                          style={{
                            width:80, padding:'5px 8px', border:'1.5px solid var(--border)',
                            borderRadius:6, fontSize:13, fontFamily:'JetBrains Mono,monospace',
                            outline:'none', background:'var(--orange-light)',
                          }}
                          onFocus={e => e.target.style.borderColor = 'var(--orange)'}
                          onBlur={e => e.target.style.borderColor = 'var(--border)'}
                        />
                      ) : (
                        <span style={{ color:'var(--muted2)', fontSize:12 }}>—</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => saveRecord(r)}
                        disabled={saving === r.lesson_id}
                        style={{ display:'flex', alignItems:'center', gap:5 }}
                      >
                        {saving === r.lesson_id
                          ? <div className="spinner" style={{ width:12, height:12, borderWidth:2 }} />
                          : <Save size={12} />}
                        Saqlash
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
