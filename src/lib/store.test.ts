import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AppState, Task, DEFAULT_SETTINGS } from './types';
import { addTask, updateTask, deleteTask, addTimeLog, getActiveTasks, getTasksByCategory, getStaleTasks, getCategoryWarning, getTotalTimeForTask } from './store';

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'test-1',
    title: 'Test task',
    category: 'quick',
    date: null,
    repeatInterval: null,
    createdAt: new Date().toISOString(),
    completedAt: null,
    timeSpentMs: 0,
    subtasks: [],
    priority: 'normal',
    archived: false,
    ...overrides,
  };
}

function makeState(tasks: Task[] = []): AppState {
  return {
    tasks,
    timeLogs: [],
    settings: DEFAULT_SETTINGS,
  };
}

describe('addTask', () => {
  it('adds a task to state', () => {
    const state = makeState();
    const task = makeTask();
    const result = addTask(state, task);
    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0].title).toBe('Test task');
  });
});

describe('updateTask', () => {
  it('updates task fields', () => {
    const task = makeTask();
    const state = makeState([task]);
    const result = updateTask(state, 'test-1', { title: 'Updated' });
    expect(result.tasks[0].title).toBe('Updated');
  });
});

describe('deleteTask', () => {
  it('removes a task', () => {
    const task = makeTask();
    const state = makeState([task]);
    const result = deleteTask(state, 'test-1');
    expect(result.tasks).toHaveLength(0);
  });
});

describe('getActiveTasks', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-04T10:00:00'));
  });

  it('excludes completed tasks', () => {
    const state = makeState([
      makeTask({ completedAt: '2026-04-04T09:00:00Z' }),
    ]);
    expect(getActiveTasks(state)).toHaveLength(0);
  });

  it('excludes archived tasks', () => {
    const state = makeState([
      makeTask({ archived: true }),
    ]);
    expect(getActiveTasks(state)).toHaveLength(0);
  });

  it('excludes future-dated tasks', () => {
    const state = makeState([
      makeTask({ date: '2026-04-10' }),
    ]);
    expect(getActiveTasks(state)).toHaveLength(0);
  });

  it('includes tasks dated today', () => {
    const state = makeState([
      makeTask({ date: '2026-04-04' }),
    ]);
    expect(getActiveTasks(state)).toHaveLength(1);
  });

  it('includes tasks with no date', () => {
    const state = makeState([makeTask()]);
    expect(getActiveTasks(state)).toHaveLength(1);
  });
});

describe('getStaleTasks', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-04T10:00:00'));
  });

  it('returns tasks older than 3 weeks', () => {
    const state = makeState([
      makeTask({ createdAt: '2026-03-10T10:00:00Z' }),
    ]);
    expect(getStaleTasks(state)).toHaveLength(1);
  });

  it('does not return recent tasks', () => {
    const state = makeState([
      makeTask({ createdAt: '2026-04-01T10:00:00Z' }),
    ]);
    expect(getStaleTasks(state)).toHaveLength(0);
  });
});

describe('getCategoryWarning', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-04T10:00:00'));
  });

  it('warns when quick tasks at limit', () => {
    const tasks = Array.from({ length: 20 }, (_, i) =>
      makeTask({ id: `q-${i}`, category: 'quick' })
    );
    const state = makeState(tasks);
    expect(getCategoryWarning(state, 'quick')).toContain('limit reached');
  });

  it('warns when tasks at limit', () => {
    const tasks = Array.from({ length: 5 }, (_, i) =>
      makeTask({ id: `t-${i}`, category: 'tasks' })
    );
    const state = makeState(tasks);
    expect(getCategoryWarning(state, 'tasks')).toContain('limit reached');
  });

  it('no warning when under limit', () => {
    const state = makeState([makeTask()]);
    expect(getCategoryWarning(state, 'quick')).toBeNull();
  });
});

describe('getTotalTimeForTask', () => {
  it('sums time logs for a task', () => {
    const state = makeState([makeTask()]);
    state.timeLogs = [
      { taskId: 'test-1', subtaskId: null, startedAt: '', endedAt: '', durationMs: 5000 },
      { taskId: 'test-1', subtaskId: null, startedAt: '', endedAt: '', durationMs: 3000 },
      { taskId: 'other', subtaskId: null, startedAt: '', endedAt: '', durationMs: 10000 },
    ];
    expect(getTotalTimeForTask(state, 'test-1')).toBe(8000);
  });
});
