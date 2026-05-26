import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDisplayDate } from '../../utils/dateUtils';
import styles from './Todo.module.css';

const PRIORITIES = [
  { value: 'high',   label: 'Alta',  color: '#ef4444', badge: 'badge-danger' },
  { value: 'medium', label: 'Media', color: '#f59e0b', badge: 'badge-warning' },
  { value: 'low',    label: 'Baja',  color: '#10b981', badge: 'badge-success' },
];

function PriorityBadge({ priority }) {
  const p = PRIORITIES.find(x => x.value === priority) || PRIORITIES[1];
  return <span className={`badge ${p.badge}`}>{p.label}</span>;
}

function TodoItem({ todo, onToggle, onDelete, onEdit }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(todo.text);

  function saveEdit() {
    if (text.trim()) onEdit({ text: text.trim() });
    setEditing(false);
  }

  return (
    <div className={`${styles.todoItem} ${todo.status === 'completed' ? styles.todoItemDone : ''}`}>
      <button
        className={`${styles.checkbox} ${todo.status === 'completed' ? styles.checkboxDone : ''}`}
        onClick={onToggle}
      >
        {todo.status === 'completed' && <span className={styles.checkmark}>✓</span>}
      </button>

      <div className={styles.todoContent}>
        {editing ? (
          <input
            className={styles.editInput}
            value={text}
            onChange={e => setText(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditing(false); }}
            autoFocus
          />
        ) : (
          <div className={styles.todoText} onDoubleClick={() => setEditing(true)}>
            {todo.text}
          </div>
        )}
        <div className={styles.todoMeta}>
          <PriorityBadge priority={todo.priority} />
          {todo.dueDate && (
            <span className="badge badge-muted">📅 {todo.dueDate}</span>
          )}
          {todo.status === 'completed' && todo.completedAt && (
            <span className="badge badge-success">✓ Completada</span>
          )}
        </div>
      </div>

      <div className={styles.todoActions}>
        <button className={styles.actionBtn} onClick={() => setEditing(e => !e)} title="Editar">✎</button>
        <button className={`${styles.actionBtn} ${styles.actionBtnDanger}`} onClick={onDelete} title="Eliminar">✕</button>
      </div>
    </div>
  );
}

export default function Todo() {
  const { todos, addTodo, updateTodo, deleteTodo, toggleTodo, activeDate } = useApp();

  const [filter, setFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [text, setText] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('medium');
  const [showForm, setShowForm] = useState(false);

  function handleAdd(e) {
    e.preventDefault();
    if (!text.trim()) return;
    addTodo({ text: text.trim(), dueDate, priority });
    setText('');
    setDueDate('');
    setPriority('medium');
    setShowForm(false);
  }

  const filtered = useMemo(() => {
    return todos.filter(t => {
      if (filter === 'pending' && t.status !== 'pending') return false;
      if (filter === 'completed' && t.status !== 'completed') return false;
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
      return true;
    });
  }, [todos, filter, priorityFilter]);

  const todayCompleted = todos.filter(t => t.completedAt?.slice(0, 10) === activeDate).length;
  const pending = todos.filter(t => t.status === 'pending').length;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>To-Do</h2>
          <p className={styles.subtitle}>
            {pending} pendiente{pending !== 1 ? 's' : ''} · {todayCompleted} completada{todayCompleted !== 1 ? 's' : ''} hoy
          </p>
        </div>
        <button className={styles.btnPrimary} onClick={() => setShowForm(s => !s)}>
          {showForm ? '✕ Cancelar' : '+ Nueva tarea'}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form className={styles.addForm} onSubmit={handleAdd}>
          <input
            className={styles.input}
            placeholder="¿Qué tenés que hacer?"
            value={text}
            onChange={e => setText(e.target.value)}
            autoFocus
          />
          <div className={styles.formRow}>
            <input
              type="date"
              className={styles.input}
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              style={{ flex: '0 0 160px' }}
            />
            <select
              className={styles.select}
              value={priority}
              onChange={e => setPriority(e.target.value)}
            >
              {PRIORITIES.map(p => (
                <option key={p.value} value={p.value}>{p.label} prioridad</option>
              ))}
            </select>
            <button type="submit" className={styles.btnPrimary}>Agregar</button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          {['all', 'pending', 'completed'].map(f => (
            <button
              key={f}
              className={`${styles.filterBtn} ${filter === f ? styles.filterBtnActive : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'Todas' : f === 'pending' ? 'Pendientes' : 'Completadas'}
            </button>
          ))}
        </div>
        <div className={styles.filterGroup}>
          <button
            className={`${styles.filterBtn} ${priorityFilter === 'all' ? styles.filterBtnActive : ''}`}
            onClick={() => setPriorityFilter('all')}
          >
            Todas
          </button>
          {PRIORITIES.map(p => (
            <button
              key={p.value}
              className={`${styles.filterBtn} ${priorityFilter === p.value ? styles.filterBtnActive : ''}`}
              onClick={() => setPriorityFilter(p.value)}
              style={priorityFilter === p.value ? { color: p.color, borderColor: p.color } : {}}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className={styles.list}>
        {filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>☑</div>
            <p>{todos.length === 0 ? '¡No hay tareas! Agregá una.' : 'Sin tareas con este filtro.'}</p>
          </div>
        ) : (
          filtered.map(todo => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={() => toggleTodo(todo.id)}
              onDelete={() => {
                if (window.confirm('¿Eliminar esta tarea?')) deleteTodo(todo.id);
              }}
              onEdit={(updates) => updateTodo(todo.id, updates)}
            />
          ))
        )}
      </div>
    </div>
  );
}
