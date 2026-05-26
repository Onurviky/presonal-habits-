import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  getLastNWeekStarts, addDays, getWeekLabel,
  getMonthsOfYear, getDaysOfMonth, getToday, getMonthName,
} from '../../utils/dateUtils';
import styles from './Progress.module.css';

// ── SVG Bar Chart ──────────────────────────────────────────────────────────
function BarChart({ data, color, unit = '', maxVal }) {
  const chartH = 90;
  const barW = Math.min(36, Math.floor(320 / data.length) - 6);
  const gap = Math.min(12, Math.floor(60 / data.length));
  const totalW = data.length * (barW + gap) - gap;
  const max = maxVal || Math.max(...data.map(d => d.value), 1);

  return (
    <svg width="100%" viewBox={`0 0 ${totalW} ${chartH + 34}`} preserveAspectRatio="xMidYMid meet">
      {data.map((item, i) => {
        const pct = max > 0 ? item.value / max : 0;
        const barH = Math.max(pct > 0 ? 3 : 0, pct * chartH);
        const x = i * (barW + gap);
        const y = chartH - barH;
        const isLast = i === data.length - 1;

        return (
          <g key={i}>
            <rect x={x} y={0} width={barW} height={chartH} fill="rgba(255,255,255,0.03)" rx={4} />
            <rect
              x={x} y={y} width={barW} height={barH}
              fill={isLast ? color : `${color}99`}
              rx={4}
            />
            <text x={x + barW / 2} y={chartH + 14} textAnchor="middle" fill="#64748b" fontSize={9} fontFamily="Inter,system-ui">
              {item.label}
            </text>
            {item.value > 0 && (
              <text x={x + barW / 2} y={y - 4} textAnchor="middle" fill="#94a3b8" fontSize={8} fontFamily="Inter,system-ui">
                {item.value}{unit}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ── Metric Card ────────────────────────────────────────────────────────────
function MetricCard({ title, icon, color, current, unit, trend, data, maxVal, description }) {
  const trendUp = trend > 0;
  const trendDown = trend < 0;
  const trendNeutral = trend === 0;

  return (
    <div className={styles.metricCard}>
      <div className={styles.metricHeader}>
        <div className={styles.metricIcon} style={{ color }}>{icon}</div>
        <div className={styles.metricTitle}>{title}</div>
      </div>
      <div className={styles.metricValue}>
        <span style={{ color }}>{current}{unit}</span>
        {trend !== null && (
          <span className={`${styles.trend} ${trendUp ? styles.trendUp : trendDown ? styles.trendDown : styles.trendNeutral}`}>
            {trendUp ? '↑' : trendDown ? '↓' : '→'} {Math.abs(trend)}{unit}
          </span>
        )}
      </div>
      {description && <div className={styles.metricDesc}>{description}</div>}
      <div className={styles.chartArea}>
        <BarChart data={data} color={color} unit={unit} maxVal={maxVal} />
      </div>
    </div>
  );
}

// ── Weekly data computation ────────────────────────────────────────────────
function useWeeklyData(habits, habitLogs, sleepLogs, microvictoriesBase, microvictoryLogs, todos, n = 10) {
  return useMemo(() => {
    const weekStarts = getLastNWeekStarts(n);

    return weekStarts.map(monday => {
      const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
      const label = getWeekLabel(monday);

      // Habits avg
      let habitSum = 0;
      days.forEach(d => {
        if (!habits.length) return;
        const log = habitLogs[d] || {};
        habitSum += Math.round((habits.filter(h => log[h.id]).length / habits.length) * 100);
      });
      const habitAvg = Math.round(habitSum / 7);

      // Sleep avg (only days with data)
      const sleepValues = days.map(d => sleepLogs[d]?.hours || 0).filter(h => h > 0);
      const sleepAvg = sleepValues.length
        ? parseFloat((sleepValues.reduce((s, h) => s + h, 0) / sleepValues.length).toFixed(1))
        : 0;

      // Microvictories avg per day
      let mvSum = 0;
      days.forEach(d => {
        const log = microvictoryLogs[d] || { completed: [], extra: [] };
        mvSum += (log.completed?.length || 0) + (log.extra?.length || 0);
      });
      const mvAvg = Math.round(mvSum / 7 * 10) / 10;

      // Todos completed this week
      const todosCount = todos.filter(t =>
        t.completedAt && days.includes(t.completedAt.slice(0, 10))
      ).length;

      return { label, habitAvg, sleepAvg, mvAvg, todosCount };
    });
  }, [habits, habitLogs, sleepLogs, microvictoriesBase, microvictoryLogs, todos, n]);
}

// ── Monthly data computation ───────────────────────────────────────────────
function useMonthlyData(habits, habitLogs, sleepLogs, microvictoriesBase, microvictoryLogs, todos) {
  return useMemo(() => {
    const year = new Date().getFullYear();
    const months = getMonthsOfYear(year);

    return months.map(({ month, label }) => {
      const days = getDaysOfMonth(year, month);
      const today = getToday();
      const pastDays = days.filter(d => d <= today);
      if (pastDays.length === 0) return { label, habitAvg: 0, sleepAvg: 0, mvAvg: 0, todosCount: 0 };

      // Habits avg
      let habitSum = 0;
      pastDays.forEach(d => {
        if (!habits.length) return;
        const log = habitLogs[d] || {};
        habitSum += Math.round((habits.filter(h => log[h.id]).length / habits.length) * 100);
      });
      const habitAvg = Math.round(habitSum / pastDays.length);

      // Sleep avg
      const sleepValues = pastDays.map(d => sleepLogs[d]?.hours || 0).filter(h => h > 0);
      const sleepAvg = sleepValues.length
        ? parseFloat((sleepValues.reduce((s, h) => s + h, 0) / sleepValues.length).toFixed(1))
        : 0;

      // Microvictories avg
      let mvSum = 0;
      pastDays.forEach(d => {
        const log = microvictoryLogs[d] || { completed: [], extra: [] };
        mvSum += (log.completed?.length || 0) + (log.extra?.length || 0);
      });
      const mvAvg = Math.round(mvSum / pastDays.length * 10) / 10;

      // Todos
      const todosCount = todos.filter(t =>
        t.completedAt && pastDays.includes(t.completedAt.slice(0, 10))
      ).length;

      return { label, habitAvg, sleepAvg, mvAvg, todosCount };
    });
  }, [habits, habitLogs, sleepLogs, microvictoriesBase, microvictoryLogs, todos]);
}

// ── Main component ─────────────────────────────────────────────────────────
export default function Progress() {
  const { habits, habitLogs, sleepLogs, microvictoriesBase, microvictoryLogs, todos } = useApp();
  const [tab, setTab] = useState('semanas');

  const weeklyData = useWeeklyData(habits, habitLogs, sleepLogs, microvictoriesBase, microvictoryLogs, todos);
  const monthlyData = useMonthlyData(habits, habitLogs, sleepLogs, microvictoriesBase, microvictoryLogs, todos);

  const data = tab === 'semanas' ? weeklyData : monthlyData;

  // Trend = current vs previous period
  function trend(key) {
    const last = data[data.length - 1]?.[key] ?? 0;
    const prev = data[data.length - 2]?.[key] ?? 0;
    const diff = Math.round((last - prev) * 10) / 10;
    return diff;
  }

  const current = data[data.length - 1] || {};

  // Overview line chart (normalized 0-100) for the summary
  const overviewData = useMemo(() => {
    return data.map(d => ({
      label: d.label,
      habit: d.habitAvg,
      sleep: Math.round((d.sleepAvg / 10) * 100), // normalize: 10h = 100%
      mv: Math.round((d.mvAvg / (microvictoriesBase.length || 10)) * 100),
    }));
  }, [data, microvictoriesBase.length]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Progreso</h2>
          <p className={styles.subtitle}>Evolución de tus métricas en el tiempo</p>
        </div>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === 'semanas' ? styles.tabActive : ''}`}
            onClick={() => setTab('semanas')}
          >
            Por semana
          </button>
          <button
            className={`${styles.tab} ${tab === 'meses' ? styles.tabActive : ''}`}
            onClick={() => setTab('meses')}
          >
            Por mes
          </button>
        </div>
      </div>

      {/* Summary row */}
      <div className={styles.summaryRow}>
        {[
          { key: 'habitAvg', label: 'Hábitos', icon: '✦', color: '#6366f1', unit: '%', max: 100 },
          { key: 'sleepAvg', label: 'Sueño', icon: '◐', color: '#10b981', unit: 'h', max: 12 },
          { key: 'mvAvg',    label: 'Microvictorias', icon: '★', color: '#a78bfa', unit: '', max: microvictoriesBase.length || 10 },
          { key: 'todosCount', label: 'Tareas', icon: '☑', color: '#f59e0b', unit: '', max: null },
        ].map(({ key, label, icon, color, unit }) => {
          const val = current[key] ?? 0;
          const t = trend(key);
          return (
            <div key={key} className={styles.summaryCard}>
              <div className={styles.summaryIcon} style={{ color }}>{icon}</div>
              <div className={styles.summaryLabel}>{label}</div>
              <div className={styles.summaryValue} style={{ color }}>
                {val}{unit}
              </div>
              <div className={`${styles.summaryTrend} ${t > 0 ? styles.trendUp : t < 0 ? styles.trendDown : styles.trendNeutral}`}>
                {t > 0 ? '↑' : t < 0 ? '↓' : '→'} {Math.abs(t)}{unit} vs período anterior
              </div>
            </div>
          );
        })}
      </div>

      {/* Overview multi-metric chart */}
      <div className={styles.overviewCard}>
        <div className={styles.cardTitle}>
          Vista general — {tab === 'semanas' ? 'últimas 10 semanas' : `${new Date().getFullYear()}`}
        </div>
        <OverviewChart data={overviewData} />
        <div className={styles.overviewLegend}>
          <span style={{ color: '#6366f1' }}>■ Hábitos %</span>
          <span style={{ color: '#10b981' }}>■ Sueño (normalizado)</span>
          <span style={{ color: '#a78bfa' }}>■ Microvictorias %</span>
        </div>
      </div>

      {/* Individual metric cards */}
      <div className={styles.metricsGrid}>
        <MetricCard
          title="Hábitos"
          icon="✦"
          color="#6366f1"
          current={current.habitAvg ?? 0}
          unit="%"
          trend={trend('habitAvg')}
          maxVal={100}
          data={data.map(d => ({ label: d.label, value: d.habitAvg }))}
          description={tab === 'semanas' ? 'Promedio diario de la semana' : 'Promedio diario del mes'}
        />
        <MetricCard
          title="Sueño"
          icon="◐"
          color="#10b981"
          current={current.sleepAvg ?? 0}
          unit="h"
          trend={trend('sleepAvg')}
          maxVal={12}
          data={data.map(d => ({ label: d.label, value: d.sleepAvg }))}
          description="Promedio de horas dormidas (días con registro)"
        />
        <MetricCard
          title="Microvictorias"
          icon="★"
          color="#a78bfa"
          current={current.mvAvg ?? 0}
          unit=""
          trend={trend('mvAvg')}
          maxVal={microvictoriesBase.length || 10}
          data={data.map(d => ({ label: d.label, value: d.mvAvg }))}
          description="Promedio diario de logros marcados"
        />
        <MetricCard
          title="Tareas completadas"
          icon="☑"
          color="#f59e0b"
          current={current.todosCount ?? 0}
          unit=""
          trend={trend('todosCount')}
          maxVal={null}
          data={data.map(d => ({ label: d.label, value: d.todosCount }))}
          description={tab === 'semanas' ? 'Total completadas en la semana' : 'Total completadas en el mes'}
        />
      </div>
    </div>
  );
}

// ── Overview multi-line SVG chart ──────────────────────────────────────────
function OverviewChart({ data }) {
  const chartH = 120;
  const chartW = 600;
  const padL = 10;
  const padR = 10;
  const innerW = chartW - padL - padR;
  const n = data.length;
  if (n < 2) return <div className={styles.noData}>Sin suficientes datos aún.</div>;

  const stepX = innerW / (n - 1);

  function points(key) {
    return data.map((d, i) => {
      const x = padL + i * stepX;
      const y = chartH - (d[key] / 100) * chartH;
      return `${x},${y}`;
    }).join(' ');
  }

  const LINES = [
    { key: 'habit', color: '#6366f1' },
    { key: 'sleep', color: '#10b981' },
    { key: 'mv',    color: '#a78bfa' },
  ];

  return (
    <svg width="100%" viewBox={`0 0 ${chartW} ${chartH + 24}`} preserveAspectRatio="xMidYMid meet">
      {/* Grid lines */}
      {[0, 25, 50, 75, 100].map(pct => {
        const y = chartH - (pct / 100) * chartH;
        return (
          <line key={pct} x1={padL} y1={y} x2={chartW - padR} y2={y}
            stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
        );
      })}

      {/* Lines */}
      {LINES.map(({ key, color }) => (
        <polyline key={key}
          points={points(key)}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          opacity={0.85}
        />
      ))}

      {/* Dots on last point */}
      {LINES.map(({ key, color }) => {
        const last = data[n - 1];
        const x = padL + (n - 1) * stepX;
        const y = chartH - (last[key] / 100) * chartH;
        return <circle key={key} cx={x} cy={y} r={4} fill={color} />;
      })}

      {/* X labels (every other one to avoid crowding) */}
      {data.map((d, i) => {
        if (n > 6 && i % 2 !== 0) return null;
        const x = padL + i * stepX;
        return (
          <text key={i} x={x} y={chartH + 18} textAnchor="middle"
            fill="#64748b" fontSize={9} fontFamily="Inter,system-ui">
            {d.label}
          </text>
        );
      })}
    </svg>
  );
}
