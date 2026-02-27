export type Priority = 'low' | 'medium' | 'high';
export type ReminderChannel = 'push' | 'email' | 'both';

export interface Todo {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  is_completed: boolean;
  priority: Priority;
  due_date: string | null;
  reminder_at: string | null;
  reminder_channel: ReminderChannel | null;
  reminder_sent: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTodoPayload {
  title: string;
  description?: string;
  priority?: Priority;
  due_date?: string;
  reminder_at?: string;
  reminder_channel?: ReminderChannel;
}

export interface UpdateTodoPayload {
  id: string;
  title?: string;
  description?: string | null;
  is_completed?: boolean;
  priority?: Priority;
  due_date?: string | null;
  reminder_at?: string | null;
  reminder_channel?: ReminderChannel | null;
}

export interface DeleteTodoPayload {
  id: string;
}

export interface TodoFilter {
  isCompleted?: boolean;
  priority?: Priority;
  dueToday?: boolean;
}

export interface ReminderNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}
