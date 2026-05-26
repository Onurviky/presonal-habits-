const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export function getToday() {
  const now = new Date();
  return formatDate(now);
}

export function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDate(str) {
  // Parse 'YYYY-MM-DD' avoiding timezone issues
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(dateStr, n) {
  const d = parseDate(dateStr);
  d.setDate(d.getDate() + n);
  return formatDate(d);
}

export function getDayName(dateStr) {
  return DAY_NAMES[parseDate(dateStr).getDay()];
}

export function getDayShort(dateStr) {
  return DAY_SHORT[parseDate(dateStr).getDay()];
}

export function getMonthName(month) {
  return MONTH_NAMES[month];
}

export function formatDisplayDate(dateStr) {
  const d = parseDate(dateStr);
  const dayName = DAY_NAMES[d.getDay()];
  const day = d.getDate();
  const month = MONTH_NAMES[d.getMonth()];
  const year = d.getFullYear();
  return `${dayName}, ${day} de ${month} ${year}`;
}

export function formatShortDate(dateStr) {
  const d = parseDate(dateStr);
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()].slice(0, 3)}`;
}

export function getLastNDays(n) {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    days.push(addDays(getToday(), -i));
  }
  return days;
}

export function calculateSleepHours(bedtime, wakeTime) {
  if (!bedtime || !wakeTime) return 0;
  const [bH, bM] = bedtime.split(':').map(Number);
  const [wH, wM] = wakeTime.split(':').map(Number);
  let bedMins = bH * 60 + bM;
  let wakeMins = wH * 60 + wM;
  if (wakeMins <= bedMins) wakeMins += 24 * 60;
  return parseFloat(((wakeMins - bedMins) / 60).toFixed(1));
}

export function getDaysInCurrentMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const str = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push(str);
  }
  return days;
}

export function isSameMonth(dateStr) {
  const now = new Date();
  const d = parseDate(dateStr);
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

export function getMondayOfWeek(dateStr) {
  const d = parseDate(dateStr);
  const day = d.getDay(); // 0=Dom, 1=Lun...
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return formatDate(d);
}

export function getLastNWeekStarts(n) {
  const monday = getMondayOfWeek(getToday());
  const weeks = [];
  for (let i = n - 1; i >= 0; i--) {
    weeks.push(addDays(monday, -i * 7));
  }
  return weeks;
}

export function getWeekLabel(mondayStr) {
  const d = parseDate(mondayStr);
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()].slice(0, 3)}`;
}

export function getMonthsOfYear(year) {
  const months = [];
  for (let m = 0; m < 12; m++) {
    months.push({ year, month: m, label: MONTH_NAMES[m].slice(0, 3) });
  }
  return months;
}

export function getDaysOfMonth(year, month) {
  const days = [];
  const count = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= count; d++) {
    days.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  }
  return days;
}

export function getFirstDayOfMonth(year, month) {
  // 0=Dom 1=Lun... convert to Mon-first (0=Lun 6=Dom)
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

export function getGreeting(name) {
  const hour = new Date().getHours();
  if (hour < 12) return `¡Buenos días, ${name}!`;
  if (hour < 19) return `¡Buenas tardes, ${name}!`;
  return `¡Buenas noches, ${name}!`;
}
