export type TaskCategory = 'quick' | 'medium' | 'tasks' | 'delegate-ai';

export type RepeatInterval = 'daily' | 'weekdays' | 'weekly' | 'monthly' | 'yearly';

export interface Task {
  id: string;
  title: string;
  category: TaskCategory;
  date: string | null; // ISO date string
  repeatInterval: RepeatInterval | null;
  createdAt: string;
  completedAt: string | null;
  timeSpentMs: number;
  subtasks: Subtask[];
  priority: 'normal' | 'high';
  archived: boolean;
}

export interface Subtask {
  id: string;
  title: string;
  completedAt: string | null;
  timeSpentMs: number;
}

export interface TimeLog {
  taskId: string;
  subtaskId: string | null;
  startedAt: string;
  endedAt: string;
  durationMs: number;
}

export interface AppState {
  tasks: Task[];
  timeLogs: TimeLog[];
  settings: Settings;
}

export interface Settings {
  quickTasksSchedule: { start: string; end: string }; // "08:00", "09:00"
  mediumTasksSchedule: { start: string; end: string };
  tasksSchedule: { start: string; end: string };
  quickTasksLimit: number;
  tasksLimit: number;
}

export const DEFAULT_SETTINGS: Settings = {
  quickTasksSchedule: { start: '08:00', end: '09:00' },
  mediumTasksSchedule: { start: '09:00', end: '12:00' },
  tasksSchedule: { start: '13:00', end: '17:00' },
  quickTasksLimit: 20,
  tasksLimit: 5,
};

export type ViewMode = 'plan' | 'do';

export interface SortResult {
  category: TaskCategory;
  date: string | null;
  repeatInterval: RepeatInterval | null;
  subtasks: string[];
  warning: string | null;
}
