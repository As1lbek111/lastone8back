import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { Eye, EyeOff, Lock, User } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const { t, lang, switchLang } = useLang();
  const navigate = useNavigate();
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Send as both phone and email — backend will try both
      const user = await login(form.identifier, form.password);
      if (user.role === 'admin' || user.role === 'ADMIN') navigate('/admin');
      else if (user.role === 'teacher' || user.role === 'TEACHER') navigate('/teacher');
      else navigate('/student');
    } catch (err) {
      setError(err.response?.data?.error || "Login yoki parol noto'g'ri");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, position: 'relative', overflow: 'hidden',
      fontFamily: 'Sora, sans-serif',
    }}>
      {/* Decorative circles */}
      <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)', top: -200, right: -200, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 70%)', bottom: -100, left: -100, pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 64, height: 64,
            background: 'linear-gradient(135deg, #2563eb, #60a5fa)',
            borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', fontSize: 30,
            boxShadow: '0 8px 32px rgba(37,99,235,0.4)',
          }}>🎓</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'white', letterSpacing: -0.5 }}>EduCRM</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Education Management System</div>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 20, padding: 32,
          backdropFilter: 'blur(20px)',
          boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'white' }}>
              {lang === 'uz' ? 'Tizimga kirish' : 'Sign In'}
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {['uz', 'en'].map(l => (
                <button key={l} onClick={() => switchLang(l)} style={{
                  padding: '4px 10px', border: '1px solid',
                  borderColor: lang === l ? '#2563eb' : 'rgba(255,255,255,0.15)',
                  borderRadius: 6, background: lang === l ? '#2563eb' : 'transparent',
                  color: lang === l ? 'white' : 'rgba(255,255,255,0.4)',
                  fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'Sora, sans-serif', transition: 'all 0.15s',
                }}>{l.toUpperCase()}</button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 8, padding: '10px 14px', marginBottom: 16,
                color: '#fca5a5', fontSize: 13,
              }}>{error}</div>
            )}

            {/* Identifier — phone or email */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.55)', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>
                {lang === 'uz' ? 'Telefon yoki Email' : 'Phone or Email'}
              </label>
              <div style={{ position: 'relative' }}>
                <User size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                <input
                  type="text"
                  value={form.identifier}
                  onChange={e => setForm({ ...form, identifier: e.target.value })}
                  placeholder="+998901234567 yoki admin@edu.com"
                  required
                  autoComplete="username"
                  style={{
                    width: '100%', padding: '11px 12px 11px 36px',
                    background: 'rgba(255,255,255,0.07)',
                    border: '1.5px solid rgba(255,255,255,0.1)',
                    borderRadius: 10, color: 'white', fontSize: 14,
                    outline: 'none', fontFamily: 'Sora, sans-serif',
                    transition: 'border-color 0.15s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.borderColor = '#2563eb'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.55)', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>
                {lang === 'uz' ? 'Parol' : 'Password'}
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  style={{
                    width: '100%', padding: '11px 40px 11px 36px',
                    background: 'rgba(255,255,255,0.07)',
                    border: '1.5px solid rgba(255,255,255,0.1)',
                    borderRadius: 10, color: 'white', fontSize: 14,
                    outline: 'none', fontFamily: 'Sora, sans-serif',
                    transition: 'border-color 0.15s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.borderColor = '#2563eb'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
                <button type="button" onClick={() => setShowPwd(v => !v)} style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.3)', display: 'flex',
                }}>{showPwd ? <EyeOff size={15} /> : <Eye size={15} />}</button>
              </div>
            </div>

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '13px 0',
              background: loading ? 'rgba(37,99,235,0.5)' : '#2563eb',
              color: 'white', border: 'none', borderRadius: 10,
              fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'Sora, sans-serif', transition: 'all 0.15s',
              boxShadow: loading ? 'none' : '0 4px 16px rgba(37,99,235,0.4)',
              letterSpacing: 0.3,
            }}>
              {loading
                ? (lang === 'uz' ? 'Yuklanmoqda...' : 'Loading...')
                : (lang === 'uz' ? 'Kirish →' : 'Sign In →')}
            </button>
          </form>

          {/* Demo accounts */}
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', textAlign: 'center', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
              Demo
            </div>
            {[
              { role: 'Admin', login: '+998900000001', color: '#7c3aed' },
              { role: 'Teacher', login: '+998901234567', color: '#0891b2' },
              { role: 'Student', login: '+998909748762', color: '#2563eb' },
            ].map(d => (
              <div key={d.role} onClick={() => setForm({ identifier: d.login, password: 'password123' })}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '7px 12px', borderRadius: 8, cursor: 'pointer', marginBottom: 4,
                  background: 'rgba(255,255,255,0.04)',
                  transition: 'background 0.1s',
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
              >
                <span style={{ fontSize: 11, fontWeight: 700, color: d.color, letterSpacing: 0.5 }}>{d.role}</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: 'JetBrains Mono, monospace' }}>{d.login}</span>
              </div>
            ))}
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: 6 }}>
              Yuqoridagilardan birini bosing → parol: password123
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
