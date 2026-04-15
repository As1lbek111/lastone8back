import { useEffect, useState } from 'react';
import { useLang } from '../../context/LangContext';
import api from '../../utils/api';
import Modal from '../../components/ui/Modal';
import { Plus, Edit2, Trash2, Users, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EMPTY = { first_name:'', last_name:'', phone:'', password:'', gender:'male' };

export default function AdminTeachers() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [q, setQ]               = useState('');
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [delId, setDelId]       = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/users?role=teacher').then(r => {
      const data = Array.isArray(r.data) ? r.data : r.data?.users || [];
      setTeachers(data); setFiltered(data);
    }).catch(() => setTeachers([])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const lower = q.toLowerCase();
    setFiltered(teachers.filter(s =>
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(lower) ||
      s.phone?.includes(lower)
    ));
  }, [q, teachers]);

  const setF = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const openAdd  = () => { setEditing(null); setForm(EMPTY); setModal(true); };
  const openEdit = (s) => { setEditing(s); setForm({ ...s, password:'' }); setModal(true); };

  const handleSave = async () => {
    if (!form.first_name || !form.last_name || !form.phone) return;
    setSaving(true);
    try {
      if (editing) await api.put(`/users/${editing.id}`, form);
      else { if (!form.password) return; await api.post('/users', { ...form, role:'teacher' }); }
      setModal(false); load();
    } catch (err) { alert(err.response?.data?.error || 'Xatolik'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/users/${delId}`); setDelId(null); load(); } catch { alert('Xatolik'); }
  };

  return (
    <div>
      <div className="flex-between mb-24">
        <div>
          <div className="page-title">{t('teachers')}</div>
          <div className="page-subtitle">{filtered.length} ta o'qituvchi</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={15} /> {t('addTeacher')}</button>
      </div>

      <div className="card card-p mb-16">
        <div className="search-wrap">
          <svg style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--muted)', width:15, height:15 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" /></svg>
          <input className="search-input" placeholder="Qidirish..." value={q} onChange={e => setQ(e.target.value)} />
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>#</th><th>Ism</th><th>Telefon</th><th>Jins</th><th>Holat</th><th>{t('actions')}</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign:'center', padding:40 }}><div className="spinner" style={{ margin:'0 auto' }} /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6}><div className="empty-state"><Users size={36} style={{ opacity:.3 }} /><div>O'qituvchilar topilmadi</div></div></td></tr>
              ) : filtered.map((s, i) => (
                <tr key={s.id}>
                  <td style={{ color:'var(--muted)', fontFamily:'JetBrains Mono,monospace', fontSize:12 }}>{i+1}</td>
                  <td>
                    <div className="flex-row gap-8">
                      <div className="avatar" style={{ width:32, height:32, fontSize:12, background:'linear-gradient(135deg,#7c3aed,#a78bfa)' }}>{s.first_name?.[0]}{s.last_name?.[0]}</div>
                      <div style={{ fontWeight:600, fontSize:13.5 }}>{s.first_name} {s.last_name}</div>
                    </div>
                  </td>
                  <td style={{ fontFamily:'JetBrains Mono,monospace', fontSize:12.5 }}>{s.phone}</td>
                  <td><span className={`badge ${s.gender==='male'?'badge-blue':'badge-purple'}`}>{s.gender==='male'?'Erkak':'Ayol'}</span></td>
                  <td><span className="badge badge-green">Faol</span></td>
                  <td>
                    <div className="flex-row gap-8">
                      <button className="btn btn-ghost btn-sm" title="Davomat" onClick={() => navigate(`/admin/teachers/${s.id}/attendance`)}><BarChart3 size={13} /></button>
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

      <Modal open={modal} onClose={() => setModal(false)}
        title={editing ? "O'qituvchini tahrirlash" : "Yangi o'qituvchi"}
        footer={<><button className="btn btn-outline" onClick={() => setModal(false)}>{t('cancel')}</button><button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving?t('loading'):t('save')}</button></>}>
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
        <div className="form-group">
          <label className="form-label">{t('gender')}</label>
          <select className="form-select" value={form.gender} onChange={setF('gender')}>
            <option value="male">{t('male')}</option>
            <option value="female">{t('female')}</option>
          </select>
        </div>
      </Modal>

      <Modal open={!!delId} onClose={() => setDelId(null)} title="O'chirishni tasdiqlang"
        footer={<><button className="btn btn-outline" onClick={() => setDelId(null)}>{t('cancel')}</button><button className="btn btn-danger" onClick={handleDelete}>{t('delete')}</button></>}>
        <p style={{ color:'var(--text2)' }}>{t('confirmDelete')}</p>
      </Modal>
    </div>
  );
}
