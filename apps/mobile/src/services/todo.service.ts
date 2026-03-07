import { invokeSupabaseFunction } from '@/lib/supabase';
import {
  CreateTodoSchema,
  DeleteTodoSchema,
  GetTodosQuerySchema,
  type TodoRecurrence,
  type Todo,
  type TodoFilter,
  type CreateTodoPayload,
  type UpdateTodoPayload,
  UpdateTodoSchema,
} from '@memora/shared';

const parseRecurrence = (value: unknown): TodoRecurrence | null => {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as TodoRecurrence;
    } catch {
      return null;
    }
  }

  if (typeof value === 'object') {
    return value as TodoRecurrence;
  }

  return null;
};

const normalizeTodo = (todo: Todo & { recurrence?: unknown }): Todo => ({
  ...todo,
  recurrence: parseRecurrence(todo.recurrence),
});

const toQueryParams = (filter?: TodoFilter): string => {
  if (!filter) return '';

  const params = new URLSearchParams();
  if (filter.isCompleted !== undefined) {
    params.set('is_completed', String(filter.isCompleted));
  }
  if (filter.priority) {
    params.set('priority', filter.priority);
  }

  const query = params.toString();
  return query ? `?${query}` : '';
};

export const todoService = {
  async getTodos(filter?: TodoFilter): Promise<Todo[]> {
    GetTodosQuerySchema.parse({
      is_completed: filter?.isCompleted,
      priority: filter?.priority,
    });

    const { data, error } = await invokeSupabaseFunction(`get-todos${toQueryParams(filter)}`);
    if (error || !data?.success) {
      throw new Error(data?.error?.message ?? error?.message ?? 'Unable to fetch todos.');
    }

    return (data.data as (Todo & { recurrence?: unknown })[]).map(normalizeTodo);
  },

  async createTodo(payload: CreateTodoPayload): Promise<Todo> {
    const validatedPayload = CreateTodoSchema.parse(payload);

    const { data, error } = await invokeSupabaseFunction('create-todo', {
      body: validatedPayload,
    });
    if (error || !data?.success) {
      throw new Error(data?.error?.message ?? error?.message ?? 'Unable to create todo.');
    }

    return normalizeTodo(data.data as Todo & { recurrence?: unknown });
  },

  async updateTodo(payload: UpdateTodoPayload): Promise<Todo> {
    const validatedPayload = UpdateTodoSchema.parse(payload);

    const { data, error } = await invokeSupabaseFunction('update-todo', {
      body: validatedPayload,
    });
    if (error || !data?.success) {
      throw new Error(data?.error?.message ?? error?.message ?? 'Unable to update todo.');
    }

    return normalizeTodo(data.data as Todo & { recurrence?: unknown });
  },

  async deleteTodo(id: string): Promise<void> {
    const validatedPayload = DeleteTodoSchema.parse({ id });

    const { data, error } = await invokeSupabaseFunction('delete-todo', {
      body: validatedPayload,
    });
    if (error || !data?.success) {
      throw new Error(data?.error?.message ?? error?.message ?? 'Unable to delete todo.');
    }
  },
};
