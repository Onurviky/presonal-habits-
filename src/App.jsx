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

function AppContent() {
  const { currentView, dataLoaded } = useApp();

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
      <Sidebar />
      <main className={styles.main}>
        {views[currentView] || <Dashboard />}
      </main>
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
