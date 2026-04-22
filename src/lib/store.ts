import { AppState, Task } from './types';

const STORAGE_KEY = 'todo-list-state';

function getDefaultState(): AppState {
  return { tasks: [] };
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
  return { ...state, tasks: [task, ...state.tasks] };
}

export function completeTask(state: AppState, taskId: string): AppState {
  return {
    ...state,
    tasks: state.tasks.map(t =>
      t.id === taskId ? { ...t, completedAt: new Date().toISOString() } : t
    ),
  };
}

export function uncompleteTask(state: AppState, taskId: string): AppState {
  return {
    ...state,
    tasks: state.tasks.map(t =>
      t.id === taskId ? { ...t, completedAt: null } : t
    ),
  };
}

export function deleteTask(state: AppState, taskId: string): AppState {
  return { ...state, tasks: state.tasks.filter(t => t.id !== taskId) };
}
