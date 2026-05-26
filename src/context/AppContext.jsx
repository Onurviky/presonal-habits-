import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
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

function loadLS(key, fallback) {
  try {
    const val = localStorage.getItem(key);
    return val !== null ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}

function saveLS(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

export function AppProvider({ children, uid }) {
  const [dataLoaded, setDataLoaded] = useState(false);
  const [activeDate, setActiveDate] = useState(getToday);
  const [currentView, setCurrentView] = useState('dashboard');

  const [habits, setHabits] = useState([]);
  const [habitLogs, setHabitLogs] = useState({});
  const [todos, setTodos] = useState([]);
  const [sleepLogs, setSleepLogs] = useState({});
  const [microvictoriesBase, setMicrovictoriesBase] = useState(DEFAULT_MICROVICTORIES);
  const [microvictoryLogs, setMicrovictoryLogs] = useState({});
  const [diary, setDiary] = useState({});
  const [userName, setUserNameState] = useState('Amigo');
  const [events, setEvents] = useState([]);

  // Refs for Firestore flush-on-unmount
  const saveTimer = useRef(null);
  const uidRef = useRef(uid);
  const dataLoadedRef = useRef(false);
  const latestDataRef = useRef(null);

  useEffect(() => { uidRef.current = uid; }, [uid]);
  useEffect(() => { dataLoadedRef.current = dataLoaded; }, [dataLoaded]);

  // ── Load from Firestore on login ──────────────────────────────────────────
  useEffect(() => {
    if (!uid) return;
    setDataLoaded(false);

    async function loadData() {
      try {
        const snap = await getDoc(doc(db, 'users', uid));
        if (snap.exists()) {
          const d = snap.data();
          if (d.habits !== undefined) setHabits(d.habits);
          if (d.habitLogs !== undefined) setHabitLogs(d.habitLogs);
          if (d.todos !== undefined) setTodos(d.todos);
          if (d.sleepLogs !== undefined) setSleepLogs(d.sleepLogs);
          if (d.microvictoriesBase !== undefined) setMicrovictoriesBase(d.microvictoriesBase);
          if (d.microvictoryLogs !== undefined) setMicrovictoryLogs(d.microvictoryLogs);
          if (d.diary !== undefined) setDiary(d.diary);
          if (d.userName !== undefined) setUserNameState(d.userName);
          if (d.events !== undefined) setEvents(d.events);
        } else {
          // New user — migrate localStorage if any data exists
          const localDiary = loadLS(`lt_diary_${uid}`, loadLS('lt_diary', {}));
          const localHabits = loadLS(`lt_habits_${uid}`, loadLS('lt_habits', []));
          const localTodos = loadLS(`lt_todos_${uid}`, loadLS('lt_todos', []));
          const hasData =
            Object.keys(localDiary).length > 0 ||
            localHabits.length > 0 ||
            localTodos.length > 0;
          if (hasData) {
            setHabits(localHabits);
            setHabitLogs(loadLS(`lt_habitLogs_${uid}`, loadLS('lt_habitLogs', {})));
            setTodos(localTodos);
            setSleepLogs(loadLS(`lt_sleepLogs_${uid}`, loadLS('lt_sleepLogs', {})));
            setMicrovictoriesBase(loadLS(`lt_microvictoriesBase_${uid}`, loadLS('lt_microvictoriesBase', DEFAULT_MICROVICTORIES)));
            setMicrovictoryLogs(loadLS(`lt_microvictoryLogs_${uid}`, loadLS('lt_microvictoryLogs', {})));
            setDiary(localDiary);
            setUserNameState(loadLS(`lt_userName_${uid}`, loadLS('lt_userName', 'Amigo')));
            setEvents(loadLS(`lt_events_${uid}`, loadLS('lt_events', [])));
          }
        }
      } catch (err) {
        // Firestore failed (offline?) — fall back to localStorage
        console.warn('Firestore load failed, using localStorage backup', err);
        setHabits(loadLS(`lt_habits_${uid}`, []));
        setHabitLogs(loadLS(`lt_habitLogs_${uid}`, {}));
        setTodos(loadLS(`lt_todos_${uid}`, []));
        setSleepLogs(loadLS(`lt_sleepLogs_${uid}`, {}));
        setMicrovictoriesBase(loadLS(`lt_microvictoriesBase_${uid}`, DEFAULT_MICROVICTORIES));
        setMicrovictoryLogs(loadLS(`lt_microvictoryLogs_${uid}`, {}));
        setDiary(loadLS(`lt_diary_${uid}`, {}));
        setUserNameState(loadLS(`lt_userName_${uid}`, 'Amigo'));
        setEvents(loadLS(`lt_events_${uid}`, []));
      }
      setDataLoaded(true);
    }

    loadData();
  }, [uid]);

  // ── Save on every data change ─────────────────────────────────────────────
  useEffect(() => {
    if (!uid || !dataLoaded) return;

    const data = {
      habits, habitLogs, todos, sleepLogs,
      microvictoriesBase, microvictoryLogs, diary, userName, events,
    };

    // 1. localStorage: immediate, synchronous backup per user
    saveLS(`lt_habits_${uid}`, habits);
    saveLS(`lt_habitLogs_${uid}`, habitLogs);
    saveLS(`lt_todos_${uid}`, todos);
    saveLS(`lt_sleepLogs_${uid}`, sleepLogs);
    saveLS(`lt_microvictoriesBase_${uid}`, microvictoriesBase);
    saveLS(`lt_microvictoryLogs_${uid}`, microvictoryLogs);
    saveLS(`lt_diary_${uid}`, diary);
    saveLS(`lt_userName_${uid}`, userName);
    saveLS(`lt_events_${uid}`, events);

    // 2. Firestore: debounced for cross-device sync
    latestDataRef.current = data;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setDoc(doc(db, 'users', uid), data).catch(err =>
        console.error('Firestore save error:', err)
      );
    }, 500);

  }, [habits, habitLogs, todos, sleepLogs, microvictoriesBase, microvictoryLogs, diary, userName, events, uid, dataLoaded]);

  // ── Flush Firestore on unmount ────────────────────────────────────────────
  useEffect(() => {
    return () => {
      clearTimeout(saveTimer.current);
      const u = uidRef.current;
      const loaded = dataLoadedRef.current;
      const data = latestDataRef.current;
      if (u && loaded && data) {
        setDoc(doc(db, 'users', u), data).catch(() => {});
      }
    };
  }, []); // runs only on unmount

  // ── Habits ────────────────────────────────────────────────────────────────
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

  // ── Events ────────────────────────────────────────────────────────────────
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
    dataLoaded,
    activeDate, setActiveDate,
    currentView, setCurrentView,
    habits, habitLogs,
    addHabit, updateHabit, deleteHabit, toggleHabitLog,
    getHabitStreak, getHabitMonthCompletion, getDayHabitCompletion,
    todos, addTodo, updateTodo, deleteTodo, toggleTodo, getTodosForDate,
    sleepLogs, saveSleepLog, deleteSleepLog,
    microvictoriesBase, microvictoryLogs,
    addMicrovictoryBase, updateMicrovictoryBase, deleteMicrovictoryBase,
    toggleMicrovictoryLog, addExtraMicrovictory, removeExtraMicrovictory,
    diary, saveDiaryEntry,
    events, addEvent, updateEvent, deleteEvent, getEventsForDate,
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
