import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDisplayDate } from '../../utils/dateUtils';
import styles from './Microvictories.module.css';

export default function Microvictories() {
  const {
    microvictoriesBase, microvictoryLogs, activeDate,
    toggleMicrovictoryLog, addExtraMicrovictory, removeExtraMicrovictory,
  } = useApp();

  const [extraText, setExtraText] = useState('');

  const dayLog = microvictoryLogs[activeDate] || { completed: [], extra: [] };
  const completed = dayLog.completed || [];
  const extra = dayLog.extra || [];
  const totalDone = completed.length + extra.length;
  const totalBase = microvictoriesBase.length;
  const pct = totalBase > 0 ? Math.round((completed.length / totalBase) * 100) : 0;

  function handleAddExtra(e) {
    e.preventDefault();
    if (!extraText.trim()) return;
    addExtraMicrovictory(activeDate, extraText.trim());
    setExtraText('');
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Microvictorias</h2>
          <p className={styles.subtitle}>{formatDisplayDate(activeDate)}</p>
        </div>
        <div className={styles.scoreBadge}>
          <span className={styles.scoreNum}>{totalDone}</span>
          <span className={styles.scoreOf}>/ {totalBase}</span>
          <span className={styles.scorePct}>{pct}%</span>
        </div>
      </div>

      {/* Progress */}
      <div className={styles.progressCard}>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className={styles.progressLabel}>
          {totalDone === 0 && '¡Empezá marcando tus logros!'}
          {totalDone > 0 && totalDone < 5 && '¡Buen comienzo, seguí adelante!'}
          {totalDone >= 5 && totalDone < 8 && '¡Vas a mitad de camino, excelente!'}
          {totalDone >= 8 && '¡Día increíble, lo lograste!'}
        </div>
      </div>

      {/* Base list */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>Lista base</div>
        <div className={styles.mvGrid}>
          {microvictoriesBase.map((mv) => {
            const isDone = completed.includes(mv.id);
            return (
              <button
                key={mv.id}
                className={`${styles.mvItem} ${isDone ? styles.mvItemDone : ''}`}
                onClick={() => toggleMicrovictoryLog(activeDate, mv.id)}
              >
                <span className={styles.mvCheck}>{isDone ? '✓' : '○'}</span>
                <span className={styles.mvLabel}>{mv.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Extra victories */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>Logros extra del día</div>

        <form className={styles.extraForm} onSubmit={handleAddExtra}>
          <input
            className={styles.extraInput}
            placeholder="Agregar un logro libre…"
            value={extraText}
            onChange={e => setExtraText(e.target.value)}
          />
          <button type="submit" className={styles.btnAdd}>+ Agregar</button>
        </form>

        {extra.length > 0 && (
          <div className={styles.extraList}>
            {extra.map((text, i) => (
              <div key={i} className={styles.extraItem}>
                <span className={styles.extraStar}>★</span>
                <span className={styles.extraText}>{text}</span>
                <button
                  className={styles.extraDelete}
                  onClick={() => removeExtraMicrovictory(activeDate, i)}
                  title="Eliminar"
                >✕</button>
              </div>
            ))}
          </div>
        )}

        {extra.length === 0 && (
          <p className={styles.extraEmpty}>No hay logros extra hoy.</p>
        )}
      </div>
    </div>
  );
}
