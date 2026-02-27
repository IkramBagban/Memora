# features/todos/backend.md

> Read `AGENT_CONTEXT.md` before this file.
> API contracts are in `API_CONTRACTS.md`.

---

## Overview

Todo backend consists of 4 edge functions: create, update, delete, get. Plus the shared `send-notification` function for email reminders.

---

## Zod Schemas (`packages/shared/validators/todo.validators.ts`)

```ts
import { z } from 'zod'

export const CreateTodoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  due_date: z.string().date().optional(),  // 'YYYY-MM-DD' format
  reminder_at: z.string().datetime({ offset: true }).optional(),
  reminder_channel: z.enum(['push', 'email', 'both']).default('push'),
}).refine(
  (data) => {
    // If reminder_at is set, it must be in the future
    if (data.reminder_at) {
      return new Date(data.reminder_at) > new Date()
    }
    return true
  },
  { message: 'Reminder time must be in the future', path: ['reminder_at'] }
)

export const UpdateTodoSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  is_completed: z.boolean().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  due_date: z.string().date().optional().nullable(),
  reminder_at: z.string().datetime({ offset: true }).optional().nullable(),
  reminder_channel: z.enum(['push', 'email', 'both']).optional().nullable(),
})

export const GetTodosQuerySchema = z.object({
  is_completed: z.enum(['true', 'false']).optional().transform(v => v === 'true'),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  due_today: z.enum(['true', 'false']).optional().transform(v => v === 'true'),
})

export const DeleteTodoSchema = z.object({
  id: z.string().uuid(),
})
```

---

## Edge Function Implementations

### `create-todo/index.ts`

```ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { verifyAuth } from '../_shared/auth.ts'
import { success, error } from '../_shared/response.ts'
import { validateBody } from '../_shared/validate.ts'
import { CreateTodoSchema } from '../../packages/shared/validators/todo.validators.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const userId = await verifyAuth(req)
    const body = await validateBody(req, CreateTodoSchema)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: todo, error: dbError } = await supabase
      .from('todos')
      .insert({ ...body, user_id: userId })
      .select()
      .single()

    if (dbError) throw { status: 500, code: 'DB_ERROR', message: dbError.message }

    // If reminder_channel includes email and reminder_at is set,
    // we rely on the cron job to pick this up. No immediate action needed.

    return success(todo, 201)
  } catch (err: any) {
    return error(err.code ?? 'INTERNAL_ERROR', err.message ?? 'Unknown error', err.status ?? 500)
  }
})
```

---

### `update-todo/index.ts`

Key behavior: if `is_completed` is set to `true`, set `reminder_sent = true` to prevent future email reminders from firing (the push notification cancellation is handled on the frontend).

```ts
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const userId = await verifyAuth(req)
    const body = await validateBody(req, UpdateTodoSchema)
    const { id, ...updates } = body

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Verify ownership
    const { data: existing } = await supabase
      .from('todos')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!existing) throw { status: 404, code: 'NOT_FOUND', message: 'Todo not found' }
    if (existing.user_id !== userId) throw { status: 403, code: 'FORBIDDEN', message: 'Access denied' }

    // If completing a todo, mark reminder as sent to prevent email from firing
    const finalUpdates = {
      ...updates,
      ...(updates.is_completed === true ? { reminder_sent: true } : {}),
      updated_at: new Date().toISOString(),
    }

    const { data: todo, error: dbError } = await supabase
      .from('todos')
      .update(finalUpdates)
      .eq('id', id)
      .select()
      .single()

    if (dbError) throw { status: 500, code: 'DB_ERROR', message: dbError.message }

    return success(todo)
  } catch (err: any) {
    return error(err.code ?? 'INTERNAL_ERROR', err.message ?? 'Unknown error', err.status ?? 500)
  }
})
```

---

### `get-todos/index.ts`

```ts
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const userId = await verifyAuth(req)
    const url = new URL(req.url)

    // Parse and validate query params
    const rawQuery = Object.fromEntries(url.searchParams)
    const query = GetTodosQuerySchema.parse(rawQuery)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    let dbQuery = supabase
      .from('todos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    // Apply filters
    if (query.is_completed !== undefined) {
      dbQuery = dbQuery.eq('is_completed', query.is_completed)
    }
    if (query.priority) {
      dbQuery = dbQuery.eq('priority', query.priority)
    }
    if (query.due_today) {
      const today = new Date().toISOString().split('T')[0]
      dbQuery = dbQuery.eq('due_date', today)
    }

    const { data: todos, error: dbError } = await dbQuery

    if (dbError) throw { status: 500, code: 'DB_ERROR', message: dbError.message }

    return success(todos)
  } catch (err: any) {
    return error(err.code ?? 'INTERNAL_ERROR', err.message ?? 'Unknown error', err.status ?? 500)
  }
})
```

---

### `delete-todo/index.ts`

Standard delete with ownership check:

```ts
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const userId = await verifyAuth(req)
    const { id } = await validateBody(req, DeleteTodoSchema)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Delete with user_id check (even though RLS protects this)
    const { error: dbError, count } = await supabase
      .from('todos')
      .delete({ count: 'exact' })
      .eq('id', id)
      .eq('user_id', userId)

    if (dbError) throw { status: 500, code: 'DB_ERROR', message: dbError.message }
    if (count === 0) throw { status: 404, code: 'NOT_FOUND', message: 'Todo not found' }

    return success({ deleted: true })
  } catch (err: any) {
    return error(err.code ?? 'INTERNAL_ERROR', err.message ?? 'Unknown error', err.status ?? 500)
  }
})
```

---

## Email Reminder System

Email reminders are handled by a **Supabase Cron Job** (pg_cron) that runs every minute and finds todos where:
- `reminder_at <= NOW()`
- `reminder_sent = false`
- `is_completed = false`
- `reminder_channel IN ('email', 'both')`

```sql
-- Create the cron job in a migration
SELECT cron.schedule(
  'send-todo-reminders',
  '* * * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://<project-ref>.supabase.co/functions/v1/send-notification',
      headers := '{"Authorization": "Bearer <service_role_key>", "Content-Type": "application/json"}'::jsonb,
      body := json_build_object(
        'user_id', user_id,
        'type', 'todo_reminder',
        'channel', 'email',
        'payload', json_build_object(
          'title', title,
          'body', COALESCE(description, 'You have a reminder'),
          'data', json_build_object('todoId', id)
        )
      )::jsonb
    )
  FROM todos
  WHERE reminder_at <= NOW()
    AND reminder_sent = FALSE
    AND is_completed = FALSE
    AND reminder_channel IN ('email', 'both');

  -- Mark as sent
  UPDATE todos
  SET reminder_sent = TRUE
  WHERE reminder_at <= NOW()
    AND reminder_sent = FALSE
    AND is_completed = FALSE
    AND reminder_channel IN ('email', 'both');
  $$
);
```

---

### `send-notification/index.ts`

Called by the cron job. Sends email via Resend.

```ts
import { Resend } from 'npm:resend'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json()
    // This function is internal — verify it's called with service role key
    const authHeader = req.headers.get('Authorization')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!authHeader?.includes(serviceKey!)) {
      throw { status: 401, code: 'UNAUTHORIZED', message: 'Internal only' }
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get user email
    const { data: { user } } = await supabase.auth.admin.getUserById(body.user_id)
    if (!user?.email) throw { status: 404, code: 'NOT_FOUND', message: 'User not found' }

    const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

    await resend.emails.send({
      from: 'Memora <reminders@yourdomain.com>',
      to: user.email,
      subject: `⏰ Reminder: ${body.payload.title}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #22C55E;">Memora Reminder</h2>
          <h3>${body.payload.title}</h3>
          <p>${body.payload.body}</p>
          <p style="color: #6B7280; font-size: 12px;">Open Memora to manage your todos.</p>
        </div>
      `,
    })

    return success({ sent: true })
  } catch (err: any) {
    return error(err.code ?? 'INTERNAL_ERROR', err.message ?? 'Unknown error', err.status ?? 500)
  }
})
```

---

## Authorization Rules

- All mutations: verify `user_id` matches the record's `user_id`
- All reads: filter by `user_id` in query (even with RLS)
- RLS policies on `todos` table are the safety net — application code is the first line of defense
