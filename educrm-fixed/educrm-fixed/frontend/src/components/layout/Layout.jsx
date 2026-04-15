import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, DoorOpen,
  Settings, LogOut, Bell, ChevronDown, CalendarCheck,
  ClipboardList, Shield, Building2, BarChart3
} from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../../utils/api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function Avatar({ user, size = 36 }) {
  const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase();
  if (user?.avatar_url) {
    return (
      <div className="avatar" style={{ width: size, height: size }}>
        <img src={`${API_BASE}${user.avatar_url}`} alt="" />
      </div>
    );
  }
  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {initials}
    </div>
  );
}

function NavSection({ label, items }) {
  return (
    <div className="nav-section">
      {label && <div className="nav-section-label">{label}</div>}
      <ul className="nav-list" style={{ padding: 0 }}>
        {items.map(item => (
          <li key={item.to} className="nav-item">
            <NavLink to={item.to} end={item.end}>
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Layout({ role }) {
  const { user, logout } = useAuth();
  const { t, lang, switchLang } = useLang();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    api.get('/notifications').then(r => setUnread(r.data.unread || 0)).catch(() => {});
    const interval = setInterval(() => {
      api.get('/notifications').then(r => setUnread(r.data.unread || 0)).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const adminNav = [
    { section: null, items: [
      { to: '/admin', icon: <LayoutDashboard size={16} />, label: t('dashboard'), end: true },
    ]},
    { section: 'Boshqaruv', items: [
      { to: '/admin/students', icon: <GraduationCap size={16} />, label: t('students') },
      { to: '/admin/teachers', icon: <Users size={16} />, label: t('teachers') },
      { to: '/admin/groups', icon: <BookOpen size={16} />, label: t('groups') },
      { to: '/admin/attendance', icon: <CalendarCheck size={16} />, label: t('attendance') },
    ]},
    { section: 'Tizim', items: [
      { to: '/admin/courses', icon: <ClipboardList size={16} />, label: t('courses') },
      { to: '/admin/rooms', icon: <DoorOpen size={16} />, label: t('rooms') },
    ]},
  ];

  const teacherNav = [
    { section: null, items: [
      { to: '/teacher', icon: <LayoutDashboard size={16} />, label: t('dashboard'), end: true },
      { to: '/teacher/groups', icon: <BookOpen size={16} />, label: t('myGroups') },
      { to: '/teacher/attendance', icon: <CalendarCheck size={16} />, label: t('attendance') },
      { to: '/teacher/settings', icon: <Settings size={16} />, label: t('settings') },
    ]},
  ];

  const studentNav = [
    { section: null, items: [
      { to: '/student', icon: <LayoutDashboard size={16} />, label: t('dashboard'), end: true },
      { to: '/student/groups', icon: <BookOpen size={16} />, label: t('myGroups') },
      { to: '/student/settings', icon: <Settings size={16} />, label: t('settings') },
    ]},
  ];

  const navGroups = role === 'admin' ? adminNav : role === 'teacher' ? teacherNav : studentNav;
  const basePath = role === 'admin' ? '/admin' : role === 'teacher' ? '/teacher' : '/student';

  const roleLabel = role === 'admin' ? 'Admin Panel' : role === 'teacher' ? 'Teacher Portal' : 'Student Portal';
  const roleBg = role === 'admin' ? '#7c3aed' : role === 'teacher' ? '#0891b2' : '#2563eb';

  return (
    <div className="layout">
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="logo-icon">🎓</div>
          <div className="logo-text">
            <div className="logo-name">EduCRM</div>
            <div className="logo-sub">{roleLabel}</div>
          </div>
        </div>

        {/* Nav */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {navGroups.map((group, i) => (
            <NavSection key={i} label={group.section} items={group.items} />
          ))}
        </div>

        {/* User footer */}
        <div className="sidebar-footer">
          {/* Notification row */}
          <button
            onClick={() => navigate(`${basePath}/notifications`)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', padding: '8px 12px', marginBottom: 4,
              background: 'none', border: 'none', cursor: 'pointer',
              borderRadius: 8, color: 'rgba(255,255,255,0.55)',
              fontSize: 13.5, fontFamily: 'Sora, sans-serif', fontWeight: 500,
              transition: 'background 0.15s',
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
            onMouseOut={e => e.currentTarget.style.background = 'none'}
          >
            <div style={{ position: 'relative' }}>
              <Bell size={16} />
              {unread > 0 && (
                <span style={{
                  position: 'absolute', top: -4, right: -4,
                  background: '#ef4444', color: 'white',
                  fontSize: 9, fontWeight: 700,
                  padding: '1px 4px', borderRadius: 10,
                  minWidth: 14, textAlign: 'center',
                }}>
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </div>
            {t('notifications')}
          </button>

          {/* User card */}
          <div className="sidebar-user" onClick={() => setShowUserMenu(v => !v)}>
            <Avatar user={user} size={34} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="sidebar-user-name">
                {user?.first_name} {user?.last_name}
              </div>
              <div className="sidebar-user-role">{user?.role}</div>
            </div>
            <ChevronDown size={14} color="rgba(255,255,255,0.4)" />

            {showUserMenu && (
              <div className="user-menu" onClick={e => e.stopPropagation()}>
                <div className="lang-toggle">
                  {['uz', 'en'].map(l => (
                    <button key={l} className={`lang-btn ${lang === l ? 'active' : ''}`}
                      onClick={() => switchLang(l)}>{l.toUpperCase()}</button>
                  ))}
                </div>
                <button className="user-menu-item danger" onClick={() => { logout(); navigate('/login'); }}>
                  <LogOut size={14} /> {t('logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="main-content">
        {/* Header */}
        <header className="header">
          <div style={{ flex: 1 }}>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '3px 10px',
              background: `${roleBg}15`, color: roleBg,
              borderRadius: 20, border: `1px solid ${roleBg}30`,
            }}>
              {roleLabel}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500 }}>
              {user?.first_name} {user?.last_name}
            </span>
            <Avatar user={user} size={32} />
          </div>
        </header>

        <div className="page-body">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export { Avatar };
