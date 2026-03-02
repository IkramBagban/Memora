import { Alert } from 'react-native';
import { create } from 'zustand';
import { isBefore, isToday, startOfDay } from 'date-fns';
import type { CreateTodoPayload, Todo, UpdateTodoPayload } from '@memora/shared';
import { cancelReminderNotification, scheduleReminderNotification } from '@/hooks/use-notifications';
import { todoService } from '@/services/todo.service';

export type TodoTabFilter = 'all' | 'today' | 'high_priority';
const TODO_STALE_MS = 60_000;

interface GroupedTodos {
  overdue: Todo[];
  today: Todo[];
  upcoming: Todo[];
}

interface TodoStore {
  todos: Todo[];
  isLoading: boolean;
  filter: TodoTabFilter;
  notificationIds: Record<string, string>;
  lastFetchedAt: number | null;
  setFilter: (filter: TodoTabFilter) => void;
  fetchTodos: (force?: boolean) => Promise<void>;
  createTodo: (payload: CreateTodoPayload) => Promise<void>;
  updateTodo: (payload: UpdateTodoPayload) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  toggleComplete: (todo: Todo) => Promise<void>;
  getGroupedTodos: () => GroupedTodos;
}

const sortByDueDate = (a: Todo, b: Todo): number => {
  if (!a.due_date && !b.due_date) return 0;
  if (!a.due_date) return 1;
  if (!b.due_date) return -1;
  return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
};

export const useTodoStore = create<TodoStore>((set, get) => ({
  todos: [],
  isLoading: false,
  filter: 'all',
  notificationIds: {},
  lastFetchedAt: null,

  setFilter: (filter) => set({ filter }),

  fetchTodos: async (force = false) => {
    try {
      const { lastFetchedAt, todos } = get();
      const isFresh = Boolean(lastFetchedAt && Date.now() - lastFetchedAt < TODO_STALE_MS);

      if (!force && isFresh && todos.length > 0) {
        return;
      }

      set({ isLoading: true });
      const fetchedTodos = await todoService.getTodos({ isCompleted: false });
      set({ todos: fetchedTodos, isLoading: false, lastFetchedAt: Date.now() });
    } catch (err: unknown) {
      set({ isLoading: false });
      const message = err instanceof Error ? err.message : 'Failed to load todos.';
      Alert.alert('Error', message);
    }
  },

  createTodo: async (payload) => {
    try {
      const todo = await todoService.createTodo(payload);
      const notificationId = await scheduleReminderNotification(todo);

      set((state) => ({
        todos: [todo, ...state.todos],
        lastFetchedAt: Date.now(),
        notificationIds: notificationId ? { ...state.notificationIds, [todo.id]: notificationId } : state.notificationIds,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create todo.';
      Alert.alert('Error', message);
    }
  },

  updateTodo: async (payload) => {
    try {
      const todo = await todoService.updateTodo(payload);
      const oldNotificationId = get().notificationIds[todo.id];

      if (oldNotificationId) {
        await cancelReminderNotification(oldNotificationId);
      }

      const notificationId = await scheduleReminderNotification(todo);

      set((state) => {
        const nextIds = { ...state.notificationIds };
        if (notificationId) {
          nextIds[todo.id] = notificationId;
        } else {
          delete nextIds[todo.id];
        }

        return {
          todos: state.todos.map((entry) => (entry.id === todo.id ? todo : entry)),
          lastFetchedAt: Date.now(),
          notificationIds: nextIds,
        };
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update todo.';
      Alert.alert('Error', message);
    }
  },

  deleteTodo: async (id) => {
    try {
      await todoService.deleteTodo(id);
      const notificationId = get().notificationIds[id];
      if (notificationId) {
        await cancelReminderNotification(notificationId);
      }

      set((state) => {
        const nextIds = { ...state.notificationIds };
        delete nextIds[id];
        return {
          todos: state.todos.filter((todo) => todo.id !== id),
          lastFetchedAt: Date.now(),
          notificationIds: nextIds,
        };
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete todo.';
      Alert.alert('Error', message);
    }
  },

  toggleComplete: async (todo) => {
    const previousTodos = get().todos;
    const optimisticTodo = { ...todo, is_completed: !todo.is_completed };

    set((state) => ({
      todos: state.todos.map((entry) => (entry.id === todo.id ? optimisticTodo : entry)),
    }));

    try {
      const updatedTodo = await todoService.updateTodo({ id: todo.id, is_completed: optimisticTodo.is_completed });
      const notificationId = get().notificationIds[todo.id];
      if (notificationId) {
        await cancelReminderNotification(notificationId);
      }
      const nextNotificationId = await scheduleReminderNotification(updatedTodo);

      set((state) => {
        const nextIds = { ...state.notificationIds };
        if (nextNotificationId) {
          nextIds[todo.id] = nextNotificationId;
        } else {
          delete nextIds[todo.id];
        }

        return {
          todos: state.todos.map((entry) => (entry.id === todo.id ? updatedTodo : entry)),
          lastFetchedAt: Date.now(),
          notificationIds: nextIds,
        };
      });
    } catch (err: unknown) {
      set({ todos: previousTodos });
      const message = err instanceof Error ? err.message : 'Failed to update todo status.';
      Alert.alert('Error', message);
    }
  },

  getGroupedTodos: () => {
    const { todos, filter } = get();
    const activeTodos = todos.filter((todo) => !todo.is_completed);

    const filteredTodos = activeTodos.filter((todo) => {
      if (filter === 'high_priority') {
        return todo.priority === 'high';
      }

      if (filter === 'today') {
        const dueToday = todo.due_date ? isToday(new Date(todo.due_date)) : false;
        const reminderToday = todo.reminder_at ? isToday(new Date(todo.reminder_at)) : false;
        return dueToday || reminderToday;
      }

      return true;
    });

    const todayStart = startOfDay(new Date());

    return {
      overdue: filteredTodos
        .filter((todo) => todo.due_date && isBefore(new Date(todo.due_date), todayStart))
        .sort(sortByDueDate),
      today: filteredTodos.filter((todo) => todo.due_date && isToday(new Date(todo.due_date))).sort(sortByDueDate),
      upcoming: filteredTodos
        .filter((todo) => !todo.due_date || (!isToday(new Date(todo.due_date)) && new Date(todo.due_date) > todayStart))
        .sort(sortByDueDate),
    };
  },
}));
