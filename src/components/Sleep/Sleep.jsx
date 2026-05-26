import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDisplayDate, calculateSleepHours, getLastNDays, getDayShort } from '../../utils/dateUtils';
import styles from './Sleep.module.css';

function SleepChart({ sleepLogs }) {
  const days = getLastNDays(14);
  const values = days.map(d => sleepLogs[d]?.hours || 0);
  const maxH = Math.max(...values, 9);

  const chartH = 90;
  const barW = 20;
  const gap = 8;
  const totalW = days.length * (barW + gap) - gap;

  function barColor(h) {
    if (h >= 7 && h <= 9) return '#10b981';
    if (h >= 5) return '#f59e0b';
    if (h === 0) return 'rgba(255,255,255,0.05)';
    return '#ef4444';
  }

  return (
    <div className={styles.chartWrap}>
      <svg width="100%" viewBox={`0 0 ${totalW} ${chartH + 36}`} preserveAspectRatio="xMidYMid meet">
        {days.map((date, i) => {
          const h = values[i];
          const barH = h > 0 ? Math.max(4, (h / maxH) * chartH) : 3;
          const x = i * (barW + gap);
          const y = chartH - barH;
          return (
            <g key={date}>
              <rect x={x} y={0} width={barW} height={chartH} fill="rgba(255,255,255,0.03)" rx={3} />
              <rect x={x} y={y} width={barW} height={barH} fill={barColor(h)} rx={3} />
              <text x={x + barW / 2} y={chartH + 14} textAnchor="middle" fill="#64748b" fontSize={9} fontFamily="Inter,system-ui">
                {getDayShort(date).slice(0, 2)}
              </text>
              {h > 0 && (
                <text x={x + barW / 2} y={y - 3} textAnchor="middle" fill="#94a3b8" fontSize={8} fontFamily="Inter,system-ui">
                  {h}
                </text>
              )}
            </g>
          );
        })}
        {/* Reference line at 8h */}
        <line
          x1={0} y1={chartH - (8 / maxH) * chartH}
          x2={totalW} y2={chartH - (8 / maxH) * chartH}
          stroke="rgba(99,102,241,0.3)" strokeWidth={1} strokeDasharray="4 3"
        />
      </svg>
      <div className={styles.chartLegend}>
        <span style={{ color: '#10b981' }}>■ Óptimo (7-9h)</span>
        <span style={{ color: '#f59e0b' }}>■ Regular (5-7h)</span>
        <span style={{ color: '#ef4444' }}>■ Insuficiente</span>
        <span style={{ color: '#6366f1', opacity: 0.6 }}>-- 8h referencia</span>
      </div>
    </div>
  );
}

export default function Sleep() {
  const { sleepLogs, saveSleepLog, deleteSleepLog, activeDate } = useApp();

  const existing = sleepLogs[activeDate];
  const [bedtime, setBedtime] = useState(existing?.bedtime || '23:00');
  const [wakeTime, setWakeTime] = useState(existing?.wakeTime || '07:00');
  const [note, setNote] = useState(existing?.note || '');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const e = sleepLogs[activeDate];
    setBedtime(e?.bedtime || '23:00');
    setWakeTime(e?.wakeTime || '07:00');
    setNote(e?.note || '');
    setSaved(false);
  }, [activeDate, sleepLogs]);

  const hours = calculateSleepHours(bedtime, wakeTime);

  function handleSave(e) {
    e.preventDefault();
    saveSleepLog(activeDate, { bedtime, wakeTime, hours, note });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleDelete() {
    if (window.confirm('¿Eliminar el registro de sueño de este día?')) {
      deleteSleepLog(activeDate);
    }
  }

  function sleepQuality(h) {
    if (h >= 7 && h <= 9) return { label: 'Excelente', color: '#10b981' };
    if (h >= 6) return { label: 'Regular', color: '#f59e0b' };
    if (h >= 4) return { label: 'Insuficiente', color: '#ef4444' };
    return { label: 'Sin datos', color: '#64748b' };
  }

  const quality = sleepQuality(hours);

  // Monthly average
  const now = new Date();
  const monthEntries = Object.entries(sleepLogs).filter(([d]) => {
    const date = new Date(d + 'T00:00:00');
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });
  const monthAvg = monthEntries.length
    ? (monthEntries.reduce((s, [, v]) => s + (v.hours || 0), 0) / monthEntries.length).toFixed(1)
    : null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Sueño</h2>
          <p className={styles.subtitle}>{formatDisplayDate(activeDate)}</p>
        </div>
        {monthAvg && (
          <div className={styles.avgBadge}>
            Promedio mensual: <strong>{monthAvg}h</strong>
          </div>
        )}
      </div>

      {/* Log form */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>Registro del día</div>
        <form className={styles.form} onSubmit={handleSave}>
          <div className={styles.timeRow}>
            <label className={styles.timeLabel}>
              <span className={styles.timeLabelText}>🌙 Me dormí</span>
              <input
                type="time"
                className={styles.timeInput}
                value={bedtime}
                onChange={e => setBedtime(e.target.value)}
              />
            </label>
            <div className={styles.hoursDisplay}>
              <span className={styles.hoursValue} style={{ color: quality.color }}>{hours}h</span>
              <span className={styles.hoursQuality} style={{ color: quality.color }}>{quality.label}</span>
            </div>
            <label className={styles.timeLabel}>
              <span className={styles.timeLabelText}>☀️ Me desperté</span>
              <input
                type="time"
                className={styles.timeInput}
                value={wakeTime}
                onChange={e => setWakeTime(e.target.value)}
              />
            </label>
          </div>

          <textarea
            className={styles.noteInput}
            placeholder="Nota opcional (ej: dormí mal, siesta incluida…)"
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={2}
          />

          <div className={styles.formActions}>
            {existing && (
              <button type="button" className={styles.btnDanger} onClick={handleDelete}>
                Eliminar
              </button>
            )}
            <button type="submit" className={`${styles.btnPrimary} ${saved ? styles.btnSaved : ''}`}>
              {saved ? '✓ Guardado' : existing ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>

      {/* Chart */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>Últimos 14 días</div>
        <SleepChart sleepLogs={sleepLogs} />
      </div>
    </div>
  );
}
