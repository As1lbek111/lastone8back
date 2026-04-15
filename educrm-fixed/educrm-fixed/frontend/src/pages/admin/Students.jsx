import { useEffect, useState } from 'react';
import { useLang } from '../../context/LangContext';
import api from '../../utils/api';
import Modal from '../../components/ui/Modal';
import { Search, Plus, Edit2, Trash2, GraduationCap, UserPlus } from 'lucide-react';

const EMPTY = { first_name:'', last_name:'', phone:'', password:'', birth_date:'', gender:'male' };

export default function AdminStudents() {
  const { t } = useLang();
  const [students, setStudents] = useState([]);
  const [groups, setGroups]     = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [q, setQ]               = useState('');
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [delId, setDelId]       = useState(null);
  // Assign to group modal
  const [assignModal, setAssignModal] = useState(null); // student object
  const [assignGroupId, setAssignGroupId] = useState('');
  const [assigning, setAssigning] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/users?role=student'),
      api.get('/groups/my'),
    ]).then(([s, g]) => {
      const data = Array.isArray(s.data) ? s.data : s.data?.users || [];
      setStudents(data); setFiltered(data);
      setGroups(Array.isArray(g.data) ? g.data : []);
    }).catch(() => setStudents([])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const lower = q.toLowerCase();
    setFiltered(students.filter(s =>
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(lower) ||
      s.phone?.includes(lower)
    ));
  }, [q, students]);

  const openAdd  = () => { setEditing(null); setForm(EMPTY); setModal(true); };
  const openEdit = (s) => { setEditing(s); setForm({ ...s, password:'' }); setModal(true); };

  const setF = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.first_name || !form.last_name || !form.phone) return;
    setSaving(true);
    try {
      if (editing) await api.put(`/users/${editing.id}`, form);
      else { if (!form.password) return; await api.post('/users', { ...form, role:'student' }); }
      setModal(false); load();
    } catch (err) { alert(err.response?.data?.error || 'Xatolik'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/users/${delId}`); setDelId(null); load(); } catch { alert('Xatolik'); }
  };

  const handleAssign = async () => {
    if (!assignGroupId || !assignModal) return;
    setAssigning(true);
    try {
      await api.post(`/groups/${assignGroupId}/students`, { student_id: assignModal.id });
      setAssignModal(null); setAssignGroupId('');
      alert("O'quvchi guruhga qo'shildi!");
    } catch (err) { alert(err.response?.data?.error || 'Xatolik'); }
    finally { setAssigning(false); }
  };

  return (
    <div>
      <div className="flex-between mb-24">
        <div>
          <div className="page-title">{t('students')}</div>
          <div className="page-subtitle">{filtered.length} ta o'quvchi</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={15} /> {t('addStudent')}
        </button>
      </div>

      <div className="card card-p mb-16">
        <div className="search-wrap">
          <svg style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--muted)', width:15, height:15 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" /></svg>
          <input className="search-input" placeholder="Ism, familiya yoki telefon..." value={q} onChange={e => setQ(e.target.value)} />
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th><th>Ism</th><th>Telefon</th><th>Jins</th><th>XP</th><th>Holat</th><th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign:'center', padding:40 }}><div className="spinner" style={{ margin:'0 auto' }} /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7}><div className="empty-state"><GraduationCap size={36} style={{ opacity:.3 }} /><div>O'quvchilar topilmadi</div></div></td></tr>
              ) : filtered.map((s, i) => (
                <tr key={s.id}>
                  <td style={{ color:'var(--muted)', fontFamily:'JetBrains Mono,monospace', fontSize:12 }}>{i+1}</td>
                  <td>
                    <div className="flex-row gap-8">
                      <div className="avatar" style={{ width:32, height:32, fontSize:12 }}>{s.first_name?.[0]}{s.last_name?.[0]}</div>
                      <div>
                        <div style={{ fontWeight:600, fontSize:13.5 }}>{s.first_name} {s.last_name}</div>
                        {s.hh_id && <div style={{ fontSize:11, color:'var(--muted)' }}>ID: {s.hh_id}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ fontFamily:'JetBrains Mono,monospace', fontSize:12.5 }}>{s.phone}</td>
                  <td><span className={`badge ${s.gender==='male'?'badge-blue':'badge-purple'}`}>{s.gender==='male'?'Erkak':'Ayol'}</span></td>
                  <td><span style={{ fontWeight:700, color:'var(--primary)', fontFamily:'JetBrains Mono,monospace' }}>{s.xp||0}</span></td>
                  <td><span className="badge badge-green">Faol</span></td>
                  <td>
                    <div className="flex-row gap-8">
                      <button className="btn btn-ghost btn-sm" title="Guruhga qo'shish" onClick={() => { setAssignModal(s); setAssignGroupId(''); }}>
                        <UserPlus size={13} />
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(s)}><Edit2 size={13} /></button>
                      <button className="btn btn-ghost btn-sm" style={{ color:'var(--red)' }} onClick={() => setDelId(s.id)}><Trash2 size={13} /></button>
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
        title={editing ? "O'quvchini tahrirlash" : "Yangi o'quvchi"}
        footer={<><button className="btn btn-outline" onClick={() => setModal(false)}>{t('cancel')}</button><button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? t('loading') : t('save')}</button></>}>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">{t('firstName')}</label>
            <input className="form-input" value={form.first_name} onChange={setF('first_name')} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('lastName')}</label>
            <input className="form-input" value={form.last_name} onChange={setF('last_name')} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">{t('phone')}</label>
          <input className="form-input" value={form.phone} onChange={setF('phone')} placeholder="+998901234567" />
        </div>
        {!editing && (
          <div className="form-group">
            <label className="form-label">{t('password')}</label>
            <input type="password" className="form-input" value={form.password} onChange={setF('password')} />
          </div>
        )}
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">{t('birthDate')}</label>
            <input type="date" className="form-input" value={form.birth_date} onChange={setF('birth_date')} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('gender')}</label>
            <select className="form-select" value={form.gender} onChange={setF('gender')}>
              <option value="male">{t('male')}</option>
              <option value="female">{t('female')}</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* Assign to group modal */}
      <Modal open={!!assignModal} onClose={() => setAssignModal(null)}
        title={`Guruhga qo'shish: ${assignModal?.first_name} ${assignModal?.last_name}`}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setAssignModal(null)}>{t('cancel')}</button>
            <button className="btn btn-primary" onClick={handleAssign} disabled={assigning || !assignGroupId}>
              {assigning ? t('loading') : "Qo'shish"}
            </button>
          </>
        }>
        <div className="form-group">
          <label className="form-label">Guruhni tanlang</label>
          <select className="form-select" value={assignGroupId} onChange={e => setAssignGroupId(e.target.value)}>
            <option value="">— Guruhni tanlang —</option>
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.name} ({g.student_count||0} o'quvchi)</option>
            ))}
          </select>
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
