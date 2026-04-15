import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import api from '../../utils/api';
import { Save, Lock } from 'lucide-react';

export default function TeacherSettings() {
  const { user, setUser } = useAuth();
  const { t } = useLang();
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');
  const [saving, setSaving] = useState(false);

  const changePassword = async (e) => {
    e.preventDefault();
    setPwErr(''); setPwMsg('');
    if (pwForm.new_password !== pwForm.confirm) { setPwErr('Parollar mos kelmaydi'); return; }
    if (pwForm.new_password.length < 6) { setPwErr("Parol kamida 6 ta belgi bo'lishi kerak"); return; }
    setSaving(true);
    try {
      await api.put('/auth/password', { current_password: pwForm.current_password, new_password: pwForm.new_password });
      setPwMsg('Parol muvaffaqiyatli o\'zgartirildi!');
      setPwForm({ current_password: '', new_password: '', confirm: '' });
    } catch (err) { setPwErr(err.response?.data?.error || 'Xatolik yuz berdi'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ maxWidth: 560 }}>
      <div className="mb-24">
        <div className="page-title">{t('settings')}</div>
        <div className="page-subtitle">Profil va xavfsizlik sozlamalari</div>
      </div>

      {/* Profile info */}
      <div className="card card-p mb-16">
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="avatar" style={{ width: 28, height: 28, fontSize: 11, background: 'linear-gradient(135deg, #7c3aed, #a78bfa)' }}>
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          Profil ma'lumotlari
        </div>
        <div className="grid-2">
          <div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Ism</div>
            <div style={{ fontWeight: 600 }}>{user?.first_name} {user?.last_name}</div>
          </div>
          <div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Telefon</div>
            <div style={{ fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>{user?.phone}</div>
          </div>
          <div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Rol</div>
            <span className="badge badge-purple">{user?.role}</span>
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="card card-p">
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Lock size={16} /> Parolni o'zgartirish
        </div>

        {pwErr && (
          <div style={{ background: 'var(--red-light)', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', marginBottom: 14, color: '#dc2626', fontSize: 13 }}>
            {pwErr}
          </div>
        )}
        {pwMsg && (
          <div style={{ background: 'var(--green-light)', border: '1px solid #86efac', borderRadius: 8, padding: '10px 14px', marginBottom: 14, color: '#16a34a', fontSize: 13 }}>
            {pwMsg}
          </div>
        )}

        <form onSubmit={changePassword}>
          <div className="form-group">
            <label className="form-label">Joriy parol</label>
            <input type="password" className="form-input" value={pwForm.current_password}
              onChange={e => setPwForm({ ...pwForm, current_password: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Yangi parol</label>
            <input type="password" className="form-input" value={pwForm.new_password}
              onChange={e => setPwForm({ ...pwForm, new_password: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Yangi parolni tasdiqlang</label>
            <input type="password" className="form-input" value={pwForm.confirm}
              onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <Save size={14} /> {saving ? t('loading') : t('save')}
          </button>
        </form>
      </div>
    </div>
  );
}
