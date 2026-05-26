import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDisplayDate } from '../../utils/dateUtils';
import styles from './Habits.module.css';

const PRESET_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#14b8a6',
];

function HabitForm({ onSubmit, onCancel, initial = {} }) {
  const [name, setName] = useState(initial.name || '');
  const [color, setColor] = useState(initial.color || '#6366f1');
  const [category, setCategory] = useState(initial.category || '');

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), color, category: category.trim() || 'General' });
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <input
        className={styles.input}
        placeholder="Nombre del hábito"
        value={name}
        onChange={e => setName(e.target.value)}
        autoFocus
      />
      <input
        className={styles.input}
        placeholder="Categoría (ej: Salud, Trabajo…)"
        value={category}
        onChange={e => setCategory(e.target.value)}
      />
      <div className={styles.colorRow}>
        <span className={styles.colorLabel}>Color:</span>
        {PRESET_COLORS.map(c => (
          <button
            key={c}
            type="button"
            className={`${styles.colorDot} ${color === c ? styles.colorDotActive : ''}`}
            style={{ background: c }}
            onClick={() => setColor(c)}
          />
        ))}
      </div>
      <div className={styles.formActions}>
        <button type="button" className={styles.btnSecondary} onClick={onCancel}>Cancelar</button>
        <button type="submit" className={styles.btnPrimary}>
          {initial.id ? 'Guardar' : 'Crear hábito'}
        </button>
      </div>
    </form>
  );
}

function HabitRow({ habit, checked, onToggle, onEdit, onDelete, streak, monthPct }) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className={`${styles.habitRow} ${checked ? styles.habitRowDone : ''}`}>
      <button
        className={`${styles.checkbox} ${checked ? styles.checkboxChecked : ''}`}
        style={checked ? { background: habit.color, borderColor: habit.color } : { borderColor: habit.color }}
        onClick={onToggle}
      >
        {checked && <span className={styles.checkmark}>✓</span>}
      </button>

      <div className={styles.colorBar} style={{ background: habit.color }} />

      <div className={styles.habitInfo}>
        <div className={styles.habitName}>{habit.name}</div>
        <div className={styles.habitMeta}>
          <span className="badge badge-muted">{habit.category}</span>
          {streak > 0 && (
            <span className="badge badge-warning">🔥 {streak} días</span>
          )}
          <span className="badge badge-muted">{monthPct}% este mes</span>
        </div>
      </div>

      <div className={styles.habitActions}>
        <button
          className={styles.menuBtn}
          onClick={() => setShowMenu(s => !s)}
          onBlur={() => setTimeout(() => setShowMenu(false), 150)}
        >⋯</button>
        {showMenu && (
          <div className={styles.menu}>
            <button className={styles.menuItem} onClick={() => { onEdit(); setShowMenu(false); }}>✎ Editar</button>
            <button className={`${styles.menuItem} ${styles.menuItemDanger}`} onClick={() => { onDelete(); setShowMenu(false); }}>✕ Eliminar</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Habits() {
  const {
    habits, habitLogs, activeDate,
    addHabit, updateHabit, deleteHabit, toggleHabitLog,
    getHabitStreak, getHabitMonthCompletion, getDayHabitCompletion,
  } = useApp();

  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);

  const dayLog = habitLogs[activeDate] || {};
  const completionPct = getDayHabitCompletion(activeDate);
  const doneCount = habits.filter(h => dayLog[h.id]).length;

  function handleAdd(data) {
    addHabit(data);
    setShowForm(false);
  }

  function handleEdit(data) {
    updateHabit(editingHabit.id, data);
    setEditingHabit(null);
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Hábitos</h2>
          <p className={styles.subtitle}>{formatDisplayDate(activeDate)}</p>
        </div>
        <button className={styles.btnPrimary} onClick={() => { setShowForm(true); setEditingHabit(null); }}>
          + Nuevo hábito
        </button>
      </div>

      {/* Progress bar */}
      {habits.length > 0 && (
        <div className={styles.progressCard}>
          <div className={styles.progressHeader}>
            <span>{doneCount} de {habits.length} completados</span>
            <span className={styles.progressPct}>{completionPct}%</span>
          </div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${completionPct}%` }} />
          </div>
        </div>
      )}

      {/* Add/Edit form */}
      {(showForm || editingHabit) && (
        <div className={styles.formCard}>
          <div className={styles.formTitle}>{editingHabit ? 'Editar hábito' : 'Nuevo hábito'}</div>
          <HabitForm
            initial={editingHabit || {}}
            onSubmit={editingHabit ? handleEdit : handleAdd}
            onCancel={() => { setShowForm(false); setEditingHabit(null); }}
          />
        </div>
      )}

      {/* Habit list */}
      <div className={styles.habitList}>
        {habits.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>✦</div>
            <p>No tenés hábitos todavía.</p>
            <button className={styles.btnPrimary} onClick={() => setShowForm(true)}>
              Crear tu primer hábito
            </button>
          </div>
        ) : (
          habits.map(habit => (
            editingHabit?.id === habit.id ? null : (
              <HabitRow
                key={habit.id}
                habit={habit}
                checked={!!dayLog[habit.id]}
                onToggle={() => toggleHabitLog(activeDate, habit.id)}
                onEdit={() => { setEditingHabit(habit); setShowForm(false); }}
                onDelete={() => {
                  if (window.confirm(`¿Eliminar el hábito "${habit.name}"?`)) deleteHabit(habit.id);
                }}
                streak={getHabitStreak(habit.id)}
                monthPct={getHabitMonthCompletion(habit.id)}
              />
            )
          ))
        )}
      </div>
    </div>
  );
}
