import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDisplayDate, formatShortDate, getDayName, getToday, addDays } from '../../utils/dateUtils';
import styles from './Diary.module.css';

const PLACEHOLDERS = [
  '¿Cómo fue tu día? Escribí libremente…',
  '¿Qué aprendiste hoy?',
  '¿De qué estás agradecido hoy?',
  '¿Qué te hizo sentir bien?',
  '¿Qué podrías mejorar mañana?',
];

export default function Diary() {
  const { diary, saveDiaryEntry, activeDate, setActiveDate } = useApp();

  const [content, setContent] = useState(() => diary[activeDate]?.content || '');
  const [saved, setSaved] = useState(false);
  const debounceRef = useRef(null);
  const latestContent = useRef(content);
  const saveFnRef = useRef(saveDiaryEntry);
  const diaryRef = useRef(diary);

  const placeholder = useMemo(
    () => PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)],
    [activeDate]
  );

  // Keep refs up to date
  useEffect(() => { saveFnRef.current = saveDiaryEntry; }, [saveDiaryEntry]);
  useEffect(() => { diaryRef.current = diary; }, [diary]);
  useEffect(() => { latestContent.current = content; }, [content]);

  // Sync editor when active date changes
  useEffect(() => {
    setContent(diary[activeDate]?.content || '');
    setSaved(false);
  }, [activeDate]); // intentionally excludes diary to avoid overwriting in-progress edits

  // Force-save pending content when date changes or component unmounts
  useEffect(() => {
    const date = activeDate;
    return () => {
      clearTimeout(debounceRef.current);
      const pending = latestContent.current;
      const alreadySaved = diaryRef.current[date]?.content || '';
      if (pending !== alreadySaved) {
        saveFnRef.current(date, pending);
      }
    };
  }, [activeDate]);

  function handleChange(e) {
    const val = e.target.value;
    setContent(val);
    setSaved(false);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveDiaryEntry(activeDate, val);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 800);
  }

  const wordCount = content.trim()
    ? content.trim().split(/\s+/).filter(w => w.length > 0).length
    : 0;

  // Sorted list of diary entries (newest first), only with content
  const entries = useMemo(() => {
    return Object.entries(diary)
      .filter(([, e]) => e.content?.trim())
      .sort(([a], [b]) => b.localeCompare(a));
  }, [diary]);

  const today = getToday();
  const yesterday = addDays(today, -1);

  function getRelativeLabel(date) {
    if (date === today) return 'Hoy';
    if (date === yesterday) return 'Ayer';
    return formatShortDate(date);
  }

  return (
    <div className={styles.wrapper}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Diario</h2>
          <p className={styles.subtitle}>
            {getDayName(activeDate)}, {formatDisplayDate(activeDate).split(', ')[1]}
          </p>
        </div>
        <span className={`${styles.savedIndicator} ${saved ? styles.savedVisible : ''}`}>
          ✓ Guardado
        </span>
      </div>

      {/* Body */}
      <div className={styles.body}>
        {/* Entries history panel */}
        <div className={styles.historyPanel}>
          <div className={styles.historyHeader}>
            Historial
            <span className={styles.historyCount}>{entries.length}</span>
          </div>

          {entries.length === 0 ? (
            <p className={styles.historyEmpty}>
              Aún no hay entradas guardadas.
              <br />Empezá a escribir hoy.
            </p>
          ) : (
            <div className={styles.historyList}>
              {entries.map(([date, e]) => (
                <button
                  key={date}
                  className={`${styles.historyItem} ${date === activeDate ? styles.historyItemActive : ''}`}
                  onClick={() => setActiveDate(date)}
                >
                  <div className={styles.historyItemDate}>
                    {getRelativeLabel(date)}
                    <span className={styles.historyItemWords}>{e.wordCount} pal.</span>
                  </div>
                  <div className={styles.historyItemPreview}>
                    {e.content.slice(0, 65)}{e.content.length > 65 ? '…' : ''}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Editor */}
        <div className={styles.editorSection}>
          <div className={styles.editorCard}>
            <div className={styles.editorHeader}>
              <div className={styles.editorDate}>{formatDisplayDate(activeDate)}</div>
              <div className={styles.wordCount}>
                {wordCount} {wordCount === 1 ? 'palabra' : 'palabras'}
              </div>
            </div>
            <textarea
              className={styles.editor}
              placeholder={placeholder}
              value={content}
              onChange={handleChange}
              spellCheck
            />
          </div>
        </div>
      </div>
    </div>
  );
}
