import { Alert } from 'react-native';
import { create } from 'zustand';
import { isToday } from 'date-fns';
import type { CreateTodoPayload, Todo, UpdateTodoPayload } from '@memora/shared';
import {
  cancelReminderNotifications,
  clearScheduledTodoNotifications,
  scheduleReminderNotifications,
} from '@/hooks/use-notifications';
import { todoService } from '@/services/todo.service';

export type TodoTabFilter = 'all' | 'today' | 'high_priority' | 'done';
const TODO_STALE_MS = 60_000;

interface GroupedTodos {
  overdue: Todo[];
  today: Todo[];
  upcoming: Todo[];
  completed: Todo[];
}

interface TodoStore {
  todos: Todo[];
  isLoading: boolean;
  filter: TodoTabFilter;
  notificationIds: Record<string, string[]>;
  lastFetchedAt: number | null;
  setFilter: (filter: TodoTabFilter) => void;
  fetchTodos: (force?: boolean) => Promise<void>;
  createTodo: (payload: CreateTodoPayload) => Promise<void>;
  updateTodo: (payload: UpdateTodoPayload) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  toggleComplete: (todo: Todo) => Promise<void>;
  getGroupedTodos: () => GroupedTodos;
}


const weekdayByIndex: ('sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat')[] = [
  'sun',
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
];

const isRecurringToday = (todo: Todo): boolean => {
  if (!todo.recurrence) {
    return false;
  }

  if (todo.recurrence.type === 'daily') {
    return true;
  }

  const today = weekdayByIndex[new Date().getDay()];
  return (todo.recurrence.weekdays ?? []).includes(today);
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
      // Fetch both active and completed todos
      const activeTodos = await todoService.getTodos({ isCompleted: false });
      const completedTodos = await todoService.getTodos({ isCompleted: true });
      const fetchedTodos = [...activeTodos, ...completedTodos];
      
      await clearScheduledTodoNotifications();

      const nextNotificationEntries = await Promise.all(
        activeTodos.map(async (todo) => {
          const ids = await scheduleReminderNotifications(todo);
          return [todo.id, ids] as const;
        }),
      );

      const notificationIds = nextNotificationEntries.reduce<Record<string, string[]>>((acc, [todoId, ids]) => {
        if (ids.length) {
          acc[todoId] = ids;
        }
        return acc;
      }, {});

      set({ todos: fetchedTodos, isLoading: false, lastFetchedAt: Date.now(), notificationIds });
    } catch (err: unknown) {
      set({ isLoading: false });
      const message = err instanceof Error ? err.message : 'Failed to load todos.';
      Alert.alert('Error', message);
    }
  },

  createTodo: async (payload) => {
    try {
      const todo = await todoService.createTodo(payload);
      const notificationIds = await scheduleReminderNotifications(todo);

      set((state) => ({
        todos: [todo, ...state.todos],
        lastFetchedAt: Date.now(),
        notificationIds: notificationIds.length
          ? { ...state.notificationIds, [todo.id]: notificationIds }
          : state.notificationIds,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create todo.';
      Alert.alert('Error', message);
    }
  },

  updateTodo: async (payload) => {
    try {
      const todo = await todoService.updateTodo(payload);
      const oldNotificationIds = get().notificationIds[todo.id] ?? [];

      if (oldNotificationIds.length) {
        await cancelReminderNotifications(oldNotificationIds);
      }

      const notificationIds = await scheduleReminderNotifications(todo);

      set((state) => {
        const nextIds = { ...state.notificationIds };
        if (notificationIds.length) {
          nextIds[todo.id] = notificationIds;
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
      const notificationIds = get().notificationIds[id] ?? [];
      if (notificationIds.length) {
        await cancelReminderNotifications(notificationIds);
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
    if (todo.recurrence && todo.recurrence.completion_mode !== 'series' && !todo.is_completed) {
      const existingNotifications = get().notificationIds[todo.id] ?? [];
      if (existingNotifications.length) {
        await cancelReminderNotifications(existingNotifications);
      }

      const nextNotificationIds = await scheduleReminderNotifications(todo);
      if (nextNotificationIds.length) {
        await cancelReminderNotifications([nextNotificationIds[0]]);
      }

      const keptIds = nextNotificationIds.slice(1);
      set((state) => {
        const nextIds = { ...state.notificationIds };
        if (keptIds.length) {
          nextIds[todo.id] = keptIds;
        } else {
          delete nextIds[todo.id];
        }

        return { notificationIds: nextIds };
      });

      return;
    }

    const previousTodos = get().todos;
    const optimisticTodo = { ...todo, is_completed: !todo.is_completed };

    set((state) => ({
      todos: state.todos.map((entry) => (entry.id === todo.id ? optimisticTodo : entry)),
    }));

    try {
      const updatedTodo = await todoService.updateTodo({ id: todo.id, is_completed: optimisticTodo.is_completed });
      const notificationIds = get().notificationIds[todo.id] ?? [];
      if (notificationIds.length) {
        await cancelReminderNotifications(notificationIds);
      }
      const nextNotificationIds = await scheduleReminderNotifications(updatedTodo);

      set((state) => {
        const nextIds = { ...state.notificationIds };
        if (nextNotificationIds.length) {
          nextIds[todo.id] = nextNotificationIds;
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

    // For "done" tab, show completed todos
    if (filter === 'done') {
      const completedTodos = todos.filter((todo) => todo.is_completed);
      return {
        overdue: [],
        today: [],
        upcoming: [],
        completed: completedTodos.sort((a, b) => {
          if (!a.updated_at || !b.updated_at) return 0;
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        }),
      };
    }

    const activeTodos = todos.filter((todo) => !todo.is_completed);

    const filteredTodos = activeTodos.filter((todo) => {
      if (filter === 'high_priority') {
        return todo.priority === 'high';
      }

      if (filter === 'today') {
        const reminderToday = todo.reminder_at ? isToday(new Date(todo.reminder_at)) : false;
        return reminderToday || isRecurringToday(todo);
      }

      return true;
    });

    return {
      overdue: [],
      today: filteredTodos
        .filter((todo) => (todo.reminder_at && isToday(new Date(todo.reminder_at))) || isRecurringToday(todo)),
      upcoming: filteredTodos
        .filter((todo) => !(todo.reminder_at && isToday(new Date(todo.reminder_at))) && !isRecurringToday(todo)),
      completed: [],
    };
  },
}));
