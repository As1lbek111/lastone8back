import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../../context/LangContext';
import api from '../../utils/api';
import Modal from '../../components/ui/Modal';
import { Plus, Edit2, Trash2, BookOpen, Users, ChevronRight } from 'lucide-react';

const WEEKDAYS = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'];
const DAYS_UZ = { MONDAY:'Du', TUESDAY:'Se', WEDNESDAY:'Chor', THURSDAY:'Pay', FRIDAY:'Ju', SATURDAY:'Sha', SUNDAY:'Ya' };

const EMPTY = { name:'', direction:'', teacher_id:'', room_id:'', course_id:'', start_date:'', end_date:'', start_time:'', week_days:[] };

export default function AdminGroups() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [groups, setGroups]     = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [rooms, setRooms]       = useState([]);
  const [courses, setCourses]   = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [q, setQ]               = useState('');
  const [tab, setTab]           = useState('all');
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [delId, setDelId]       = useState(null);
  const [roomConflicts, setRoomConflicts] = useState([]);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/groups/my'),
      api.get('/users?role=teacher'),
      api.get('/rooms').catch(() => ({ data: [] })),
      api.get('/courses').catch(() => ({ data: [] })),
    ]).then(([g, te, rm, co]) => {
      setGroups(Array.isArray(g.data) ? g.data : []);
      setTeachers(Array.isArray(te.data) ? te.data : te.data?.users || []);
      setRooms(Array.isArray(rm.data) ? rm.data : []);
      setCourses(Array.isArray(co.data) ? co.data : []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const lower = q.toLowerCase();
    let data = groups;
    if (tab === 'active')   data = data.filter(g => g.is_active);
    if (tab === 'inactive') data = data.filter(g => !g.is_active);
    setFiltered(data.filter(g =>
      g.name?.toLowerCase().includes(lower) ||
      g.direction?.toLowerCase().includes(lower) ||
      g.teacher_name?.toLowerCase().includes(lower)
    ));
  }, [q, groups, tab]);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setModal(true); };
  const openEdit = (g) => {
    setEditing(g);
    setForm({
      name: g.name || '', direction: g.direction || '',
      teacher_id: g.teacher_id || '', room_id: g.room_id || '',
      course_id: g.course_id || '',
      start_date: g.start_date?.slice(0,10) || '',
      end_date: g.end_date?.slice(0,10) || '',
      start_time: g.start_time || '',
      week_days: g.week_days || [],
    });
    setModal(true);
  };

  const toggleDay = (day) => {
    setForm(f => ({
      ...f,
      week_days: f.week_days.includes(day) ? f.week_days.filter(d => d !== day) : [...f.week_days, day],
    }));
  };

  const handleSave = async () => {
    if (!form.name) return;
    // Check room conflicts before saving
    if (form.room_id && form.start_time && form.week_days.length > 0) {
      try {
        const params = new URLSearchParams();
        params.set('start_time', form.start_time);
        form.week_days.forEach(d => params.append('week_days[]', d));
        if (editing) params.set('exclude_group_id', editing.id);
        const res = await api.get(`/rooms/${form.room_id}/conflicts?${params}`);
        const conflicts = res.data?.conflicts || [];
        if (conflicts.length > 0) {
          const names = conflicts.map(c => `"${c.name}" (${c.teacher_name || ''})`).join(', ');
          const ok = window.confirm(`⚠️ Bu xona shu vaqtda band!\n\nGuruhlar: ${names}\n\nBaribir saqlashni xohlaysizmi?`);
          if (!ok) return;
        }
      } catch {}
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name, direction: form.direction,
        teacher_id: form.teacher_id || null,
        room_id: form.room_id || null,
        course_id: form.course_id || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        start_time: form.start_time || null,
        week_days: form.week_days,
      };
      if (editing) await api.put(`/groups/${editing.id}`, payload);
      else await api.post('/groups', payload);
      setModal(false); load();
    } catch (err) { alert(err.response?.data?.error || 'Xatolik'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/groups/${delId}`); setDelId(null); load(); }
    catch { alert('Xatolik'); }
  };

  const setF = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  return (
    <div>
      <div className="flex-between mb-24">
        <div>
          <div className="page-title">{t('groups')}</div>
          <div className="page-subtitle">{filtered.length} ta guruh</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={15} /> {t('addGroup')}
        </button>
      </div>

      {/* Filter bar */}
      <div className="card card-p mb-16" style={{ display:'flex', gap:12, alignItems:'center' }}>
        <div className="search-wrap" style={{ flex:1 }}>
          <svg style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--muted)', width:15, height:15 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" /></svg>
          <input className="search-input" placeholder="Qidirish..." value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <div className="tabs" style={{ width:260 }}>
          {[['all','Barchasi'],['active','Faol'],['inactive','Nofaol']].map(([v,l]) => (
            <button key={v} className={`tab-btn ${tab===v?'active':''}`} onClick={() => setTab(v)}>{l}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Guruh nomi</th>
                <th>O'qituvchi</th>
                <th>Kurs</th>
                <th>Xona</th>
                <th>Kunlar</th>
                <th>O'quvchilar</th>
                <th>Holat</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ textAlign:'center', padding:40 }}><div className="spinner" style={{ margin:'0 auto' }} /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9}><div className="empty-state"><BookOpen size={36} style={{ opacity:.3 }} /><div>Guruhlar topilmadi</div></div></td></tr>
              ) : filtered.map((g, i) => (
                <tr key={g.id}>
                  <td style={{ color:'var(--muted)', fontFamily:'JetBrains Mono,monospace', fontSize:12 }}>{i+1}</td>
                  <td>
                    <div style={{ fontWeight:700, fontSize:14 }}>{g.name}</div>
                    {g.direction && <div style={{ fontSize:11.5, color:'var(--muted)' }}>{g.direction}</div>}
                  </td>
                  <td>
                    {g.teacher_name
                      ? <div className="flex-row gap-8">
                          <div className="avatar" style={{ width:28, height:28, fontSize:10, background:'linear-gradient(135deg,#7c3aed,#a78bfa)' }}>
                            {g.teacher_name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                          </div>
                          <span style={{ fontSize:13 }}>{g.teacher_name}</span>
                        </div>
                      : <span style={{ color:'var(--muted2)', fontSize:12 }}>—</span>}
                  </td>
                  <td style={{ fontSize:13, color:'var(--text2)' }}>{g.course_name || '—'}</td>
                  <td style={{ fontSize:13, color:'var(--text2)' }}>{g.room_name || '—'}</td>
                  <td>
                    <div style={{ display:'flex', gap:3, flexWrap:'wrap' }}>
                      {(g.week_days || []).map(d => (
                        <span key={d} style={{ padding:'2px 6px', background:'var(--primary-light)', color:'var(--primary)', borderRadius:4, fontSize:11, fontWeight:600 }}>
                          {DAYS_UZ[d] || d}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div className="flex-row gap-6">
                      <Users size={13} color="var(--muted)" />
                      <span style={{ fontWeight:700, fontFamily:'JetBrains Mono,monospace', fontSize:13 }}>{g.student_count || 0}</span>
                    </div>
                  </td>
                  <td><span className={`badge ${g.is_active ? 'badge-green' : 'badge-gray'}`}>{g.is_active ? 'Faol' : 'Nofaol'}</span></td>
                  <td>
                    <div className="flex-row gap-8">
                      <button className="btn btn-ghost btn-sm" title="Batafsil" onClick={() => navigate(`/admin/groups/${g.id}`)}><ChevronRight size={14} /></button>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(g)}><Edit2 size={13} /></button>
                      <button className="btn btn-ghost btn-sm" style={{ color:'var(--red)' }} onClick={() => setDelId(g.id)}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modal} onClose={() => setModal(false)}
        title={editing ? "Guruhni tahrirlash" : "Yangi guruh"} maxWidth={580}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setModal(false)}>{t('cancel')}</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? t('loading') : t('save')}
            </button>
          </>
        }>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Guruh nomi *</label>
            <input className="form-input" value={form.name} onChange={setF('name')} placeholder="Masalan: G-01" />
          </div>
          <div className="form-group">
            <label className="form-label">Yo'nalish</label>
            <input className="form-input" value={form.direction} onChange={setF('direction')} placeholder="Programming" />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">O'qituvchi *</label>
          <select className="form-select" value={form.teacher_id} onChange={setF('teacher_id')}>
            <option value="">— Tanlang —</option>
            {teachers.map(te => (
              <option key={te.id} value={te.id}>{te.first_name} {te.last_name}</option>
            ))}
          </select>
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Kurs</label>
            <select className="form-select" value={form.course_id} onChange={setF('course_id')}>
              <option value="">— Tanlang —</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Xona</label>
            <select className="form-select" value={form.room_id} onChange={setF('room_id')}>
              <option value="">— Tanlang —</option>
              {rooms.map(r => <option key={r.id} value={r.id}>{r.name} ({r.capacity} kishi)</option>)}
            </select>
          </div>
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Boshlanish sanasi</label>
            <input type="date" className="form-input" value={form.start_date} onChange={setF('start_date')} />
          </div>
          <div className="form-group">
            <label className="form-label">Tugash sanasi</label>
            <input type="date" className="form-input" value={form.end_date} onChange={setF('end_date')} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Dars vaqti</label>
          <input type="time" className="form-input" value={form.start_time} onChange={setF('start_time')} />
        </div>

        <div className="form-group">
          <label className="form-label">Dars kunlari</label>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:6 }}>
            {WEEKDAYS.map(day => (
              <button key={day} type="button" onClick={() => toggleDay(day)} style={{
                padding:'6px 12px', borderRadius:8, fontSize:12.5, fontWeight:600,
                cursor:'pointer', border:'1.5px solid',
                borderColor: form.week_days.includes(day) ? 'var(--primary)' : 'var(--border)',
                background: form.week_days.includes(day) ? 'var(--primary)' : 'transparent',
                color: form.week_days.includes(day) ? 'white' : 'var(--muted)',
                fontFamily:'Sora,sans-serif', transition:'all 0.1s',
              }}>
                {DAYS_UZ[day]}
              </button>
            ))}
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!delId} onClose={() => setDelId(null)} title="O'chirishni tasdiqlang"
        footer={<><button className="btn btn-outline" onClick={() => setDelId(null)}>{t('cancel')}</button><button className="btn btn-danger" onClick={handleDelete}>{t('delete')}</button></>}>
        <p style={{ color:'var(--text2)' }}>{t('confirmDelete')}</p>
      </Modal>
    </div>
  );
}
