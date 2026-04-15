import { useEffect, useState } from 'react';
import { useLang } from '../context/LangContext';
import api from '../utils/api';
import { Bell, CheckCheck, BookOpen, Trophy, ClipboardCheck, Users, AlertCircle, BookMarked } from 'lucide-react';

const TYPE_CONFIG = {
  homework_submitted: { icon: <BookMarked size={18} />, color: '#2563eb', bg: '#eff6ff' },
  homework_graded:    { icon: <Trophy size={18} />,     color: '#d97706', bg: '#fffbeb' },
  new_lesson:         { icon: <BookOpen size={18} />,   color: '#7c3aed', bg: '#f5f3ff' },
  group_added:        { icon: <Users size={18} />,       color: '#059669', bg: '#ecfdf5' },
  attendance_absent:  { icon: <AlertCircle size={18} />, color: '#dc2626', bg: '#fef2f2' },
  default:            { icon: <Bell size={18} />,        color: '#64748b', bg: '#f8fafc' },
};

export default function Notifications() {
  const { t } = useLang();
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.get('/notifications').then(r => {
      setNotifs(r.data.notifications || []);
      setUnread(r.data.unread || 0);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const readAll = async () => {
    await api.put('/notifications/read-all').catch(() => {});
    load();
  };

  const readOne = async (id) => {
    await api.put(`/notifications/${id}/read`).catch(() => {});
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnread(u => Math.max(0, u - 1));
  };

  const getConfig = (type) => TYPE_CONFIG[type] || TYPE_CONFIG.default;

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div style={{ maxWidth: 680 }}>
      <div className="flex-between mb-24">
        <div>
          <div className="page-title">{t('notifications')}</div>
          <div className="page-subtitle">
            {unread > 0 ? `${unread} ta o'qilmagan` : 'Barchasi o\'qilgan'}
          </div>
        </div>
        {unread > 0 && (
          <button className="btn btn-outline btn-sm" onClick={readAll}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCheck size={14} /> Barchasini o'qildi deb belgilash
          </button>
        )}
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {notifs.length === 0 ? (
          <div className="empty-state" style={{ padding: 60 }}>
            <Bell size={48} style={{ opacity: 0.15 }} />
            <div style={{ marginTop: 12, color: 'var(--muted)' }}>Bildirishnomalar yo'q</div>
          </div>
        ) : notifs.map((n, i) => {
          const cfg = getConfig(n.type);
          return (
            <div key={n.id}
              onClick={() => !n.is_read && readOne(n.id)}
              style={{
                padding: '14px 20px',
                borderBottom: i < notifs.length - 1 ? '1px solid var(--border)' : 'none',
                background: n.is_read ? 'transparent' : 'var(--blue-light, #eff6ff)',
                cursor: n.is_read ? 'default' : 'pointer',
                display: 'flex', alignItems: 'flex-start', gap: 14,
                transition: 'background 0.15s',
              }}>
              {/* Icon bubble */}
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: cfg.bg, color: cfg.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {cfg.icon}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: n.is_read ? 500 : 700, fontSize: 13.5, color: 'var(--text)' }}>
                  {n.title}
                </div>
                {n.body && (
                  <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 3, lineHeight: 1.5 }}>
                    {n.body}
                  </div>
                )}
                <div style={{ fontSize: 11.5, color: 'var(--muted2)', marginTop: 5 }}>
                  {new Date(n.created_at).toLocaleDateString('uz-UZ', {
                    year: 'numeric', month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </div>
              </div>

              {!n.is_read && (
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: cfg.color, flexShrink: 0, marginTop: 6,
                }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
