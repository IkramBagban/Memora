# features/todos/backend.md

> Read `AGENT_CONTEXT.md` before this file.
> API contracts are in `API_CONTRACTS.md`.

---

## Overview

Todo backend consists of 4 edge functions: create, update, delete, get. Reminders are tracked via the `reminder_sent` flag and a Supabase cron job marks them as sent when their scheduled time passes.

---

## Zod Schemas (`packages/shared/validators/todo.validators.ts`)

```ts
import { z } from 'zod'

export const CreateTodoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  reminder_at: z.string().datetime({ offset: true }).optional(),
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
  reminder_at: z.string().datetime({ offset: true }).optional().nullable(),
})

export const GetTodosQuerySchema = z.object({
  is_completed: z.enum(['true', 'false']).optional().transform(v => v === 'true'),
  priority: z.enum(['low', 'medium', 'high']).optional(),
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

## Push Notification System

Push reminders are track via the `reminder_sent` flag. A **Supabase Cron Job** (pg_cron) runs every minute and marks todos as sent when their reminder time passes:

```sql
-- Create the cron job in a migration
SELECT cron.schedule(
  'update-todo-reminders-sent',
  '* * * * *',
  $$
  UPDATE public.todos
  SET reminder_sent = TRUE
  WHERE reminder_at <= NOW()
    AND reminder_sent = FALSE
    AND is_completed = FALSE;
  $$
);
```

The frontend handles displaying push notifications via the Expo Notifications SDK. In a future version, the `send-notification` edge function can integrate with Expo's push service to deliver remote notifications.

---

## Authorization Rules

- All mutations: verify `user_id` matches the record's `user_id`
- All reads: filter by `user_id` in query (even with RLS)
- RLS policies on `todos` table are the safety net — application code is the first line of defense
