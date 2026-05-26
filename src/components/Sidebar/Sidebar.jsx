import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { formatDisplayDate, addDays, getToday } from '../../utils/dateUtils';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  { id: 'dashboard',      label: 'Dashboard',       icon: '◈' },
  { id: 'habits',         label: 'Hábitos',          icon: '✦' },
  { id: 'todo',           label: 'To-Do',            icon: '☑' },
  { id: 'sleep',          label: 'Sueño',            icon: '◐' },
  { id: 'microvictories', label: 'Microvictorias',   icon: '★' },
  { id: 'diary',          label: 'Diario',           icon: '✎' },
  { id: 'calendar',       label: 'Calendario',       icon: '▦' },
  { id: 'progress',       label: 'Progreso',         icon: '↗' },
  { id: 'settings',       label: 'Ajustes',          icon: '⚙' },
];

export default function Sidebar() {
  const { currentView, setCurrentView, activeDate, setActiveDate } = useApp();
  const { currentUser, logout } = useAuth();
  const [dateInput, setDateInput] = useState(activeDate);

  function goDay(n) {
    const next = addDays(activeDate, n);
    setActiveDate(next);
    setDateInput(next);
  }

  function goToday() {
    const today = getToday();
    setActiveDate(today);
    setDateInput(today);
  }

  function handleDateChange(e) {
    const val = e.target.value;
    setDateInput(val);
    if (val) setActiveDate(val);
  }

  const isToday = activeDate === getToday();

  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logo}>
        <span className={styles.logoIcon}>⬡</span>
        <span className={styles.logoText}>Life Tracker</span>
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            className={`${styles.navItem} ${currentView === item.id ? styles.navItemActive : ''}`}
            onClick={() => setCurrentView(item.id)}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span className={styles.navLabel}>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Date Selector */}
      <div className={styles.dateSection}>
        <div className={styles.dateSectionTitle}>Fecha activa</div>

        <div className={styles.dateNav}>
          <button className={styles.dateNavBtn} onClick={() => goDay(-1)} title="Día anterior">‹</button>
          <input
            type="date"
            className={styles.dateInput}
            value={dateInput}
            onChange={handleDateChange}
          />
          <button className={styles.dateNavBtn} onClick={() => goDay(1)} title="Día siguiente">›</button>
        </div>

        <div className={styles.dateDisplay}>
          {formatDisplayDate(activeDate).split(',')[0]}
          <br />
          <span className={styles.dateDisplaySub}>
            {formatDisplayDate(activeDate).split(',')[1]?.trim()}
          </span>
        </div>

        {!isToday && (
          <button className={styles.todayBtn} onClick={goToday}>
            Ir a hoy
          </button>
        )}
        {isToday && (
          <div className={styles.todayBadge}>● Hoy</div>
        )}
      </div>

      {/* User section */}
      <div className={styles.userSection}>
        <div className={styles.userAvatar}>
          {(currentUser?.displayName || currentUser?.email || '?')[0].toUpperCase()}
        </div>
        <div className={styles.userInfo}>
          <div className={styles.userName}>{currentUser?.displayName || 'Usuario'}</div>
          <div className={styles.userEmail}>{currentUser?.email}</div>
        </div>
        <button className={styles.logoutBtn} onClick={logout} title="Cerrar sesión">
          ⏻
        </button>
      </div>
    </aside>
  );
}
