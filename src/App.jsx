import React from 'react';
import { AppProvider } from './context/AppContext';
import Sidebar from './components/Sidebar/Sidebar';
import Dashboard from './components/Dashboard/Dashboard';
import Habits from './components/Habits/Habits';
import Todo from './components/Todo/Todo';
import Sleep from './components/Sleep/Sleep';
import Microvictories from './components/Microvictories/Microvictories';
import Diary from './components/Diary/Diary';
import Settings from './components/Settings/Settings';
import { useApp } from './context/AppContext';
import styles from './App.module.css';

function AppContent() {
  const { currentView } = useApp();

  const views = {
    dashboard: <Dashboard />,
    habits: <Habits />,
    todo: <Todo />,
    sleep: <Sleep />,
    microvictories: <Microvictories />,
    diary: <Diary />,
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

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
