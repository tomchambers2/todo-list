import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { parseNaturalDate, getNextRepeatDate, formatDateDisplay, formatDuration } from './dates';

describe('parseNaturalDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-04T10:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('parses "today"', () => {
    expect(parseNaturalDate('today')).toEqual({ date: '2026-04-04', repeatInterval: null });
  });

  it('parses "tod" shorthand', () => {
    expect(parseNaturalDate('tod')).toEqual({ date: '2026-04-04', repeatInterval: null });
  });

  it('parses "tomorrow"', () => {
    expect(parseNaturalDate('tomorrow')).toEqual({ date: '2026-04-05', repeatInterval: null });
  });

  it('parses "next week"', () => {
    expect(parseNaturalDate('next week')).toEqual({ date: '2026-04-11', repeatInterval: null });
  });

  it('parses "next month"', () => {
    expect(parseNaturalDate('next month')).toEqual({ date: '2026-05-04', repeatInterval: null });
  });

  it('parses day names', () => {
    // April 4, 2026 is a Saturday. Monday would be April 6.
    const result = parseNaturalDate('monday');
    expect(result.date).toBe('2026-04-06');
    expect(result.repeatInterval).toBeNull();
  });

  it('parses "in X days"', () => {
    expect(parseNaturalDate('in 3 days')).toEqual({ date: '2026-04-07', repeatInterval: null });
  });

  it('parses "in X weeks"', () => {
    expect(parseNaturalDate('in 2 weeks')).toEqual({ date: '2026-04-18', repeatInterval: null });
  });

  it('parses ISO dates', () => {
    expect(parseNaturalDate('2026-06-15')).toEqual({ date: '2026-06-15', repeatInterval: null });
  });

  it('parses "every day"', () => {
    expect(parseNaturalDate('every day')).toEqual({ date: '2026-04-04', repeatInterval: 'daily' });
  });

  it('parses "daily"', () => {
    expect(parseNaturalDate('daily')).toEqual({ date: '2026-04-04', repeatInterval: 'daily' });
  });

  it('parses "weekly"', () => {
    expect(parseNaturalDate('weekly')).toEqual({ date: '2026-04-04', repeatInterval: 'weekly' });
  });

  it('parses "monthly"', () => {
    expect(parseNaturalDate('monthly')).toEqual({ date: '2026-04-04', repeatInterval: 'monthly' });
  });

  it('parses month + day like "jan 15"', () => {
    // Since April 2026 is past Jan 15 2026, should return Jan 15 2027
    const result = parseNaturalDate('jan 15');
    expect(result.date).toBe('2027-01-15');
  });

  it('returns null for empty/no date', () => {
    expect(parseNaturalDate('')).toEqual({ date: null, repeatInterval: null });
    expect(parseNaturalDate('no date')).toEqual({ date: null, repeatInterval: null });
  });
});

describe('getNextRepeatDate', () => {
  it('advances daily', () => {
    expect(getNextRepeatDate('2026-04-04', 'daily')).toBe('2026-04-05');
  });

  it('advances weekly', () => {
    expect(getNextRepeatDate('2026-04-04', 'weekly')).toBe('2026-04-11');
  });

  it('advances monthly', () => {
    expect(getNextRepeatDate('2026-04-04', 'monthly')).toBe('2026-05-04');
  });

  it('advances yearly', () => {
    expect(getNextRepeatDate('2026-04-04', 'yearly')).toBe('2027-04-04');
  });

  it('skips weekends for weekdays', () => {
    // Friday April 3 -> Monday April 6
    expect(getNextRepeatDate('2026-04-03', 'weekdays')).toBe('2026-04-06');
  });
});

describe('formatDateDisplay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-04T10:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows "Today" for today', () => {
    expect(formatDateDisplay('2026-04-04')).toBe('Today');
  });

  it('shows "Tomorrow" for tomorrow', () => {
    expect(formatDateDisplay('2026-04-05')).toBe('Tomorrow');
  });

  it('shows "No date" for null', () => {
    expect(formatDateDisplay(null)).toBe('No date');
  });
});

describe('formatDuration', () => {
  it('formats seconds', () => {
    expect(formatDuration(5000)).toBe('5s');
  });

  it('formats minutes and seconds', () => {
    expect(formatDuration(125000)).toBe('2m 5s');
  });

  it('formats hours and minutes', () => {
    expect(formatDuration(3725000)).toBe('1h 2m');
  });
});
