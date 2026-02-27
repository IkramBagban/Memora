# API_CONTRACTS.md

> This is the single source of truth for all edge function interfaces. Both frontend agents and backend agents refer to this. Frontend knows what to send and what to expect. Backend knows what it will receive and what it must return.

---

## Base URL

```
https://<project-ref>.supabase.co/functions/v1/<function-name>
```

## Auth Header (required on all endpoints)

```
Authorization: Bearer <supabase_jwt_token>
```

The Supabase client attaches this automatically when using `supabase.functions.invoke()`.

---

## Standard Response Envelope

```ts
// Success
{ success: true, data: T }

// Error
{ success: false, error: { code: string, message: string } }
```

---

## Flashcard Decks

### `create-flashcard-deck`
**POST**

Request body:
```ts
{
  title: string        // required, 1-100 chars
  description?: string // optional, max 500 chars
  color?: string       // optional hex color, default '#22C55E'
}
```

Response `data`:
```ts
{
  id: string
  user_id: string
  title: string
  description: string | null
  color: string
  created_at: string
  updated_at: string
}
```

Errors: `VALIDATION_ERROR` (400), `UNAUTHORIZED` (401)

---

### `get-flashcard-decks`
**GET**

No body. Returns all decks for authenticated user, ordered by `created_at` desc.

Response `data`:
```ts
Array<{
  id: string
  title: string
  description: string | null
  color: string
  card_count: number    // total cards in deck
  due_count: number     // cards due for review today
  created_at: string
}>
```

---

### `update-flashcard-deck`
**PATCH**

Request body:
```ts
{
  id: string           // required — deck id
  title?: string
  description?: string
  color?: string
}
```

Response `data`: Updated deck object (same shape as create response)

Errors: `VALIDATION_ERROR` (400), `UNAUTHORIZED` (401), `NOT_FOUND` (404), `FORBIDDEN` (403)

---

### `delete-flashcard-deck`
**DELETE**

Request body:
```ts
{ id: string }
```

Response `data`: `{ deleted: true }`

---

## Flashcards

### `create-flashcard`
**POST**

Request body:
```ts
{
  deck_id: string   // required
  front: string     // required, 1-1000 chars
  back: string      // required, 1-1000 chars
}
```

Response `data`:
```ts
{
  id: string
  deck_id: string
  front: string
  back: string
  due: string          // ISO timestamp — initially now()
  state: number        // 0 = New
  created_at: string
}
```

---

### `update-flashcard`
**PATCH**

Request body:
```ts
{
  id: string
  front?: string
  back?: string
}
```

Response `data`: Updated flashcard object

---

### `delete-flashcard`
**DELETE**

Request body:
```ts
{ id: string }
```

Response `data`: `{ deleted: true }`

---

### `get-due-flashcards`
**GET**

Query params:
```
?deck_id=<uuid>    // optional — filter by deck
```

Returns cards where `due <= NOW()`, ordered by `due` asc, limit 20.

Response `data`:
```ts
Array<{
  id: string
  deck_id: string
  deck_title: string
  front: string
  back: string
  due: string
  state: number
  reps: number
  lapses: number
}>
```

---

### `review-flashcard`
**POST**

This is the core FSRS endpoint. Frontend submits the user's rating after reviewing a card. Backend uses `ts-fsrs` to compute the next due date and updates the card.

Request body:
```ts
{
  id: string        // flashcard id
  rating: 1 | 2 | 3 | 4   // 1=Again, 2=Hard, 3=Good, 4=Easy
}
```

Response `data`:
```ts
{
  id: string
  due: string              // next due date (ISO timestamp)
  state: number
  scheduled_days: number   // days until next review
  stability: number
  difficulty: number
  reps: number
  lapses: number
}
```

---

## Todos

### `create-todo`
**POST**

Request body:
```ts
{
  title: string                          // required, 1-200 chars
  description?: string                   // optional, max 2000 chars
  priority?: 'low' | 'medium' | 'high'  // default 'medium'
  due_date?: string                      // ISO date string 'YYYY-MM-DD'
  reminder_at?: string                   // ISO datetime string
  reminder_channel?: 'push' | 'email' | 'both'  // default 'push'
}
```

Response `data`:
```ts
{
  id: string
  user_id: string
  title: string
  description: string | null
  is_completed: boolean
  priority: 'low' | 'medium' | 'high'
  due_date: string | null
  reminder_at: string | null
  reminder_channel: string | null
  reminder_sent: boolean
  created_at: string
  updated_at: string
}
```

---

### `update-todo`
**PATCH**

Request body:
```ts
{
  id: string                             // required
  title?: string
  description?: string
  is_completed?: boolean
  priority?: 'low' | 'medium' | 'high'
  due_date?: string | null
  reminder_at?: string | null
  reminder_channel?: 'push' | 'email' | 'both' | null
}
```

Response `data`: Updated todo object

**Side effect:** If `is_completed` is set to `true`, any scheduled push notification for this todo is cancelled.

---

### `delete-todo`
**DELETE**

Request body:
```ts
{ id: string }
```

Response `data`: `{ deleted: true }`

---

### `get-todos`
**GET**

Query params:
```
?is_completed=false     // filter by completion (default: false = show active)
?priority=high          // optional filter
?due_today=true         // optional — only return todos due today
```

Response `data`:
```ts
Array<{
  id: string
  title: string
  description: string | null
  is_completed: boolean
  priority: 'low' | 'medium' | 'high'
  due_date: string | null
  reminder_at: string | null
  created_at: string
}>
```

---

## Notifications

### `send-notification` (internal)
**POST** — Called internally by other edge functions or a cron job. Not called directly from frontend.

Request body:
```ts
{
  user_id: string
  type: 'todo_reminder' | 'daily_review'
  channel: 'email' | 'push'
  payload: {
    title: string
    body: string
    data?: Record<string, unknown>
  }
}
```
