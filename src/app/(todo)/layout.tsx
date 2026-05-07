import { TodoShell } from '@/components/TodoShell';

export default function TodoLayout({ children }: { children: React.ReactNode }) {
  return <TodoShell>{children}</TodoShell>;
}
