'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Task, AppState } from '@/lib/types';
import { loadState, saveState, addTask, completeTask, uncompleteTask, deleteTask } from '@/lib/store';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 6L5 8.5L9.5 3.5" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 4.5h10M6.5 2.5h3M5.5 4.5v7.5M8 4.5V12M10.5 4.5v7.5M4.5 4.5l.5 9h6l.5-9" />
    </svg>
  );
}

function TaskItem({
  task,
  onToggle,
  onDelete,
}: {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const isCompleted = task.completedAt !== null;

  return (
    <div className={`task-enter group flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 ${
      isCompleted
        ? 'bg-card/50 border-border/50'
        : 'bg-card border-border hover:border-accent/30 hover:bg-card-hover'
    }`}>
      {/* Checkbox */}
      <button
        onClick={() => onToggle(task.id)}
        className={`flex-shrink-0 w-5 h-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center ${
          isCompleted
            ? 'bg-success border-success'
            : 'border-muted/50 hover:border-accent'
        }`}
      >
        {isCompleted && (
          <CheckIcon className="w-3 h-3 text-white check-animate" />
        )}
      </button>

      {/* Title */}
      <span className={`flex-1 text-[15px] leading-snug transition-all duration-200 ${
        isCompleted ? 'text-muted line-through' : 'text-foreground'
      }`}>
        {task.title}
      </span>

      {/* Delete */}
      <button
        onClick={() => onDelete(task.id)}
        className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1 rounded-md text-muted hover:text-danger hover:bg-danger/10 transition-all duration-150"
      >
        <TrashIcon className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function Home() {
  const [state, setState] = useState<AppState | null>(null);
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setState(loadState());
  }, []);

  useEffect(() => {
    if (state) saveState(state);
  }, [state]);

  const persist = useCallback((newState: AppState) => {
    setState(newState);
  }, []);

  const handleAdd = () => {
    if (!input.trim() || !state) return;
    const task: Task = {
      id: generateId(),
      title: input.trim(),
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
    persist(addTask(state, task));
    setInput('');
    inputRef.current?.focus();
  };

  const handleToggle = (id: string) => {
    if (!state) return;
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;
    persist(task.completedAt ? uncompleteTask(state, id) : completeTask(state, id));
  };

  const handleDelete = (id: string) => {
    if (!state) return;
    persist(deleteTask(state, id));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
  };

  if (!state) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const activeTasks = state.tasks.filter(t => !t.completedAt);
  const completedTasks = state.tasks.filter(t => t.completedAt);

  return (
    <div className="max-w-lg mx-auto px-5 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
        {activeTasks.length > 0 && (
          <p className="text-sm text-muted mt-1">
            {activeTasks.length} remaining{completedTasks.length > 0 ? ` \u00b7 ${completedTasks.length} done` : ''}
          </p>
        )}
      </div>

      {/* Input */}
      <div className="relative mb-8">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What needs to be done?"
          className="w-full bg-card border border-border rounded-xl px-4 py-3.5 text-[15px] placeholder:text-muted/60 transition-all duration-200 hover:border-accent/30"
        />
        {input.trim() && (
          <button
            onClick={handleAdd}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent-hover transition-colors duration-150"
          >
            Add
          </button>
        )}
      </div>

      {/* Empty state */}
      {state.tasks.length === 0 && (
        <div className="text-center py-16">
          <div className="text-4xl mb-3 opacity-30">
            <svg className="w-12 h-12 mx-auto text-muted/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
          </div>
          <p className="text-muted text-sm">No tasks yet. Add one above to get started.</p>
        </div>
      )}

      {/* Active tasks */}
      {activeTasks.length > 0 && (
        <div className="space-y-2 mb-8">
          {activeTasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Completed tasks */}
      {completedTasks.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted/60">
              Completed
            </h2>
            <div className="flex-1 h-px bg-border/50" />
          </div>
          <div className="space-y-1.5">
            {completedTasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
