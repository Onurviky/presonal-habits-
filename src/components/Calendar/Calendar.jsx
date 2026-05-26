import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  getToday, formatDate, parseDate, addDays,
  getFirstDayOfMonth, getDaysOfMonth, getMonthName, formatDisplayDate,
} from '../../utils/dateUtils';
import styles from './Calendar.module.css';

const EVENT_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16',
];

const DAY_HEADERS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function EventForm({ initial = {}, onSubmit, onCancel, selectedDate }) {
  const [title, setTitle] = useState(initial.title || '');
  const [date, setDate] = useState(initial.date || selectedDate);
  const [time, setTime] = useState(initial.time || '');
  const [description, setDescription] = useState(initial.description || '');
  const [color, setColor] = useState(initial.color || '#6366f1');

  function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({ title: title.trim(), date, time, description, color });
  }

  return (
    <form className={styles.eventForm} onSubmit={handleSubmit}>
      <input
        className={styles.input}
        placeholder="Título del evento *"
        value={title}
        onChange={e => setTitle(e.target.value)}
        autoFocus
        required
      />
      <div className={styles.formRow}>
        <input
          type="date"
          className={styles.input}
          value={date}
          onChange={e => setDate(e.target.value)}
          required
        />
        <input
          type="time"
          className={styles.input}
          value={time}
          onChange={e => setTime(e.target.value)}
          placeholder="Hora (opcional)"
        />
      </div>
      <textarea
        className={styles.textarea}
        placeholder="Descripción (opcional)…"
        value={description}
        onChange={e => setDescription(e.target.value)}
        rows={2}
      />
      <div className={styles.colorRow}>
        <span className={styles.colorLabel}>Color:</span>
        {EVENT_COLORS.map(c => (
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
          {initial.id ? 'Guardar cambios' : 'Crear evento'}
        </button>
      </div>
    </form>
  );
}

export default function Calendar() {
  const { events, addEvent, updateEvent, deleteEvent, getEventsForDate, setActiveDate } = useApp();

  const today = getToday();
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState(today);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  function goToday() {
    setViewYear(new Date().getFullYear());
    setViewMonth(new Date().getMonth());
    setSelectedDate(today);
  }

  const days = getDaysOfMonth(viewYear, viewMonth);
  const firstDayOffset = getFirstDayOfMonth(viewYear, viewMonth); // 0=Mon
  const selectedEvents = getEventsForDate(selectedDate);

  function handleDayClick(date) {
    setSelectedDate(date);
    setActiveDate(date); // sync with the global active date
    setShowForm(false);
    setEditingEvent(null);
  }

  function handleAdd(data) {
    addEvent(data);
    setShowForm(false);
  }

  function handleEdit(data) {
    updateEvent(editingEvent.id, data);
    setEditingEvent(null);
  }

  function getEventDotsForDate(date) {
    return events.filter(e => e.date === date).slice(0, 3);
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Calendario</h2>
        <div className={styles.headerActions}>
          <button className={styles.todayBtn} onClick={goToday}>Hoy</button>
          <button className={styles.btnPrimary} onClick={() => { setShowForm(true); setEditingEvent(null); }}>
            + Nuevo evento
          </button>
        </div>
      </div>

      <div className={styles.calendarGrid}>
        {/* Calendar panel */}
        <div className={styles.calendarPanel}>
          {/* Month navigation */}
          <div className={styles.monthNav}>
            <button className={styles.navBtn} onClick={prevMonth}>‹</button>
            <span className={styles.monthTitle}>
              {getMonthName(viewMonth)} {viewYear}
            </span>
            <button className={styles.navBtn} onClick={nextMonth}>›</button>
          </div>

          {/* Day headers */}
          <div className={styles.dayHeaders}>
            {DAY_HEADERS.map(d => (
              <div key={d} className={styles.dayHeader}>{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className={styles.daysGrid}>
            {/* Empty cells before first day */}
            {Array.from({ length: firstDayOffset }).map((_, i) => (
              <div key={`empty-${i}`} className={styles.dayCell} />
            ))}

            {days.map(date => {
              const dots = getEventDotsForDate(date);
              const isToday = date === today;
              const isSelected = date === selectedDate;
              const dayNum = parseDate(date).getDate();

              return (
                <button
                  key={date}
                  className={`${styles.dayCell} ${styles.dayCellActive}
                    ${isToday ? styles.dayCellToday : ''}
                    ${isSelected ? styles.dayCellSelected : ''}`}
                  onClick={() => handleDayClick(date)}
                >
                  <span className={styles.dayNum}>{dayNum}</span>
                  {dots.length > 0 && (
                    <div className={styles.eventDots}>
                      {dots.map(e => (
                        <span key={e.id} className={styles.eventDot} style={{ background: e.color }} />
                      ))}
                      {events.filter(e => e.date === date).length > 3 && (
                        <span className={styles.eventDotMore}>+</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Events panel */}
        <div className={styles.eventsPanel}>
          <div className={styles.eventsPanelHeader}>
            <div className={styles.eventsPanelDate}>{formatDisplayDate(selectedDate)}</div>
            <button
              className={styles.btnAddSmall}
              onClick={() => { setShowForm(s => !s); setEditingEvent(null); }}
            >
              {showForm ? '✕' : '+ Evento'}
            </button>
          </div>

          {/* Add/Edit form */}
          {(showForm || editingEvent) && (
            <div className={styles.formCard}>
              <div className={styles.formTitle}>{editingEvent ? 'Editar evento' : 'Nuevo evento'}</div>
              <EventForm
                initial={editingEvent || {}}
                selectedDate={selectedDate}
                onSubmit={editingEvent ? handleEdit : handleAdd}
                onCancel={() => { setShowForm(false); setEditingEvent(null); }}
              />
            </div>
          )}

          {/* Events list */}
          {selectedEvents.length === 0 && !showForm && !editingEvent ? (
            <div className={styles.noEvents}>
              <span className={styles.noEventsIcon}>▦</span>
              <p>Sin eventos este día.</p>
              <button className={styles.btnAddSmall} onClick={() => setShowForm(true)}>
                + Agregar evento
              </button>
            </div>
          ) : (
            <div className={styles.eventsList}>
              {selectedEvents.map(event => (
                editingEvent?.id === event.id ? null : (
                  <div key={event.id} className={styles.eventItem}>
                    <div className={styles.eventColorBar} style={{ background: event.color }} />
                    <div className={styles.eventContent}>
                      <div className={styles.eventTitle}>{event.title}</div>
                      {event.time && <div className={styles.eventTime}>⏰ {event.time}</div>}
                      {event.description && (
                        <div className={styles.eventDesc}>{event.description}</div>
                      )}
                    </div>
                    <div className={styles.eventActions}>
                      <button
                        className={styles.eventBtn}
                        onClick={() => { setEditingEvent(event); setShowForm(false); }}
                      >✎</button>
                      <button
                        className={`${styles.eventBtn} ${styles.eventBtnDanger}`}
                        onClick={() => {
                          if (window.confirm('¿Eliminar este evento?')) deleteEvent(event.id);
                        }}
                      >✕</button>
                    </div>
                  </div>
                )
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upcoming events */}
      {events.length > 0 && (
        <div className={styles.upcomingSection}>
          <div className={styles.sectionTitle}>Próximos eventos</div>
          <div className={styles.upcomingList}>
            {events
              .filter(e => e.date >= today)
              .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''))
              .slice(0, 5)
              .map(event => (
                <div key={event.id} className={styles.upcomingItem} onClick={() => {
                  handleDayClick(event.date);
                  setViewYear(parseDate(event.date).getFullYear());
                  setViewMonth(parseDate(event.date).getMonth());
                }}>
                  <div className={styles.upcomingDot} style={{ background: event.color }} />
                  <div className={styles.upcomingDate}>{event.date}</div>
                  <div className={styles.upcomingTitle}>{event.title}</div>
                  {event.time && <div className={styles.upcomingTime}>{event.time}</div>}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
