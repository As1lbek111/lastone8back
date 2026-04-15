import { useEffect, useState } from 'react';
import { useLang } from '../../context/LangContext';
import api from '../../utils/api';
import Modal from '../../components/ui/Modal';
import { Plus, Edit2, Trash2, ClipboardList } from 'lucide-react';

const EMPTY_COURSE = { name: '', description: '', price: '', duration_months: 3, direction: '' };

export default function AdminCourses() {
  const { t } = useLang();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_COURSE);
  const [saving, setSaving] = useState(false);
  const [delId, setDelId] = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/courses').then(r => {
      setCourses(Array.isArray(r.data) ? r.data : []);
    }).catch(() => setCourses([])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm(EMPTY_COURSE); setModal(true); };
  const openEdit = (c) => { setEditing(c); setForm(c); setModal(true); };

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      if (editing) await api.put(`/courses/${editing.id}`, form);
      else await api.post('/courses', form);
      setModal(false); load();
    } catch (err) { alert(err.response?.data?.error || 'Error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/courses/${delId}`); setDelId(null); load(); } catch { alert('Error'); }
  };

  const F = ({ label, name, type = 'text' }) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input type={type} className="form-input" value={form[name] || ''} onChange={e => setForm({ ...form, [name]: e.target.value })} />
    </div>
  );

  return (
    <div>
      <div className="flex-between mb-24">
        <div>
          <div className="page-title">{t('courses')}</div>
          <div className="page-subtitle">{courses.length} ta kurs</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={15} /> {t('addCourse')}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {loading ? (
          <div className="loading-screen"><div className="spinner" /></div>
        ) : courses.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: '1/-1' }}>
            <ClipboardList size={40} style={{ opacity: 0.3 }} />
            <div>Kurslar yo'q</div>
          </div>
        ) : courses.map(c => (
          <div key={c.id} className="card" style={{ padding: 20 }}>
            <div className="flex-between" style={{ marginBottom: 12 }}>
              <span className="badge badge-accent">{c.direction || 'Kurs'}</span>
              <div className="flex-row gap-8">
                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}><Edit2 size={13} /></button>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => setDelId(c.id)}><Trash2 size={13} /></button>
              </div>
            </div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{c.name}</div>
            {c.description && <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 12 }}>{c.description}</div>}
            <div className="flex-row gap-16" style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 12 }}>
              <div>
                <div style={{ fontSize: 10.5, color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5 }}>Narx</div>
                <div style={{ fontWeight: 700, color: 'var(--primary)', fontFamily: 'JetBrains Mono' }}>
                  {c.price ? Number(c.price).toLocaleString() + " so'm" : '—'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10.5, color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5 }}>Davomiyligi</div>
                <div style={{ fontWeight: 700, fontFamily: 'JetBrains Mono' }}>{c.duration_months || '—'} oy</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal open={modal} onClose={() => setModal(false)}
        title={editing ? "Kursni tahrirlash" : "Yangi kurs"}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setModal(false)}>{t('cancel')}</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? t('loading') : t('save')}
            </button>
          </>
        }>
        <F label="Kurs nomi" name="name" />
        <F label="Yo'nalish" name="direction" />
        <div className="form-group">
          <label className="form-label">Tavsif</label>
          <textarea className="form-textarea" value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="grid-2">
          <F label="Narx (so'm)" name="price" type="number" />
          <F label="Davomiyligi (oy)" name="duration_months" type="number" />
        </div>
      </Modal>

      <Modal open={!!delId} onClose={() => setDelId(null)} title="O'chirishni tasdiqlang"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setDelId(null)}>{t('cancel')}</button>
            <button className="btn btn-danger" onClick={handleDelete}>{t('delete')}</button>
          </>
        }>
        <p style={{ color: 'var(--text2)' }}>{t('confirmDelete')}</p>
      </Modal>
    </div>
  );
}
