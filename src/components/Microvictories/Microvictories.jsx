import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDisplayDate } from '../../utils/dateUtils';
import styles from './Microvictories.module.css';

function EditList({ items, onAdd, onUpdate, onDelete, onClose }) {
  const [newLabel, setNewLabel] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editLabel, setEditLabel] = useState('');

  function handleAdd(e) {
    e.preventDefault();
    if (!newLabel.trim()) return;
    onAdd(newLabel.trim());
    setNewLabel('');
  }

  function startEdit(item) {
    setEditingId(item.id);
    setEditLabel(item.label);
  }

  function saveEdit(id) {
    if (editLabel.trim()) onUpdate(id, editLabel.trim());
    setEditingId(null);
  }

  return (
    <div className={styles.editPanel}>
      <div className={styles.editPanelHeader}>
        <span className={styles.editPanelTitle}>Editar lista de microvictorias</span>
        <button className={styles.closeBtn} onClick={onClose}>✕ Cerrar</button>
      </div>
      <p className={styles.editPanelDesc}>
        Personalizá tus {items.length} microvictorias. Doble clic en una para editarla.
      </p>

      <form className={styles.editAddForm} onSubmit={handleAdd}>
        <input
          className={styles.editInput}
          placeholder="Nueva microvictoria…"
          value={newLabel}
          onChange={e => setNewLabel(e.target.value)}
        />
        <button type="submit" className={styles.btnAdd}>+ Agregar</button>
      </form>

      <div className={styles.editList}>
        {items.map((item, i) => (
          <div key={item.id} className={styles.editRow}>
            <span className={styles.editIndex}>{i + 1}</span>
            {editingId === item.id ? (
              <input
                className={styles.editInput}
                value={editLabel}
                onChange={e => setEditLabel(e.target.value)}
                onBlur={() => saveEdit(item.id)}
                onKeyDown={e => {
                  if (e.key === 'Enter') saveEdit(item.id);
                  if (e.key === 'Escape') setEditingId(null);
                }}
                autoFocus
              />
            ) : (
              <span className={styles.editLabel} onDoubleClick={() => startEdit(item)}>
                {item.label}
              </span>
            )}
            <div className={styles.editActions}>
              <button className={styles.editBtn} onClick={() => startEdit(item)}>✎</button>
              <button
                className={`${styles.editBtn} ${styles.editBtnDanger}`}
                onClick={() => {
                  if (window.confirm('¿Eliminar esta microvictoria?')) onDelete(item.id);
                }}
              >✕</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Microvictories() {
  const {
    microvictoriesBase, microvictoryLogs, activeDate,
    toggleMicrovictoryLog, addExtraMicrovictory, removeExtraMicrovictory,
    addMicrovictoryBase, updateMicrovictoryBase, deleteMicrovictoryBase,
  } = useApp();

  const [extraText, setExtraText] = useState('');
  const [showEdit, setShowEdit] = useState(false);

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

  function motivationalLabel() {
    if (totalDone === 0) return '¡Empezá marcando tus logros!';
    if (totalDone < 4) return '¡Buen comienzo, seguí adelante!';
    if (totalDone < 7) return '¡Vas a mitad de camino, excelente!';
    if (totalDone < totalBase) return '¡Casi completo, un esfuerzo más!';
    return '¡Día increíble, lo lograste todo!';
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Microvictorias</h2>
          <p className={styles.subtitle}>{formatDisplayDate(activeDate)}</p>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.scoreBadge}>
            <span className={styles.scoreNum}>{totalDone}</span>
            <span className={styles.scoreOf}>/ {totalBase}</span>
            <span className={styles.scorePct}>{pct}%</span>
          </div>
          <button
            className={`${styles.editToggleBtn} ${showEdit ? styles.editToggleBtnActive : ''}`}
            onClick={() => setShowEdit(s => !s)}
          >
            {showEdit ? '✕ Cerrar' : '✎ Editar lista'}
          </button>
        </div>
      </div>

      {/* Edit panel */}
      {showEdit && (
        <EditList
          items={microvictoriesBase}
          onAdd={addMicrovictoryBase}
          onUpdate={updateMicrovictoryBase}
          onDelete={deleteMicrovictoryBase}
          onClose={() => setShowEdit(false)}
        />
      )}

      {/* Progress */}
      <div className={styles.progressCard}>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${pct}%` }} />
        </div>
        <div className={styles.progressLabel}>{motivationalLabel()}</div>
      </div>

      {/* Base list */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>
          Tu lista ({totalBase} microvictorias)
        </div>
        {totalBase === 0 ? (
          <div className={styles.emptyList}>
            <p>No tenés microvictorias configuradas.</p>
            <button className={styles.btnAdd} onClick={() => setShowEdit(true)}>
              + Crear mi lista
            </button>
          </div>
        ) : (
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
        )}
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

        {extra.length > 0 ? (
          <div className={styles.extraList}>
            {extra.map((text, i) => (
              <div key={i} className={styles.extraItem}>
                <span className={styles.extraStar}>★</span>
                <span className={styles.extraText}>{text}</span>
                <button
                  className={styles.extraDelete}
                  onClick={() => removeExtraMicrovictory(activeDate, i)}
                >✕</button>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.extraEmpty}>No hay logros extra hoy.</p>
        )}
      </div>
    </div>
  );
}
