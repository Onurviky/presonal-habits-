import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  getGreeting, formatDisplayDate, getLastNDays, getDayShort, formatShortDate
} from '../../utils/dateUtils';
import styles from './Dashboard.module.css';

function StatCard({ icon, label, value, sub, color, onClick }) {
  return (
    <div className={styles.statCard} onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className={styles.statIcon} style={{ color }}>{icon}</div>
      <div className={styles.statValue} style={{ color }}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
      {sub && <div className={styles.statSub}>{sub}</div>}
    </div>
  );
}

function WeekHabitChart({ habitLogs, habits }) {
  const days = useMemo(() => getLastNDays(7), []);

  function completion(date) {
    if (!habits.length) return 0;
    const log = habitLogs[date] || {};
    return Math.round((habits.filter(h => log[h.id]).length / habits.length) * 100);
  }

  const values = days.map(d => completion(d));
  const chartH = 80;
  const barW = 28;
  const gap = 12;
  const totalW = days.length * (barW + gap) - gap;

  return (
    <div className={styles.chartWrap}>
      <svg width="100%" viewBox={`0 0 ${totalW} ${chartH + 36}`} preserveAspectRatio="xMidYMid meet">
        {days.map((date, i) => {
          const pct = values[i];
          const barH = Math.max(3, (pct / 100) * chartH);
          const x = i * (barW + gap);
          const y = chartH - barH;
          const isActive = pct > 0;
          return (
            <g key={date}>
              {/* background bar */}
              <rect x={x} y={0} width={barW} height={chartH} fill="rgba(255,255,255,0.04)" rx={4} />
              {/* value bar */}
              <rect x={x} y={y} width={barW} height={barH} fill={isActive ? '#6366f1' : 'rgba(99,102,241,0.2)'} rx={4} />
              {/* day label */}
              <text x={x + barW / 2} y={chartH + 16} textAnchor="middle" fill="#64748b" fontSize={10} fontFamily="Inter,system-ui">
                {getDayShort(date)}
              </text>
              {/* percentage */}
              {pct > 0 && (
                <text x={x + barW / 2} y={y - 4} textAnchor="middle" fill="#94a3b8" fontSize={9} fontFamily="Inter,system-ui">
                  {pct}%
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function Dashboard() {
  const {
    userName, activeDate, habits, habitLogs, getDayHabitCompletion,
    todos, sleepLogs, microvictoriesBase, microvictoryLogs, diary,
    setCurrentView,
  } = useApp();

  const habitPct = getDayHabitCompletion(activeDate);

  const sleep = sleepLogs[activeDate];
  const sleepHours = sleep ? sleep.hours : null;

  const dayTodos = todos.filter(t => t.createdAt?.slice(0, 10) === activeDate);
  const completedTodos = dayTodos.filter(t => t.status === 'completed').length;

  const mvLog = microvictoryLogs[activeDate] || { completed: [], extra: [] };
  const mvTotal = microvictoriesBase.length + (mvLog.extra?.length || 0);
  const mvDone = (mvLog.completed?.length || 0) + (mvLog.extra?.length || 0);

  const diaryEntry = diary[activeDate];
  const diarySnippet = diaryEntry?.content
    ? diaryEntry.content.slice(0, 80) + (diaryEntry.content.length > 80 ? '…' : '')
    : null;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.greeting}>{getGreeting(userName)}</h1>
          <p className={styles.date}>{formatDisplayDate(activeDate)}</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className={styles.statsGrid}>
        <StatCard
          icon="✦"
          label="Hábitos completados"
          value={`${habitPct}%`}
          sub={`${habits.filter(h => habitLogs[activeDate]?.[h.id]).length} de ${habits.length}`}
          color="#6366f1"
          onClick={() => setCurrentView('habits')}
        />
        <StatCard
          icon="◐"
          label="Horas de sueño"
          value={sleepHours !== null ? `${sleepHours}h` : '—'}
          sub={sleep ? `${sleep.bedtime} → ${sleep.wakeTime}` : 'Sin registro'}
          color="#10b981"
          onClick={() => setCurrentView('sleep')}
        />
        <StatCard
          icon="☑"
          label="Tareas del día"
          value={`${completedTodos}/${dayTodos.length}`}
          sub={dayTodos.length === 0 ? 'Sin tareas hoy' : `${dayTodos.length - completedTodos} pendientes`}
          color="#f59e0b"
          onClick={() => setCurrentView('todo')}
        />
        <StatCard
          icon="★"
          label="Microvictorias"
          value={`${mvDone}/${microvictoriesBase.length}`}
          sub={`${mvDone === 0 ? '¡A por ellas!' : mvDone >= 7 ? '¡Excelente día!' : '¡Vas bien!'}`}
          color="#a78bfa"
          onClick={() => setCurrentView('microvictories')}
        />
      </div>

      {/* Bottom section */}
      <div className={styles.bottomGrid}>
        {/* Week chart */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>Hábitos — última semana</div>
          {habits.length > 0 ? (
            <WeekHabitChart habitLogs={habitLogs} habits={habits} />
          ) : (
            <div className={styles.empty}>
              <span>Sin hábitos registrados.</span>
              <button className={styles.emptyLink} onClick={() => setCurrentView('habits')}>
                Crear hábito →
              </button>
            </div>
          )}
        </div>

        {/* Diary snippet */}
        <div className={styles.card} style={{ cursor: 'pointer' }} onClick={() => setCurrentView('diary')}>
          <div className={styles.cardTitle}>Diario de hoy</div>
          {diarySnippet ? (
            <>
              <p className={styles.diarySnippet}>{diarySnippet}</p>
              <div className={styles.diaryMeta}>{diaryEntry.wordCount} palabras · Ver más →</div>
            </>
          ) : (
            <div className={styles.empty}>
              <span>No escribiste nada hoy aún.</span>
              <span className={styles.emptyLink}>Escribir en el diario →</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
