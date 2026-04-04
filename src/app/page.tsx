'use client';

import { useState, useEffect, useCallback } from 'react';
import { AppState, Task, TaskCategory, Subtask, ViewMode, TimeLog } from '@/lib/types';
import { loadState, saveState, addTask, updateTask, deleteTask, addTimeLog, getTasksByCategory, getStaleTasks, getCategoryWarning, getTotalTimeForTask } from '@/lib/store';
import { parseNaturalDate, getNextRepeatDate, formatDateDisplay, formatDuration } from '@/lib/dates';
import { v4 as uuidv4 } from 'uuid';

function CategoryIcon({ category }: { category: TaskCategory }) {
  switch (category) {
    case 'quick': return <span className="text-success">&#9889;</span>;
    case 'medium': return <span className="text-warning">&#9201;</span>;
    case 'tasks': return <span className="text-accent">&#128736;</span>;
    case 'delegate-ai': return <span className="text-purple-400">&#129302;</span>;
  }
}

function CategoryLabel({ category }: { category: TaskCategory }) {
  const labels: Record<TaskCategory, string> = {
    quick: 'Quick Tasks',
    medium: 'Medium Tasks',
    tasks: 'Tasks',
    'delegate-ai': 'Delegate to AI',
  };
  return <>{labels[category]}</>;
}

export default function Home() {
  const [state, setState] = useState<AppState | null>(null);
  const [mode, setMode] = useState<ViewMode>('plan');
  const [input, setInput] = useState('');
  const [dateInput, setDateInput] = useState('');
  const [sorting, setSorting] = useState(false);
  const [activeTimer, setActiveTimer] = useState<{ taskId: string; subtaskId: string | null; startedAt: number } | null>(null);
  const [timerDisplay, setTimerDisplay] = useState(0);
  const [stalePrompt, setStalePrompt] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  useEffect(() => {
    setState(loadState());
  }, []);

  useEffect(() => {
    if (state) saveState(state);
  }, [state]);

  // Timer tick
  useEffect(() => {
    if (!activeTimer) return;
    const interval = setInterval(() => {
      setTimerDisplay(Date.now() - activeTimer.startedAt);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTimer]);

  // Check for stale tasks
  useEffect(() => {
    if (!state) return;
    const stale = getStaleTasks(state);
    if (stale.length > 0 && !stalePrompt) {
      setStalePrompt(stale[0]);
    }
  }, [state, stalePrompt]);

  const persist = useCallback((newState: AppState) => {
    setState(newState);
  }, []);

  const handleAddTask = async () => {
    if (!input.trim() || !state) return;

    setSorting(true);
    try {
      const res = await fetch('/api/sort', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskTitle: input.trim(), existingTasks: state.tasks }),
      });
      const sortResult = await res.json();

      const dateInfo = dateInput
        ? parseNaturalDate(dateInput)
        : { date: sortResult.suggestedDate || null, repeatInterval: sortResult.repeatInterval || null };

      const warning = getCategoryWarning(state, sortResult.category);
      if (warning && sortResult.category === 'tasks') {
        if (!confirm(warning + '\n\nAdd anyway?')) {
          setSorting(false);
          return;
        }
      }

      const task: Task = {
        id: uuidv4(),
        title: input.trim(),
        category: sortResult.category as TaskCategory,
        date: dateInfo.date,
        repeatInterval: dateInfo.repeatInterval,
        createdAt: new Date().toISOString(),
        completedAt: null,
        timeSpentMs: 0,
        subtasks: (sortResult.subtasks || []).map((s: string) => ({
          id: uuidv4(),
          title: s,
          completedAt: null,
          timeSpentMs: 0,
        })),
        priority: 'normal',
        archived: false,
      };

      persist(addTask(state, task));
      setInput('');
      setDateInput('');
    } catch (err) {
      console.error('Sort failed:', err);
      alert('Failed to sort task. Check API key configuration.');
    }
    setSorting(false);
  };

  const handleComplete = (taskId: string) => {
    if (!state) return;
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    if (task.repeatInterval && task.date) {
      const nextDate = getNextRepeatDate(task.date, task.repeatInterval);
      persist(updateTask(state, taskId, { date: nextDate }));
    } else {
      persist(updateTask(state, taskId, { completedAt: new Date().toISOString() }));
    }
  };

  const handleStartTimer = (taskId: string, subtaskId: string | null) => {
    setActiveTimer({ taskId, subtaskId, startedAt: Date.now() });
    setTimerDisplay(0);
  };

  const handleStopTimer = () => {
    if (!activeTimer || !state) return;
    const duration = Date.now() - activeTimer.startedAt;
    const log: TimeLog = {
      taskId: activeTimer.taskId,
      subtaskId: activeTimer.subtaskId,
      startedAt: new Date(activeTimer.startedAt).toISOString(),
      endedAt: new Date().toISOString(),
      durationMs: duration,
    };

    let newState = addTimeLog(state, log);

    // Update subtask time if applicable
    if (activeTimer.subtaskId) {
      const task = newState.tasks.find(t => t.id === activeTimer.taskId);
      if (task) {
        const updatedSubtasks = task.subtasks.map(s =>
          s.id === activeTimer.subtaskId
            ? { ...s, timeSpentMs: s.timeSpentMs + duration }
            : s
        );
        newState = updateTask(newState, activeTimer.taskId, { subtasks: updatedSubtasks });
      }
    }

    newState = updateTask(newState, activeTimer.taskId, {
      timeSpentMs: (newState.tasks.find(t => t.id === activeTimer.taskId)?.timeSpentMs || 0) + duration,
    });

    persist(newState);
    setActiveTimer(null);
    setTimerDisplay(0);
  };

  const handleCompleteSubtask = (taskId: string, subtaskId: string) => {
    if (!state) return;
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;
    const updatedSubtasks = task.subtasks.map(s =>
      s.id === subtaskId ? { ...s, completedAt: new Date().toISOString() } : s
    );
    const allDone = updatedSubtasks.every(s => s.completedAt);
    persist(updateTask(state, taskId, {
      subtasks: updatedSubtasks,
      completedAt: allDone ? new Date().toISOString() : null,
    }));
  };

  const handleStaleAction = (action: 'priority' | 'archive') => {
    if (!stalePrompt || !state) return;
    if (action === 'priority') {
      persist(updateTask(state, stalePrompt.id, { priority: 'high' }));
    } else {
      persist(updateTask(state, stalePrompt.id, { archived: true }));
    }
    setStalePrompt(null);
  };

  const handleDelete = (taskId: string) => {
    if (!state) return;
    persist(deleteTask(state, taskId));
  };

  const handleEditSave = (taskId: string) => {
    if (!state || !editTitle.trim()) return;
    persist(updateTask(state, taskId, { title: editTitle.trim() }));
    setEditingTask(null);
    setEditTitle('');
  };

  const handleCategoryChange = (taskId: string, newCategory: TaskCategory) => {
    if (!state) return;
    persist(updateTask(state, taskId, { category: newCategory }));
  };

  if (!state) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  const categorized = getTasksByCategory(state);
  const completedToday = state.tasks.filter(t => {
    if (!t.completedAt) return false;
    return t.completedAt.startsWith(new Date().toISOString().split('T')[0]);
  });
  const todayTimeMs = state.timeLogs
    .filter(l => l.startedAt.startsWith(new Date().toISOString().split('T')[0]))
    .reduce((sum, l) => sum + l.durationMs, 0);

  // Do mode: find current task
  const getCurrentDoTask = () => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const { settings } = state;

    if (timeStr >= settings.quickTasksSchedule.start && timeStr < settings.quickTasksSchedule.end) {
      return { task: categorized.quick[0], category: 'quick' as const };
    }
    if (timeStr >= settings.mediumTasksSchedule.start && timeStr < settings.mediumTasksSchedule.end) {
      return { task: categorized.medium[0], category: 'medium' as const };
    }
    if (timeStr >= settings.tasksSchedule.start && timeStr < settings.tasksSchedule.end) {
      const task = categorized.tasks[0];
      if (task) {
        const nextSubtask = task.subtasks.find(s => !s.completedAt);
        return { task, category: 'tasks' as const, subtask: nextSubtask };
      }
    }
    // Default: show first available task from any category
    const anyTask = categorized.quick[0] || categorized.medium[0] || categorized.tasks[0];
    return { task: anyTask, category: anyTask?.category };
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Todo List</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setMode('plan')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'plan' ? 'bg-accent text-white' : 'bg-card text-muted hover:bg-card-hover'}`}
          >
            Plan
          </button>
          <button
            onClick={() => setMode('do')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'do' ? 'bg-accent text-white' : 'bg-card text-muted hover:bg-card-hover'}`}
          >
            Do
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex gap-4 mb-6 text-sm text-muted">
        <span>Completed today: {completedToday.length}</span>
        <span>Time tracked: {formatDuration(todayTimeMs)}</span>
      </div>

      {/* Stale task prompt */}
      {stalePrompt && (
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 mb-6">
          <p className="text-sm mb-2">
            <span className="font-medium text-warning">Stale task:</span> &ldquo;{stalePrompt.title}&rdquo; is over 3 weeks old.
          </p>
          <div className="flex gap-2">
            <button onClick={() => handleStaleAction('priority')} className="text-xs px-3 py-1 bg-warning/20 rounded hover:bg-warning/30">
              Mark High Priority
            </button>
            <button onClick={() => handleStaleAction('archive')} className="text-xs px-3 py-1 bg-danger/20 rounded hover:bg-danger/30 text-danger">
              Remove
            </button>
            <button onClick={() => setStalePrompt(null)} className="text-xs px-3 py-1 bg-card rounded hover:bg-card-hover">
              Later
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-card rounded-lg p-4 mb-6 border border-border">
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddTask()}
            placeholder="Add a task..."
            className="flex-1 bg-transparent border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
            disabled={sorting}
          />
          <button
            onClick={handleAddTask}
            disabled={sorting || !input.trim()}
            className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sorting ? 'Sorting...' : 'Add'}
          </button>
        </div>
        <input
          type="text"
          value={dateInput}
          onChange={e => setDateInput(e.target.value)}
          placeholder="Date (optional): today, tomorrow, monday, every week, jan 15..."
          className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-xs text-muted focus:outline-none focus:border-accent"
        />
      </div>

      {/* Plan Mode */}
      {mode === 'plan' && (
        <div className="space-y-6">
          {(['quick', 'medium', 'tasks', 'delegate-ai'] as TaskCategory[]).map(category => {
            const tasks = categorized[category];
            const warning = getCategoryWarning(state, category);
            const limit = category === 'quick' ? state.settings.quickTasksLimit : category === 'tasks' ? state.settings.tasksLimit : null;

            return (
              <div key={category}>
                <div className="flex items-center gap-2 mb-3">
                  <CategoryIcon category={category} />
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
                    <CategoryLabel category={category} />
                  </h2>
                  <span className="text-xs text-muted">
                    ({tasks.length}{limit ? `/${limit}` : ''})
                  </span>
                </div>
                {warning && (
                  <p className="text-xs text-warning mb-2">{warning}</p>
                )}
                {tasks.length === 0 ? (
                  <p className="text-xs text-muted/50 pl-6">No tasks</p>
                ) : (
                  <div className="space-y-1">
                    {tasks.map(task => (
                      <div key={task.id} className="bg-card border border-border rounded-lg p-3 hover:bg-card-hover transition-colors group">
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => handleComplete(task.id)}
                            className="mt-0.5 w-5 h-5 rounded-full border-2 border-muted hover:border-success flex-shrink-0 transition-colors"
                          />
                          <div className="flex-1 min-w-0">
                            {editingTask === task.id ? (
                              <div className="flex gap-2">
                                <input
                                  value={editTitle}
                                  onChange={e => setEditTitle(e.target.value)}
                                  onKeyDown={e => e.key === 'Enter' && handleEditSave(task.id)}
                                  className="flex-1 bg-transparent border border-border rounded px-2 py-1 text-sm focus:outline-none focus:border-accent"
                                  autoFocus
                                />
                                <button onClick={() => handleEditSave(task.id)} className="text-xs text-success">Save</button>
                                <button onClick={() => setEditingTask(null)} className="text-xs text-muted">Cancel</button>
                              </div>
                            ) : (
                              <p className={`text-sm ${task.priority === 'high' ? 'text-danger font-medium' : ''}`}>
                                {task.priority === 'high' && '!! '}
                                {task.title}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted">
                              {task.date && <span>{formatDateDisplay(task.date)}</span>}
                              {task.repeatInterval && <span>Repeats {task.repeatInterval}</span>}
                              {task.timeSpentMs > 0 && <span>{formatDuration(task.timeSpentMs)}</span>}
                            </div>
                            {task.subtasks.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {task.subtasks.map(sub => (
                                  <div key={sub.id} className="flex items-center gap-2 text-xs">
                                    <button
                                      onClick={() => handleCompleteSubtask(task.id, sub.id)}
                                      className={`w-3.5 h-3.5 rounded-sm border flex-shrink-0 transition-colors ${sub.completedAt ? 'bg-success border-success' : 'border-muted hover:border-success'}`}
                                    />
                                    <span className={sub.completedAt ? 'line-through text-muted/50' : ''}>{sub.title}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <select
                              value={task.category}
                              onChange={e => handleCategoryChange(task.id, e.target.value as TaskCategory)}
                              className="text-xs bg-card border border-border rounded px-1 py-0.5"
                            >
                              <option value="quick">Quick</option>
                              <option value="medium">Medium</option>
                              <option value="tasks">Tasks</option>
                              <option value="delegate-ai">AI</option>
                            </select>
                            <button
                              onClick={() => { setEditingTask(task.id); setEditTitle(task.title); }}
                              className="text-xs text-muted hover:text-foreground px-1"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(task.id)}
                              className="text-xs text-muted hover:text-danger px-1"
                            >
                              Del
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Future tasks */}
          {(() => {
            const today = new Date().toISOString().split('T')[0];
            const futureTasks = state.tasks.filter(t => !t.archived && !t.completedAt && t.date && t.date > today);
            if (futureTasks.length === 0) return null;
            return (
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted mb-3">Upcoming</h2>
                <div className="space-y-1">
                  {futureTasks.sort((a, b) => (a.date || '').localeCompare(b.date || '')).map(task => (
                    <div key={task.id} className="bg-card/50 border border-border/50 rounded-lg p-3 text-muted">
                      <div className="flex items-center gap-2">
                        <CategoryIcon category={task.category} />
                        <span className="text-sm">{task.title}</span>
                        <span className="text-xs ml-auto">{formatDateDisplay(task.date)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Do Mode */}
      {mode === 'do' && (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          {(() => {
            const current = getCurrentDoTask();
            if (!current.task) {
              return (
                <div className="text-center">
                  <p className="text-2xl mb-2">All done!</p>
                  <p className="text-muted">No tasks to work on right now.</p>
                </div>
              );
            }

            const { task, subtask } = current;
            const isTimerRunning = activeTimer?.taskId === task.id;
            const totalTime = getTotalTimeForTask(state, task.id);

            return (
              <div className="w-full max-w-md text-center">
                <div className="mb-2">
                  <CategoryIcon category={task.category} />
                  <span className="text-xs text-muted ml-2 uppercase"><CategoryLabel category={task.category} /></span>
                </div>

                <h2 className={`text-2xl font-bold mb-2 ${task.priority === 'high' ? 'text-danger' : ''}`}>
                  {task.title}
                </h2>

                {subtask && (
                  <p className="text-muted mb-4">
                    Current step: <span className="text-foreground">{subtask.title}</span>
                  </p>
                )}

                {task.date && (
                  <p className="text-xs text-muted mb-4">{formatDateDisplay(task.date)}</p>
                )}

                {/* Timer */}
                <div className="text-5xl font-mono mb-8">
                  {isTimerRunning ? formatDuration(timerDisplay) : formatDuration(0)}
                </div>

                <div className="flex gap-4 justify-center mb-6">
                  {!isTimerRunning ? (
                    <button
                      onClick={() => handleStartTimer(task.id, subtask?.id || null)}
                      className="px-8 py-3 bg-success text-white rounded-xl text-lg font-medium hover:bg-success/80 transition-colors"
                    >
                      Start
                    </button>
                  ) : (
                    <button
                      onClick={handleStopTimer}
                      className="px-8 py-3 bg-danger text-white rounded-xl text-lg font-medium hover:bg-danger/80 transition-colors"
                    >
                      Stop
                    </button>
                  )}
                </div>

                <div className="flex gap-4 justify-center">
                  {subtask ? (
                    <button
                      onClick={() => { if (isTimerRunning) handleStopTimer(); handleCompleteSubtask(task.id, subtask.id); }}
                      className="px-6 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover"
                    >
                      Complete Step
                    </button>
                  ) : (
                    <button
                      onClick={() => { if (isTimerRunning) handleStopTimer(); handleComplete(task.id); }}
                      className="px-6 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover"
                    >
                      Done
                    </button>
                  )}
                  <button
                    onClick={() => { if (isTimerRunning) handleStopTimer(); }}
                    className="px-6 py-2 bg-card text-muted rounded-lg text-sm hover:bg-card-hover"
                    disabled={!isTimerRunning}
                  >
                    Skip
                  </button>
                </div>

                {totalTime > 0 && (
                  <p className="text-xs text-muted mt-6">Total time on this task: {formatDuration(totalTime)}</p>
                )}

                {/* Subtask progress */}
                {task.subtasks.length > 0 && (
                  <div className="mt-8 text-left">
                    <p className="text-xs text-muted mb-2">Progress: {task.subtasks.filter(s => s.completedAt).length}/{task.subtasks.length}</p>
                    <div className="w-full bg-border rounded-full h-2">
                      <div
                        className="bg-accent rounded-full h-2 transition-all"
                        style={{ width: `${(task.subtasks.filter(s => s.completedAt).length / task.subtasks.length) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
