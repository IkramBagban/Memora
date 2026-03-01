import { invokeSupabaseFunction } from '@/lib/supabase';
import {
  CreateTodoSchema,
  DeleteTodoSchema,
  GetTodosQuerySchema,
  type Todo,
  type TodoFilter,
  type CreateTodoPayload,
  type UpdateTodoPayload,
  UpdateTodoSchema,
} from '@memora/shared';

const toQueryParams = (filter?: TodoFilter): string => {
  if (!filter) return '';

  const params = new URLSearchParams();
  if (filter.isCompleted !== undefined) {
    params.set('is_completed', String(filter.isCompleted));
  }
  if (filter.priority) {
    params.set('priority', filter.priority);
  }
  if (filter.dueToday) {
    params.set('due_today', 'true');
  }

  const query = params.toString();
  return query ? `?${query}` : '';
};

export const todoService = {
  async getTodos(filter?: TodoFilter): Promise<Todo[]> {
    GetTodosQuerySchema.parse({
      is_completed: filter?.isCompleted,
      priority: filter?.priority,
      due_today: filter?.dueToday,
    });

    const { data, error } = await invokeSupabaseFunction(`get-todos${toQueryParams(filter)}`);
    if (error || !data?.success) {
      throw new Error(data?.error?.message ?? error?.message ?? 'Unable to fetch todos.');
    }

    return data.data as Todo[];
  },

  async createTodo(payload: CreateTodoPayload): Promise<Todo> {
    const validatedPayload = CreateTodoSchema.parse(payload);

    const { data, error } = await invokeSupabaseFunction('create-todo', {
      body: validatedPayload,
    });
    if (error || !data?.success) {
      throw new Error(data?.error?.message ?? error?.message ?? 'Unable to create todo.');
    }

    return data.data as Todo;
  },

  async updateTodo(payload: UpdateTodoPayload): Promise<Todo> {
    const validatedPayload = UpdateTodoSchema.parse(payload);

    const { data, error } = await invokeSupabaseFunction('update-todo', {
      body: validatedPayload,
    });
    if (error || !data?.success) {
      throw new Error(data?.error?.message ?? error?.message ?? 'Unable to update todo.');
    }

    return data.data as Todo;
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
