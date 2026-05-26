import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Sidebar from './components/Sidebar/Sidebar';
import Dashboard from './components/Dashboard/Dashboard';
import Habits from './components/Habits/Habits';
import Todo from './components/Todo/Todo';
import Sleep from './components/Sleep/Sleep';
import Microvictories from './components/Microvictories/Microvictories';
import Diary from './components/Diary/Diary';
import Calendar from './components/Calendar/Calendar';
import Progress from './components/Progress/Progress';
import Settings from './components/Settings/Settings';
import { useApp } from './context/AppContext';
import styles from './App.module.css';

const VIEW_LABELS = {
  dashboard: 'Dashboard',
  habits: 'Hábitos',
  todo: 'To-Do',
  sleep: 'Sueño',
  microvictories: 'Microvictorias',
  diary: 'Diario',
  calendar: 'Calendario',
  progress: 'Progreso',
  settings: 'Ajustes',
};

function AppContent() {
  const { currentView, dataLoaded } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!dataLoaded) {
    return (
      <div className={styles.loadingScreen}>
        <span className={styles.loadingIcon}>⬡</span>
        <p className={styles.loadingText}>Cargando datos...</p>
      </div>
    );
  }

  const views = {
    dashboard: <Dashboard />,
    habits: <Habits />,
    todo: <Todo />,
    sleep: <Sleep />,
    microvictories: <Microvictories />,
    diary: <Diary />,
    calendar: <Calendar />,
    progress: <Progress />,
    settings: <Settings />,
  };

  return (
    <div className={styles.layout}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className={styles.contentArea}>
        {/* Mobile top bar */}
        <div className={styles.topBar}>
          <button
            className={styles.hamburger}
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú"
          >
            ☰
          </button>
          <span className={styles.topBarTitle}>
            {VIEW_LABELS[currentView] || 'Life Tracker'}
          </span>
        </div>

        <main className={styles.main}>
          {views[currentView] || <Dashboard />}
        </main>
      </div>
    </div>
  );
}

function AuthGate() {
  const { currentUser } = useAuth();
  const [authView, setAuthView] = useState('login');

  if (!currentUser) {
    return authView === 'login'
      ? <Login onSwitchToRegister={() => setAuthView('register')} />
      : <Register onSwitchToLogin={() => setAuthView('login')} />;
  }

  return (
    <AppProvider uid={currentUser.uid}>
      <AppContent />
    </AppProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}
