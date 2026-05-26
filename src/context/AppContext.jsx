import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getToday } from '../utils/dateUtils';

const AppContext = createContext(null);

const DEFAULT_MICROVICTORIES = [
  { id: 'mv1', label: 'Tomé agua (8 vasos)' },
  { id: 'mv2', label: 'Hice ejercicio' },
  { id: 'mv3', label: 'Leí al menos 10 minutos' },
  { id: 'mv4', label: 'Meditación o respiración' },
  { id: 'mv5', label: 'Comí saludable' },
  { id: 'mv6', label: 'Sin redes sociales 1h' },
  { id: 'mv7', label: 'Salí a caminar' },
  { id: 'mv8', label: 'Aprendí algo nuevo' },
  { id: 'mv9', label: 'Llamé a alguien importante' },
  { id: 'mv10', label: 'Me acosté temprano' },
];

function load(key, fallback) {
  try {
    const val = localStorage.getItem(key);
    return val !== null ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('localStorage write error', e);
  }
}

export function AppProvider({ children }) {
  const [activeDate, setActiveDate] = useState(getToday);
  const [currentView, setCurrentView] = useState('dashboard');

  const [habits, setHabits] = useState(() => load('lt_habits', []));
  const [habitLogs, setHabitLogs] = useState(() => load('lt_habitLogs', {}));

  const [todos, setTodos] = useState(() => load('lt_todos', []));

  const [sleepLogs, setSleepLogs] = useState(() => load('lt_sleepLogs', {}));

  const [microvictoriesBase, setMicrovictoriesBase] = useState(() =>
    load('lt_microvictoriesBase', DEFAULT_MICROVICTORIES)
  );
  const [microvictoryLogs, setMicrovictoryLogs] = useState(() =>
    load('lt_microvictoryLogs', {})
  );

  const [diary, setDiary] = useState(() => load('lt_diary', {}));
  const [userName, setUserNameState] = useState(() => load('lt_userName', 'Amigo'));
  const [events, setEvents] = useState(() => load('lt_events', []));

  useEffect(() => save('lt_habits', habits), [habits]);
  useEffect(() => save('lt_habitLogs', habitLogs), [habitLogs]);
  useEffect(() => save('lt_todos', todos), [todos]);
  useEffect(() => save('lt_sleepLogs', sleepLogs), [sleepLogs]);
  useEffect(() => save('lt_microvictoriesBase', microvictoriesBase), [microvictoriesBase]);
  useEffect(() => save('lt_microvictoryLogs', microvictoryLogs), [microvictoryLogs]);
  useEffect(() => save('lt_diary', diary), [diary]);
  useEffect(() => save('lt_userName', userName), [userName]);
  useEffect(() => save('lt_events', events), [events]);

  // ── Habits ───────────────────────────────────────────────────────────────
  const addHabit = useCallback((data) => {
    setHabits(prev => [...prev, {
      id: Date.now().toString(),
      name: data.name,
      color: data.color || '#6366f1',
      category: data.category || 'General',
      createdAt: new Date().toISOString(),
    }]);
  }, []);

  const updateHabit = useCallback((id, updates) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h));
  }, []);

  const deleteHabit = useCallback((id) => {
    setHabits(prev => prev.filter(h => h.id !== id));
    setHabitLogs(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(date => {
        if (next[date]?.[id] !== undefined) {
          const copy = { ...next[date] };
          delete copy[id];
          next[date] = copy;
        }
      });
      return next;
    });
  }, []);

  const toggleHabitLog = useCallback((date, habitId) => {
    setHabitLogs(prev => ({
      ...prev,
      [date]: { ...prev[date], [habitId]: !prev[date]?.[habitId] },
    }));
  }, []);

  const getHabitStreak = useCallback((habitId) => {
    let streak = 0;
    let date = getToday();
    for (let i = 0; i < 365; i++) {
      if (habitLogs[date]?.[habitId]) {
        streak++;
        const d = new Date(date + 'T00:00:00');
        d.setDate(d.getDate() - 1);
        date = d.toISOString().split('T')[0];
      } else {
        break;
      }
    }
    return streak;
  }, [habitLogs]);

  const getHabitMonthCompletion = useCallback((habitId) => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const todayDay = now.getDate();
    let completed = 0;
    for (let d = 1; d <= todayDay; d++) {
      const key = `${y}-${m}-${String(d).padStart(2, '0')}`;
      if (habitLogs[key]?.[habitId]) completed++;
    }
    return todayDay > 0 ? Math.round((completed / todayDay) * 100) : 0;
  }, [habitLogs]);

  const getDayHabitCompletion = useCallback((date) => {
    if (!habits.length) return 0;
    const log = habitLogs[date] || {};
    const done = habits.filter(h => log[h.id]).length;
    return Math.round((done / habits.length) * 100);
  }, [habits, habitLogs]);

  // ── Todos ─────────────────────────────────────────────────────────────────
  const addTodo = useCallback((data) => {
    setTodos(prev => [...prev, {
      id: Date.now().toString(),
      text: data.text,
      status: 'pending',
      createdAt: new Date().toISOString(),
      completedAt: null,
      dueDate: data.dueDate || null,
      priority: data.priority || 'medium',
    }]);
  }, []);

  const updateTodo = useCallback((id, updates) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const deleteTodo = useCallback((id) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  }, []);

  const toggleTodo = useCallback((id) => {
    setTodos(prev => prev.map(t => {
      if (t.id !== id) return t;
      const isDone = t.status === 'completed';
      return { ...t, status: isDone ? 'pending' : 'completed', completedAt: isDone ? null : new Date().toISOString() };
    }));
  }, []);

  const getTodosForDate = useCallback((date) => {
    // Completed on this date OR created on this date and pending
    return todos.filter(t => {
      const created = t.createdAt?.slice(0, 10);
      const completed = t.completedAt?.slice(0, 10);
      return created === date || completed === date;
    });
  }, [todos]);

  // ── Sleep ─────────────────────────────────────────────────────────────────
  const saveSleepLog = useCallback((date, data) => {
    setSleepLogs(prev => ({ ...prev, [date]: data }));
  }, []);

  const deleteSleepLog = useCallback((date) => {
    setSleepLogs(prev => { const n = { ...prev }; delete n[date]; return n; });
  }, []);

  // ── Microvictories ────────────────────────────────────────────────────────
  const addMicrovictoryBase = useCallback((label) => {
    setMicrovictoriesBase(prev => [...prev, { id: Date.now().toString(), label }]);
  }, []);

  const updateMicrovictoryBase = useCallback((id, label) => {
    setMicrovictoriesBase(prev => prev.map(mv => mv.id === id ? { ...mv, label } : mv));
  }, []);

  const deleteMicrovictoryBase = useCallback((id) => {
    setMicrovictoriesBase(prev => prev.filter(mv => mv.id !== id));
  }, []);

  const toggleMicrovictoryLog = useCallback((date, mvId) => {
    setMicrovictoryLogs(prev => {
      const day = prev[date] || { completed: [], extra: [] };
      const completed = day.completed || [];
      const newCompleted = completed.includes(mvId)
        ? completed.filter(x => x !== mvId)
        : [...completed, mvId];
      return { ...prev, [date]: { ...day, completed: newCompleted } };
    });
  }, []);

  const addExtraMicrovictory = useCallback((date, text) => {
    setMicrovictoryLogs(prev => {
      const day = prev[date] || { completed: [], extra: [] };
      return { ...prev, [date]: { ...day, extra: [...(day.extra || []), text] } };
    });
  }, []);

  const removeExtraMicrovictory = useCallback((date, index) => {
    setMicrovictoryLogs(prev => {
      const day = prev[date] || { completed: [], extra: [] };
      const extra = [...(day.extra || [])];
      extra.splice(index, 1);
      return { ...prev, [date]: { ...day, extra } };
    });
  }, []);

  // ── Events (Calendar) ────────────────────────────────────────────────────
  const addEvent = useCallback((data) => {
    setEvents(prev => [...prev, {
      id: Date.now().toString(),
      title: data.title,
      date: data.date,
      time: data.time || '',
      description: data.description || '',
      color: data.color || '#6366f1',
      createdAt: new Date().toISOString(),
    }]);
  }, []);

  const updateEvent = useCallback((id, updates) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  }, []);

  const deleteEvent = useCallback((id) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  }, []);

  const getEventsForDate = useCallback((date) => {
    return events
      .filter(e => e.date === date)
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  }, [events]);

  // ── Diary ─────────────────────────────────────────────────────────────────
  const saveDiaryEntry = useCallback((date, content) => {
    const words = content.trim().split(/\s+/).filter(w => w.length > 0);
    setDiary(prev => ({
      ...prev,
      [date]: { content, wordCount: words.length, lastUpdated: new Date().toISOString() },
    }));
  }, []);

  // ── Settings ──────────────────────────────────────────────────────────────
  const setUserName = useCallback((name) => setUserNameState(name), []);

  const exportData = useCallback(() => {
    const data = {
      habits, habitLogs, todos, sleepLogs,
      microvictoriesBase, microvictoryLogs, diary, userName, events,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `life-tracker-${getToday()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [habits, habitLogs, todos, sleepLogs, microvictoriesBase, microvictoryLogs, diary, userName, events]);

  const importData = useCallback((raw) => {
    if (raw.habits !== undefined) setHabits(raw.habits);
    if (raw.habitLogs !== undefined) setHabitLogs(raw.habitLogs);
    if (raw.todos !== undefined) setTodos(raw.todos);
    if (raw.sleepLogs !== undefined) setSleepLogs(raw.sleepLogs);
    if (raw.microvictoriesBase !== undefined) setMicrovictoriesBase(raw.microvictoriesBase);
    if (raw.microvictoryLogs !== undefined) setMicrovictoryLogs(raw.microvictoryLogs);
    if (raw.diary !== undefined) setDiary(raw.diary);
    if (raw.userName !== undefined) setUserNameState(raw.userName);
    if (raw.events !== undefined) setEvents(raw.events);
  }, []);

  const resetAllData = useCallback(() => {
    setHabits([]);
    setHabitLogs({});
    setTodos([]);
    setSleepLogs({});
    setMicrovictoriesBase(DEFAULT_MICROVICTORIES);
    setMicrovictoryLogs({});
    setDiary({});
    setUserNameState('Amigo');
    setEvents([]);
  }, []);

  const value = {
    activeDate, setActiveDate,
    currentView, setCurrentView,
    // Habits
    habits, habitLogs,
    addHabit, updateHabit, deleteHabit, toggleHabitLog,
    getHabitStreak, getHabitMonthCompletion, getDayHabitCompletion,
    // Todos
    todos, addTodo, updateTodo, deleteTodo, toggleTodo, getTodosForDate,
    // Sleep
    sleepLogs, saveSleepLog, deleteSleepLog,
    // Microvictories
    microvictoriesBase, microvictoryLogs,
    addMicrovictoryBase, updateMicrovictoryBase, deleteMicrovictoryBase,
    toggleMicrovictoryLog, addExtraMicrovictory, removeExtraMicrovictory,
    // Diary
    diary, saveDiaryEntry,
    // Events
    events, addEvent, updateEvent, deleteEvent, getEventsForDate,
    // Settings
    userName, setUserName,
    exportData, importData, resetAllData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
