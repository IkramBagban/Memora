import { create } from 'zustand';
import type { Todo, Priority } from '@memora/shared';
import { addDays, subDays } from 'date-fns';

interface TodoStore {
  todos: Todo[];
  isLoading: boolean;
  filter: 'all' | 'today' | 'high_priority';
  toggleComplete: (id: string) => void;
  setFilter: (filter: 'all' | 'today' | 'high_priority') => void;
}

export const useTodoStore = create<TodoStore>((set) => ({
  todos: [
    {
      id: '1',
      user_id: 'user1',
      title: 'Review PR for landing page',
      description: 'Check mobile responsiveness',
      is_completed: false,
      priority: 'high',
      due_date: new Date().toISOString().split('T')[0],
      reminder_at: null,
      reminder_channel: null,
      reminder_sent: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '2',
      user_id: 'user1',
      title: 'Renew domain name',
      description: null,
      is_completed: false,
      priority: 'medium',
      due_date: addDays(new Date(), 2).toISOString().split('T')[0],
      reminder_at: null,
      reminder_channel: null,
      reminder_sent: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '3',
      user_id: 'user1',
      title: 'Email accountant',
      description: 'Send Q3 reports',
      is_completed: false,
      priority: 'high',
      due_date: subDays(new Date(), 1).toISOString().split('T')[0],
      reminder_at: null,
      reminder_channel: null,
      reminder_sent: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  isLoading: false,
  filter: 'all',
  
  toggleComplete: (id) => set((state) => ({
    todos: state.todos.map(t => 
      t.id === id ? { ...t, is_completed: !t.is_completed } : t
    )
  })),

  setFilter: (filter) => set({ filter }),
}));
