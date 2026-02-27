export type Priority = 'low' | 'medium' | 'high';
export type ReminderChannel = 'push' | 'email' | 'both';

export interface Todo {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  is_completed: boolean;
  priority: Priority;
  due_date: string | null;      // 'YYYY-MM-DD'
  reminder_at: string | null;   // ISO datetime
  reminder_channel: ReminderChannel | null;
  reminder_sent: boolean;
  created_at: string;
  updated_at: string;
}
