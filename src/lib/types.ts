export interface Task {
  id: string;
  title: string;
  createdAt: string;
  completedAt: string | null;
}

export interface AppState {
  tasks: Task[];
}
