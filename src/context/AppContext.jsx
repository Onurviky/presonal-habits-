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

const EMPTY_DATA = {
  habits: [], habitLogs: {}, todos: [], sleepLogs: {},
  microvictoriesBase: DEFAULT_MICROVICTORIES, microvictoryLogs: {},
  diary: {}, userName: 'Amigo', events: [],
};

function lsKey(uid) { return `lt_data_v2_${uid}`; }

function loadLS(uid) {
  try {
    const raw = localStorage.getItem(lsKey(uid));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveLS(uid, data) {
  try { localStorage.setItem(lsKey(uid), JSON.stringify(data)); } catch {}
}

function applyData(data, setters) {
  const {
    setHabits, setHabitLogs, setTodos, setSleepLogs,
    setMicrovictoriesBase, setMicrovictoryLogs, setDiary,
    setUserNameState, setEvents,
  } = setters;
  if (data.habits !== undefined) setHabits(data.habits);
  if (data.habitLogs !== undefined) setHabitLogs(data.habitLogs);
  if (data.todos !== undefined) setTodos(data.todos);
  if (data.sleepLogs !== undefined) setSleepLogs(data.sleepLogs);
  if (data.microvictoriesBase !== undefined) setMicrovictoriesBase(data.microvictoriesBase);
  if (data.microvictoryLogs !== undefined) setMicrovictoryLogs(data.microvictoryLogs);
  if (data.diary !== undefined) setDiary(data.diary);
  if (data.userName !== undefined) setUserNameState(data.userName);
  if (data.events !== undefined) setEvents(data.events);
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

  const saveTimer = useRef(null);
  const uidRef = useRef(uid);
  const dataLoadedRef = useRef(false);
  const latestDataRef = useRef(null);

  useEffect(() => { uidRef.current = uid; }, [uid]);
  useEffect(() => { dataLoadedRef.current = dataLoaded; }, [dataLoaded]);

  const setters = { setHabits, setHabitLogs, setTodos, setSleepLogs, setMicrovictoriesBase, setMicrovictoryLogs, setDiary, setUserNameState, setEvents };

  // ── Load on login ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!uid) return;
    setDataLoaded(false);

    async function loadData() {
      const lsData = loadLS(uid);

      let fsData = null;
      try {
        const snap = await getDoc(doc(db, 'users', uid));
        if (snap.exists()) fsData = snap.data();
      } catch (err) {
        console.warn('Firestore load failed:', err.code || err.message);
      }

      // Pick the most recent source by lastModified timestamp
      const fsTime = fsData?.lastModified ?? 0;
      const lsTime = lsData?.lastModified ?? 0;

      let chosen = null;
      if (fsData && lsData) {
        chosen = fsTime >= lsTime ? fsData : lsData;
      } else if (fsData) {
        chosen = fsData;
      } else if (lsData) {
        chosen = lsData;
      }

      if (chosen) {
        applyData(chosen, setters);
      } else {
        // Brand new user — try migrating old localStorage keys
        const oldHabits = tryLoadOld('lt_habits');
        const oldDiary  = tryLoadOld('lt_diary');
        const oldTodos  = tryLoadOld('lt_todos');
        if (oldHabits?.length || Object.keys(oldDiary ?? {}).length || oldTodos?.length) {
          applyData({
            habits: oldHabits ?? [],
            habitLogs: tryLoadOld('lt_habitLogs') ?? {},
            todos: oldTodos ?? [],
            sleepLogs: tryLoadOld('lt_sleepLogs') ?? {},
            microvictoriesBase: tryLoadOld('lt_microvictoriesBase') ?? DEFAULT_MICROVICTORIES,
            microvictoryLogs: tryLoadOld('lt_microvictoryLogs') ?? {},
            diary: oldDiary ?? {},
            userName: tryLoadOld('lt_userName') ?? 'Amigo',
            events: tryLoadOld('lt_events') ?? [],
          }, setters);
        }
      }

      setDataLoaded(true);
    }

    loadData();
  }, [uid]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Save on every change ──────────────────────────────────────────────────
  useEffect(() => {
    if (!uid || !dataLoaded) return;

    const data = {
      habits, habitLogs, todos, sleepLogs,
      microvictoriesBase, microvictoryLogs, diary, userName, events,
      lastModified: Date.now(),
    };

    // 1. localStorage — immediate, synchronous
    saveLS(uid, data);
    latestDataRef.current = data;

    // 2. Firestore — debounced 500ms for cross-device sync
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setDoc(doc(db, 'users', uid), data).catch(err =>
        console.error('Firestore save error:', err.code || err.message)
      );
    }, 500);

  }, [habits, habitLogs, todos, sleepLogs, microvictoriesBase, microvictoryLogs, diary, userName, events, uid, dataLoaded]);

  // ── Flush Firestore on unmount ────────────────────────────────────────────
  useEffect(() => {
    return () => {
      clearTimeout(saveTimer.current);
      const u = uidRef.current;
      const data = latestDataRef.current;
      if (u && data) {
        setDoc(doc(db, 'users', u), data).catch(() => {});
      }
    };
  }, []);

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
      } else break;
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
      if (habitLogs[`${y}-${m}-${String(d).padStart(2, '0')}`]?.[habitId]) completed++;
    }
    return todayDay > 0 ? Math.round((completed / todayDay) * 100) : 0;
  }, [habitLogs]);

  const getDayHabitCompletion = useCallback((date) => {
    if (!habits.length) return 0;
    const log = habitLogs[date] || {};
    return Math.round((habits.filter(h => log[h.id]).length / habits.length) * 100);
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
    const data = { habits, habitLogs, todos, sleepLogs, microvictoriesBase, microvictoryLogs, diary, userName, events, exportedAt: new Date().toISOString() };
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
    setHabits([]); setHabitLogs({}); setTodos([]); setSleepLogs({});
    setMicrovictoriesBase(DEFAULT_MICROVICTORIES); setMicrovictoryLogs({});
    setDiary({}); setUserNameState('Amigo'); setEvents([]);
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

function tryLoadOld(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
