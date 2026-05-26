import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDisplayDate, getDayName } from '../../utils/dateUtils';
import styles from './Diary.module.css';

const PLACEHOLDERS = [
  '¿Cómo fue tu día? Escribí libremente…',
  '¿Qué aprendiste hoy?',
  '¿De qué estás agradecido hoy?',
  '¿Qué te hizo sentir bien?',
  '¿Qué podrías mejorar mañana?',
];

export default function Diary() {
  const { diary, saveDiaryEntry, activeDate } = useApp();

  const entry = diary[activeDate];
  const [content, setContent] = useState(entry?.content || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [saved, setSaved] = useState(false);
  const debounceRef = useRef(null);
  const placeholder = useMemo(() => PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)], [activeDate]);

  // Sync content when active date changes
  useEffect(() => {
    setContent(diary[activeDate]?.content || '');
    setSaved(false);
  }, [activeDate, diary]);

  function handleChange(e) {
    const val = e.target.value;
    setContent(val);
    setSaved(false);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveDiaryEntry(activeDate, val);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 1000);
  }

  // Force-save on unmount
  useEffect(() => {
    return () => {
      clearTimeout(debounceRef.current);
      if (content !== (diary[activeDate]?.content || '')) {
        saveDiaryEntry(activeDate, content);
      }
    };
  }, [content, activeDate]);

  const wordCount = content.trim()
    ? content.trim().split(/\s+/).filter(w => w.length > 0).length
    : 0;

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return Object.entries(diary)
      .filter(([, e]) => e.content?.toLowerCase().includes(q))
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 10);
  }, [diary, searchQuery]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Diario</h2>
          <p className={styles.subtitle}>{getDayName(activeDate)}, {formatDisplayDate(activeDate).split(', ')[1]}</p>
        </div>
        <div className={styles.headerActions}>
          <span className={`${styles.savedIndicator} ${saved ? styles.savedIndicatorVisible : ''}`}>
            ✓ Guardado
          </span>
          <button
            className={`${styles.btnIcon} ${showSearch ? styles.btnIconActive : ''}`}
            onClick={() => setShowSearch(s => !s)}
            title="Buscar en el diario"
          >
            🔍
          </button>
        </div>
      </div>

      {/* Search panel */}
      {showSearch && (
        <div className={styles.searchPanel}>
          <input
            className={styles.searchInput}
            placeholder="Buscar por palabra clave…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            autoFocus
          />
          {searchQuery.trim() && (
            <div className={styles.searchResults}>
              {searchResults.length === 0 ? (
                <p className={styles.searchEmpty}>Sin resultados para "{searchQuery}"</p>
              ) : (
                searchResults.map(([date, e]) => (
                  <div key={date} className={styles.searchItem}>
                    <div className={styles.searchDate}>{formatDisplayDate(date)}</div>
                    <div className={styles.searchSnippet}>
                      {e.content.slice(0, 120)}…
                    </div>
                    <div className={styles.searchWords}>{e.wordCount} palabras</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Editor */}
      <div className={styles.editorCard}>
        <div className={styles.editorHeader}>
          <div className={styles.editorDate}>{formatDisplayDate(activeDate)}</div>
          <div className={styles.wordCount}>{wordCount} {wordCount === 1 ? 'palabra' : 'palabras'}</div>
        </div>
        <textarea
          className={styles.editor}
          placeholder={placeholder}
          value={content}
          onChange={handleChange}
          spellCheck={true}
        />
      </div>

      {/* Past entries count */}
      <div className={styles.entriesInfo}>
        <span>Total de entradas: <strong>{Object.keys(diary).length}</strong></span>
        {Object.keys(diary).length > 0 && (
          <span>Última: <strong>{formatDisplayDate(Object.keys(diary).sort().reverse()[0])}</strong></span>
        )}
      </div>
    </div>
  );
}
