import { z } from 'zod';

export const PrioritySchema = z.enum(['low', 'medium', 'high']);
export const ReminderChannelSchema = z.enum(['push', 'email', 'both']);
export const RecurrenceTypeSchema = z.enum(['daily', 'weekly']);
export const RecurrenceWeekdaySchema = z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);
export const RecurrenceCompletionModeSchema = z.enum(['occurrence', 'series']);

const RecurrenceTimeSchema = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/);

export const TodoRecurrenceSchema = z
  .object({
    type: RecurrenceTypeSchema,
    times: z.array(RecurrenceTimeSchema).min(1).max(6),
    weekdays: z.array(RecurrenceWeekdaySchema).min(1).max(7).optional(),
    completion_mode: RecurrenceCompletionModeSchema.optional().default('occurrence'),
  })
  .superRefine((value, context) => {
    if (value.type === 'weekly' && (!value.weekdays || value.weekdays.length === 0)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['weekdays'],
        message: 'Weekdays are required for weekly recurrence.',
      });
    }

    if (value.type !== 'weekly' && value.weekdays && value.weekdays.length > 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['weekdays'],
        message: 'Weekdays are only allowed for weekly recurrence.',
      });
    }
  });

export const CreateTodoSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  priority: PrioritySchema.optional().default('medium'),
  due_date: z.string().date().optional(),
  reminder_at: z.string().datetime().optional(),
  reminder_channel: ReminderChannelSchema.optional().default('push'),
  recurrence: TodoRecurrenceSchema.nullable().optional(),
});

export const UpdateTodoSchema = z
  .object({
    id: z.string().uuid(),
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    is_completed: z.boolean().optional(),
    priority: PrioritySchema.optional(),
    due_date: z.string().date().nullable().optional(),
    reminder_at: z.string().datetime().nullable().optional(),
    reminder_channel: ReminderChannelSchema.nullable().optional(),
    recurrence: TodoRecurrenceSchema.nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 1, { message: 'At least one update field is required.' });

export const DeleteTodoSchema = z.object({
  id: z.string().uuid(),
});

export const GetTodosQuerySchema = z.object({
  is_completed: z
    .union([z.boolean(), z.string().toLowerCase().transform((value) => value === 'true')])
    .optional(),
  priority: PrioritySchema.optional(),
  due_today: z
    .union([z.boolean(), z.string().toLowerCase().transform((value) => value === 'true')])
    .optional(),
});

export const SendNotificationSchema = z.object({
  user_id: z.string().uuid(),
  type: z.enum(['todo_reminder', 'daily_review']),
  channel: z.enum(['email', 'push']),
  payload: z.object({
    title: z.string().min(1),
    body: z.string().min(1),
    data: z.record(z.string(), z.unknown()).optional(),
  }),
});
