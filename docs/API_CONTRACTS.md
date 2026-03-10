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

## Browser CORS Requirement

- Edge functions invoked from browser origins (for example `http://localhost:8081`) must respond to preflight requests with HTTP `200`.
- Implement in every browser-invoked function:

```ts
if (req.method === 'OPTIONS') {
  return new Response('ok', { headers: corsHeaders })
}
```

- All normal success/error responses must include CORS headers (use shared response helpers).
- For this repository's current setup, deploy browser-invoked functions with `--no-verify-jwt`, and keep JWT validation in-function via shared `verifyAuth()`.

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
  recurrence?: {
    type: 'daily' | 'weekly'
    times: string[]                      // HH:mm, multiple allowed
    weekdays?: Array<'mon'|'tue'|'wed'|'thu'|'fri'|'sat'|'sun'> // weekly only
    completion_mode?: 'occurrence' | 'series'
  } | null
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
  recurrence: {
    type: 'daily' | 'weekly'
    times: string[]
    weekdays?: Array<'mon'|'tue'|'wed'|'thu'|'fri'|'sat'|'sun'>
    completion_mode?: 'occurrence' | 'series'
  } | null
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
  recurrence?: {
    type: 'daily' | 'weekly'
    times: string[]
    weekdays?: Array<'mon'|'tue'|'wed'|'thu'|'fri'|'sat'|'sun'>
    completion_mode?: 'occurrence' | 'series'
  } | null
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
  recurrence: {
    type: 'daily' | 'weekly'
    times: string[]
    weekdays?: Array<'mon'|'tue'|'wed'|'thu'|'fri'|'sat'|'sun'>
    completion_mode?: 'occurrence' | 'series'
  } | null
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


---

## Home

### `get-home-summary`
**GET**

No body. Returns aggregated metrics for the authenticated user's home dashboard.

Response `data`:
```ts
{
  current_streak: number          // consecutive days with at least one flashcard review
  completed_todos_today: number   // todos marked completed today
  reviewed_cards_today: number    // flashcards reviewed today
}
```

---

## DNS

> DNS management is provider-aware and currently supports **Namecheap first** and **Cloudflare second**. All endpoints require auth and accept a `provider` field to select the integration.

### `dns-list-records`
**POST**

Request body:
```ts
{
  provider: 'namecheap' | 'cloudflare'
  domain: string
}
```

Response `data`:
```ts
{
  provider: 'namecheap' | 'cloudflare'
  domain: string
  count: number
  records: Array<{
    id: string
    name: string
    type: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS' | 'SRV' | 'CAA'
    value: string
    ttl: number
    proxied?: boolean
    priority?: number
  }>
}
```

### `dns-create-record`
**POST**

Request body:
```ts
{
  provider: 'namecheap' | 'cloudflare'
  domain: string
  record: {
    name: string
    type: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS' | 'SRV' | 'CAA'
    value: string
    ttl: number
    proxied?: boolean
    priority?: number
  }
}
```

Response `data`:
```ts
{
  provider: 'namecheap' | 'cloudflare'
  domain: string
  record: {
    id: string
    name: string
    type: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS' | 'SRV' | 'CAA'
    value: string
    ttl: number
    proxied?: boolean
    priority?: number
  }
}
```

### `dns-update-record`
**POST**

Request body:
```ts
{
  provider: 'namecheap' | 'cloudflare'
  domain: string
  recordId: string
  patch: {
    name?: string
    type?: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS' | 'SRV' | 'CAA'
    value?: string
    ttl?: number
    proxied?: boolean
    priority?: number
  }
}
```

Response `data`: same shape as `dns-create-record` response.

### `dns-delete-record`
**POST**

Request body:
```ts
{
  provider: 'namecheap' | 'cloudflare'
  domain: string
  recordId: string
}
```

Response `data`:
```ts
{
  provider: 'namecheap' | 'cloudflare'
  domain: string
  recordId: string
  deleted: true
}
```
