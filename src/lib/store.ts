import { AppState, Task, TimeLog, DEFAULT_SETTINGS } from './types';

const STORAGE_KEY = 'todo-list-state';

function getDefaultState(): AppState {
  return {
    tasks: [],
    timeLogs: [],
    settings: DEFAULT_SETTINGS,
  };
}

export function loadState(): AppState {
  if (typeof window === 'undefined') return getDefaultState();
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return getDefaultState();
  return JSON.parse(raw) as AppState;
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function addTask(state: AppState, task: Task): AppState {
  return { ...state, tasks: [...state.tasks, task] };
}

export function updateTask(state: AppState, taskId: string, updates: Partial<Task>): AppState {
  return {
    ...state,
    tasks: state.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t),
  };
}

export function deleteTask(state: AppState, taskId: string): AppState {
  return {
    ...state,
    tasks: state.tasks.filter(t => t.id !== taskId),
  };
}

export function addTimeLog(state: AppState, log: TimeLog): AppState {
  return { ...state, timeLogs: [...state.timeLogs, log] };
}

export function getActiveTasks(state: AppState): Task[] {
  const today = new Date().toISOString().split('T')[0];
  return state.tasks.filter(t => {
    if (t.archived || t.completedAt) return false;
    // Hide future-dated tasks
    if (t.date && t.date > today) return false;
    return true;
  });
}

export function getTasksByCategory(state: AppState) {
  const active = getActiveTasks(state);
  const sorted = sortByPriority(active);
  return {
    quick: sorted.filter(t => t.category === 'quick'),
    medium: sorted.filter(t => t.category === 'medium'),
    tasks: sorted.filter(t => t.category === 'tasks'),
    'delegate-ai': sorted.filter(t => t.category === 'delegate-ai'),
  };
}

function sortByPriority(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    // High priority first
    if (a.priority === 'high' && b.priority !== 'high') return -1;
    if (b.priority === 'high' && a.priority !== 'high') return 1;
    // Today's tasks first
    const today = new Date().toISOString().split('T')[0];
    const aToday = a.date === today;
    const bToday = b.date === today;
    if (aToday && !bToday) return -1;
    if (bToday && !aToday) return 1;
    // Then by creation date
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

export function getStaleTasks(state: AppState): Task[] {
  const threeWeeksAgo = new Date();
  threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);
  return state.tasks.filter(t => {
    if (t.archived || t.completedAt) return false;
    return new Date(t.createdAt) < threeWeeksAgo;
  });
}

export function getCategoryWarning(state: AppState, category: string): string | null {
  const categorized = getTasksByCategory(state);
  if (category === 'quick' && categorized.quick.length >= state.settings.quickTasksLimit) {
    return `Quick tasks limit reached (${state.settings.quickTasksLimit}). Complete some tasks first.`;
  }
  if (category === 'tasks' && categorized.tasks.length >= state.settings.tasksLimit) {
    return `Tasks limit reached (${state.settings.tasksLimit}). Is this super important? Otherwise, complete existing tasks first.`;
  }
  return null;
}

export function getTotalTimeForTask(state: AppState, taskId: string): number {
  return state.timeLogs
    .filter(l => l.taskId === taskId)
    .reduce((sum, l) => sum + l.durationMs, 0);
}
