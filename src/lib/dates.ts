// Todoist-style natural language date parsing

export function parseNaturalDate(input: string): { date: string | null; repeatInterval: string | null } {
  const lower = input.toLowerCase().trim();
  const today = new Date();

  // Repeat patterns
  if (lower === 'every day' || lower === 'daily') {
    return { date: formatDate(today), repeatInterval: 'daily' };
  }
  if (lower === 'every weekday' || lower === 'weekdays') {
    return { date: formatDate(getNextWeekday(today)), repeatInterval: 'weekdays' };
  }
  if (lower === 'every week' || lower === 'weekly') {
    return { date: formatDate(today), repeatInterval: 'weekly' };
  }
  if (lower === 'every month' || lower === 'monthly') {
    return { date: formatDate(today), repeatInterval: 'monthly' };
  }
  if (lower === 'every year' || lower === 'yearly') {
    return { date: formatDate(today), repeatInterval: 'yearly' };
  }

  // Relative dates
  if (lower === 'today' || lower === 'tod') {
    return { date: formatDate(today), repeatInterval: null };
  }
  if (lower === 'tomorrow' || lower === 'tom') {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return { date: formatDate(d), repeatInterval: null };
  }
  if (lower === 'next week') {
    const d = new Date(today);
    d.setDate(d.getDate() + 7);
    return { date: formatDate(d), repeatInterval: null };
  }
  if (lower === 'next month') {
    const d = new Date(today);
    d.setMonth(d.getMonth() + 1);
    return { date: formatDate(d), repeatInterval: null };
  }

  // Day names
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayIndex = days.indexOf(lower);
  if (dayIndex !== -1) {
    const d = new Date(today);
    const currentDay = d.getDay();
    const diff = (dayIndex - currentDay + 7) % 7 || 7;
    d.setDate(d.getDate() + diff);
    return { date: formatDate(d), repeatInterval: null };
  }

  // "in X days/weeks"
  const inMatch = lower.match(/^in (\d+) (day|week|month)s?$/);
  if (inMatch) {
    const num = parseInt(inMatch[1]);
    const d = new Date(today);
    if (inMatch[2] === 'day') d.setDate(d.getDate() + num);
    else if (inMatch[2] === 'week') d.setDate(d.getDate() + num * 7);
    else if (inMatch[2] === 'month') d.setMonth(d.getMonth() + num);
    return { date: formatDate(d), repeatInterval: null };
  }

  // ISO date (YYYY-MM-DD)
  const isoMatch = lower.match(/^\d{4}-\d{2}-\d{2}$/);
  if (isoMatch) {
    return { date: lower, repeatInterval: null };
  }

  // "Jan 15", "January 15", "15 Jan"
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const monthDayMatch = lower.match(/^(\w+)\s+(\d{1,2})$/);
  if (monthDayMatch) {
    const monthIdx = months.findIndex(m => monthDayMatch[1].startsWith(m));
    if (monthIdx !== -1) {
      const d = new Date(today.getFullYear(), monthIdx, parseInt(monthDayMatch[2]));
      if (d < today) d.setFullYear(d.getFullYear() + 1);
      return { date: formatDate(d), repeatInterval: null };
    }
  }

  // No date
  if (lower === '' || lower === 'no date' || lower === 'none') {
    return { date: null, repeatInterval: null };
  }

  return { date: null, repeatInterval: null };
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function getNextWeekday(d: Date): Date {
  const result = new Date(d);
  const day = result.getDay();
  if (day === 0) result.setDate(result.getDate() + 1);
  else if (day === 6) result.setDate(result.getDate() + 2);
  return result;
}

export function getNextRepeatDate(currentDate: string, interval: string): string {
  const d = new Date(currentDate);
  switch (interval) {
    case 'daily':
      d.setDate(d.getDate() + 1);
      break;
    case 'weekdays': {
      d.setDate(d.getDate() + 1);
      while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
      break;
    }
    case 'weekly':
      d.setDate(d.getDate() + 7);
      break;
    case 'monthly':
      d.setMonth(d.getMonth() + 1);
      break;
    case 'yearly':
      d.setFullYear(d.getFullYear() + 1);
      break;
  }
  return formatDate(d);
}

export function formatDateDisplay(dateStr: string | null): string {
  if (!dateStr) return 'No date';
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (d.getTime() === today.getTime()) return 'Today';
  if (d.getTime() === tomorrow.getTime()) return 'Tomorrow';

  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}
