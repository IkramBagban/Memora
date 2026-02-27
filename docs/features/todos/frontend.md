# features/todos/frontend.md

> Read `AGENT_CONTEXT.md` and `DESIGN_SYSTEM.md` before this file.
> API contracts are in `API_CONTRACTS.md`.

---

## Feature Overview

Todos in Memora are not a basic checklist. They're "things you want to remember to do." The key differentiator is smart reminders — users set a date/time and get notified. The UI should feel calm and organized, not overwhelming.

---

## Screens & Components

### 1. Todos Tab (`app/(tabs)/todos.tsx`)

**Layout:**
```
Header: "Todos"  [+ button top right]
─────────────────────
Filter tabs: All | Today | High Priority
─────────────────────
Section: "Overdue" (red badge count) — if any overdue
  TodoItem ...
Section: "Today"
  TodoItem ...
Section: "Upcoming"
  TodoItem ...
─────────────────────
FAB: green + → opens CreateTodoModal
```

**Filter tabs behavior:**
- "All" — show all incomplete todos, grouped by overdue/today/upcoming
- "Today" — only todos with due_date = today OR reminder_at = today
- "High Priority" — only high priority incomplete todos

**Empty state:** "Nothing to do! 🎉" with a subtle message. If filtered: "No todos in this view."

---

### 2. TodoItem Component (`components/todos/TodoItem.tsx`)

```
[ ○ checkbox ] [ Title                    ] [ priority badge ]
               [ Description (1 line)     ]
               [ 📅 Due date  🔔 Reminder  ]
```

**States:**
- Default: white card, title in `textPrimary`
- Completed: checkbox filled green, title has strikethrough, opacity 0.6
- Overdue: left border accent in `Colors.error`
- High priority: left border accent in `Colors.priorityHigh`

**Interactions:**
- Tap checkbox → toggle `is_completed` (optimistic update)
- Tap card body → open EditTodoModal (bottom sheet)
- Swipe left → reveal Delete button
- Long press → quick action: change priority

**Priority badge:**
```ts
// Small pill in top right
Low → gray
Medium → amber
High → red
```

**Reminder indicator:** If `reminder_at` is set, show a small bell icon with the formatted time.

---

### 3. CreateTodoModal / EditTodoModal

Bottom sheet modal. Fields:

```
─── Handle bar (drag indicator)

Title *
[Text input, placeholder: "What do you want to remember?"]

Description
[Multiline text input, 3 lines]

Priority
[Segmented control: Low | Medium | High]  ← use 3 rounded buttons

Due Date
[Tap to pick → DateTimePicker] or [Clear]

Reminder
[Toggle switch]
[If ON, show:]
  Date & Time picker
  Channel: Push | Email | Both

─────────
[Save] button — full width green pill
```

**DateTimePicker behavior:**
- Use `@react-native-community/datetimepicker`
- iOS: show inline picker
- Android: show native modal picker (two steps — date then time)
- Show human-friendly format: "Tomorrow, 3:00 PM" / "Mon 3 Feb, 9:00 AM"

**Validation (frontend, before API call):**
- Title is required (show inline error if empty)
- If reminder toggle is ON, reminder_at is required
- reminder_at must be in the future

---

### 4. ReminderPicker Component (`components/todos/ReminderPicker.tsx`)

Encapsulates all reminder-related fields:
```
[ 🔔 Add Reminder ] — tap to expand

[Expanded:]
Date: [Tue, 4 Feb 2025] ← tap to change
Time: [9:00 AM] ← tap to change
Notify via: [Push] [Email] [Both] ← segmented
```

This is a self-contained component used in the todo form. It manages its own expanded/collapsed state and calls `onChange(reminderData)` when values change.

---

## Service Layer (`services/todo.service.ts`)

```ts
import { supabase } from '@/lib/supabase'
import type { Todo, CreateTodoPayload, UpdateTodoPayload, TodoFilter } from '@memora/shared/types'

export const todoService = {
  async getTodos(filter?: TodoFilter): Promise<Todo[]> {
    const params = new URLSearchParams()
    if (filter?.isCompleted !== undefined) params.append('is_completed', String(filter.isCompleted))
    if (filter?.priority) params.append('priority', filter.priority)
    if (filter?.dueToday) params.append('due_today', 'true')

    const { data } = await supabase.functions.invoke(`get-todos?${params}`)
    if (!data.success) throw new Error(data.error.message)
    return data.data
  },

  async createTodo(payload: CreateTodoPayload): Promise<Todo> {
    const { data } = await supabase.functions.invoke('create-todo', { body: payload })
    if (!data.success) throw new Error(data.error.message)
    return data.data
  },

  async updateTodo(payload: UpdateTodoPayload): Promise<Todo> {
    const { data } = await supabase.functions.invoke('update-todo', { body: payload })
    if (!data.success) throw new Error(data.error.message)
    return data.data
  },

  async deleteTodo(id: string): Promise<void> {
    const { data } = await supabase.functions.invoke('delete-todo', { body: { id } })
    if (!data.success) throw new Error(data.error.message)
  },
}
```

---

## Notification Integration (`hooks/useNotifications.ts`)

Push notifications are scheduled **locally** on device using Expo Notifications. This avoids a complex backend cron job for push.

```ts
import * as Notifications from 'expo-notifications'

export async function scheduleReminderNotification(todo: Todo): Promise<string | null> {
  if (!todo.reminder_at) return null

  const trigger = new Date(todo.reminder_at)
  if (trigger <= new Date()) return null  // don't schedule past reminders

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: todo.title,
      body: todo.description ?? 'Tap to view your todo',
      data: { todoId: todo.id },
    },
    trigger,
  })

  return notificationId
}

export async function cancelReminderNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId)
}
```

**Important:** Store the `notificationId` returned by Expo alongside the todo in local state (or AsyncStorage keyed by `todo.id`) so you can cancel it when the todo is completed or reminder is changed.

**Notification permission request:** On first app open (after auth), request notification permissions in the root layout with a friendly explanation before showing the system prompt.

**Email reminders:** When `reminder_channel` is 'email' or 'both', the backend handles this via a cron job that calls the `send-notification` edge function. Frontend just needs to save the channel preference — no extra action needed.

---

## Zustand Store (`stores/todo.store.ts`)

```ts
interface TodoStore {
  todos: Todo[]
  isLoading: boolean
  error: string | null
  filter: 'all' | 'today' | 'high_priority'

  fetchTodos: () => Promise<void>
  createTodo: (payload: CreateTodoPayload) => Promise<void>
  updateTodo: (payload: UpdateTodoPayload) => Promise<void>
  deleteTodo: (id: string) => Promise<void>
  toggleComplete: (id: string) => Promise<void>
  setFilter: (filter: TodoStore['filter']) => void
}
```

**Derived state (computed in selectors, not stored):**
```ts
// Use these functions in components
export const getOverdueTodos = (todos: Todo[]) =>
  todos.filter(t => !t.is_completed && t.due_date && new Date(t.due_date) < startOfToday())

export const getTodayTodos = (todos: Todo[]) =>
  todos.filter(t => !t.is_completed && t.due_date && isToday(new Date(t.due_date)))

export const getUpcomingTodos = (todos: Todo[]) =>
  todos.filter(t => !t.is_completed && t.due_date && new Date(t.due_date) > endOfToday())

export const getNoDueDateTodos = (todos: Todo[]) =>
  todos.filter(t => !t.is_completed && !t.due_date)
```

Use `date-fns` for date comparisons.

---

## Optimistic Updates Pattern

For `toggleComplete` specifically (frequent action), update UI immediately:
```ts
toggleComplete: async (id) => {
  // 1. Optimistically update local state
  set(state => ({
    todos: state.todos.map(t =>
      t.id === id ? { ...t, is_completed: !t.is_completed } : t
    )
  }))

  // 2. Call API
  try {
    const todo = get().todos.find(t => t.id === id)
    await todoService.updateTodo({ id, is_completed: !todo?.is_completed })
    
    // 3. Cancel notification if completed
    if (!todo?.is_completed) {
      const notifId = getStoredNotificationId(id)
      if (notifId) await cancelReminderNotification(notifId)
    }
  } catch {
    // 4. Revert on failure
    set(state => ({
      todos: state.todos.map(t =>
        t.id === id ? { ...t, is_completed: !t.is_completed } : t
      )
    }))
    // Show toast error
  }
}
```

---

## Types Used (from `@memora/shared/types`)

```ts
import type { Todo, CreateTodoPayload, UpdateTodoPayload, TodoFilter, Priority } from '@memora/shared/types'
```

Do NOT define these locally.
