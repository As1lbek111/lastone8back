import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import api from '../../utils/api';
import { Save, Lock, User } from 'lucide-react';

export default function StudentSettings() {
  const { user, setUser } = useAuth();
  const { t } = useLang();
  const [profileForm, setProfileForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    birth_date: user?.birth_date?.slice(0, 10) || '',
    gender: user?.gender || 'male',
  });
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    setProfileErr(''); setProfileMsg('');
    setSavingProfile(true);
    try {
      const { data } = await api.put('/users/profile', profileForm);
      setUser(u => ({ ...u, ...data }));
      setProfileMsg("Profil muvaffaqiyatli yangilandi!");
    } catch (err) { setProfileErr(err.response?.data?.error || 'Xatolik'); }
    finally { setSavingProfile(false); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPwErr(''); setPwMsg('');
    if (pwForm.new_password !== pwForm.confirm) { setPwErr('Parollar mos kelmaydi'); return; }
    if (pwForm.new_password.length < 6) { setPwErr("Parol kamida 6 ta belgi bo'lishi kerak"); return; }
    setSavingPw(true);
    try {
      await api.put('/auth/password', { current_password: pwForm.current_password, new_password: pwForm.new_password });
      setPwMsg("Parol muvaffaqiyatli o'zgartirildi!");
      setPwForm({ current_password: '', new_password: '', confirm: '' });
    } catch (err) { setPwErr(err.response?.data?.error || 'Xatolik'); }
    finally { setSavingPw(false); }
  };

  const Msg = ({ text, type }) => text ? (
    <div style={{
      padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13,
      background: type === 'success' ? 'var(--green-light)' : 'var(--red-light)',
      color: type === 'success' ? '#16a34a' : '#dc2626',
      border: `1px solid ${type === 'success' ? '#86efac' : '#fca5a5'}`,
    }}>{text}</div>
  ) : null;

  return (
    <div style={{ maxWidth: 560 }}>
      <div className="mb-24">
        <div className="page-title">{t('settings')}</div>
        <div className="page-subtitle">Profil va xavfsizlik sozlamalari</div>
      </div>

      {/* Avatar + XP */}
      <div className="card card-p mb-16">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className="avatar" style={{ width: 60, height: 60, fontSize: 22 }}>
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{user?.first_name} {user?.last_name}</div>
            <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>{user?.phone}</div>
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--primary)', fontFamily: 'JetBrains Mono, monospace' }}>
                {user?.xp || 0} XP
              </span>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--accent)', fontFamily: 'JetBrains Mono, monospace' }}>
                💎 {user?.coins || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile form */}
      <div className="card card-p mb-16">
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <User size={16} /> Profil ma'lumotlari
        </div>
        <Msg text={profileErr} type="error" />
        <Msg text={profileMsg} type="success" />
        <form onSubmit={saveProfile}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">{t('firstName')}</label>
              <input className="form-input" value={profileForm.first_name} onChange={e => setProfileForm({ ...profileForm, first_name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">{t('lastName')}</label>
              <input className="form-input" value={profileForm.last_name} onChange={e => setProfileForm({ ...profileForm, last_name: e.target.value })} required />
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">{t('birthDate')}</label>
              <input type="date" className="form-input" value={profileForm.birth_date} onChange={e => setProfileForm({ ...profileForm, birth_date: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('gender')}</label>
              <select className="form-select" value={profileForm.gender} onChange={e => setProfileForm({ ...profileForm, gender: e.target.value })}>
                <option value="male">{t('male')}</option>
                <option value="female">{t('female')}</option>
              </select>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={savingProfile}>
            <Save size={14} /> {savingProfile ? t('loading') : t('save')}
          </button>
        </form>
      </div>

      {/* Password form */}
      <div className="card card-p">
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Lock size={16} /> Parolni o'zgartirish
        </div>
        <Msg text={pwErr} type="error" />
        <Msg text={pwMsg} type="success" />
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
          <button type="submit" className="btn btn-primary" disabled={savingPw}>
            <Save size={14} /> {savingPw ? t('loading') : t('save')}
          </button>
        </form>
      </div>
    </div>
  );
}
