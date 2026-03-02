export type Priority = 'low' | 'medium' | 'high';
export type ReminderChannel = 'push' | 'email' | 'both';
export type RecurrenceType = 'daily' | 'weekly';
export type RecurrenceWeekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export type RecurrenceCompletionMode = 'occurrence' | 'series';

export interface TodoRecurrence {
  type: RecurrenceType;
  times: string[];
  weekdays?: RecurrenceWeekday[];
  completion_mode?: RecurrenceCompletionMode;
}

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
  recurrence: TodoRecurrence | null;
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
  recurrence?: TodoRecurrence | null;
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
  recurrence?: TodoRecurrence | null;
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
