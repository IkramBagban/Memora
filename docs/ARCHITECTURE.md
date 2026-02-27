# ARCHITECTURE.md

> Read `AGENT_CONTEXT.md` first before this file.

---

## Monorepo Setup

This is a simple monorepo **without Turborepo**. It uses npm workspaces.

```json
// root package.json
{
  "name": "memora",
  "private": true,
  "workspaces": [
    "apps/mobile",
    "packages/shared"
  ]
}
```

The shared package is imported as `@memora/shared` in mobile and future web apps.

```json
// packages/shared/package.json
{
  "name": "@memora/shared",
  "main": "./index.ts"
}
```

---

## Database Schema (Supabase / Postgres)

### `flashcard_decks`
```sql
CREATE TABLE flashcard_decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#22C55E',   -- deck accent color
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE flashcard_decks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own decks"
  ON flashcard_decks FOR ALL
  USING (auth.uid() = user_id);
```

### `flashcards`
```sql
CREATE TABLE flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID NOT NULL REFERENCES flashcard_decks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  front TEXT NOT NULL,           -- question side
  back TEXT NOT NULL,            -- answer side
  -- FSRS fields (managed by ts-fsrs)
  due TIMESTAMPTZ DEFAULT NOW(),
  stability FLOAT DEFAULT 0,
  difficulty FLOAT DEFAULT 0,
  elapsed_days INT DEFAULT 0,
  scheduled_days INT DEFAULT 0,
  reps INT DEFAULT 0,
  lapses INT DEFAULT 0,
  state INT DEFAULT 0,           -- 0=New, 1=Learning, 2=Review, 3=Relearning
  last_review TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own flashcards"
  ON flashcards FOR ALL
  USING (auth.uid() = user_id);
```

### `todos`
```sql
CREATE TABLE todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  -- Reminder fields
  reminder_at TIMESTAMPTZ,           -- when to send reminder
  reminder_channel TEXT CHECK (reminder_channel IN ('push', 'email', 'both')) DEFAULT 'push',
  reminder_sent BOOLEAN DEFAULT FALSE,
  -- Recurrence (future)
  recurrence TEXT,                   -- null for one-time
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own todos"
  ON todos FOR ALL
  USING (auth.uid() = user_id);
```

---

## Edge Functions List

| Function Name | Method | Description |
|---|---|---|
| `create-flashcard-deck` | POST | Create a new deck |
| `update-flashcard-deck` | PATCH | Update deck title/description |
| `delete-flashcard-deck` | DELETE | Delete deck and all its cards |
| `get-flashcard-decks` | GET | List all user's decks |
| `create-flashcard` | POST | Add card to a deck |
| `update-flashcard` | PATCH | Edit card front/back |
| `delete-flashcard` | DELETE | Remove a card |
| `get-due-flashcards` | GET | Get cards due for review today |
| `review-flashcard` | POST | Submit a review rating, update FSRS fields |
| `create-todo` | POST | Create a new todo |
| `update-todo` | PATCH | Update any todo fields |
| `delete-todo` | DELETE | Delete a todo |
| `get-todos` | GET | List todos with filters |
| `get-home-summary` | GET | Home dashboard streak + today summary metrics |
| `send-notification` | POST | Internal — sends email via Resend |

---

## Shared Package Structure

```
packages/shared/
├── index.ts                     # Re-exports everything
├── types/
│   ├── index.ts
│   ├── flashcard.types.ts
│   ├── todo.types.ts
│   └── auth.types.ts
├── validators/
│   ├── index.ts
│   ├── flashcard.validators.ts  # Zod schemas
│   └── todo.validators.ts
├── constants/
│   ├── index.ts
│   └── design.ts                # ALL design tokens
└── utils/
    ├── index.ts
    └── fsrs.utils.ts            # FSRS helper wrappers
```

---

## Edge Function Shared Utilities

```
supabase/functions/_shared/
├── cors.ts          # CORS headers constant
├── auth.ts          # verifyJWT(req) → { userId } or throws 401
├── response.ts      # success(data), error(code, message, status)
└── validate.ts      # validateBody(schema, body) using Zod
```

### `_shared/response.ts` pattern
```ts
export const success = (data: unknown, status = 200) =>
  new Response(JSON.stringify({ success: true, data }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

export const error = (code: string, message: string, status = 400) =>
  new Response(JSON.stringify({ success: false, error: { code, message } }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
```

---

## Mobile App Folder Details

```
apps/mobile/
├── app/
│   ├── _layout.tsx              # Root layout, auth gate
│   ├── (tabs)/
│   │   ├── _layout.tsx          # Tab bar config (3 tabs)
│   │   ├── index.tsx            # Home/Dashboard tab
│   │   ├── flashcards.tsx       # Flashcards tab
│   │   └── todos.tsx            # Todos tab
│   └── auth/
│       ├── login.tsx
│       └── signup.tsx
├── components/
│   ├── ui/                      # Pure reusable base components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Badge.tsx
│   │   ├── Modal.tsx
│   │   └── Toast.tsx
│   ├── flashcards/
│   │   ├── DeckCard.tsx
│   │   ├── FlashcardReview.tsx  # The flip card UI
│   │   ├── RatingButtons.tsx    # Again/Hard/Good/Easy
│   │   └── DeckForm.tsx
│   └── todos/
│       ├── TodoItem.tsx
│       ├── TodoForm.tsx
│       └── ReminderPicker.tsx
├── hooks/
│   ├── useFlashcards.ts
│   ├── useTodos.ts
│   └── useNotifications.ts
├── services/                    # Calls to Supabase edge functions
│   ├── flashcard.service.ts
│   └── todo.service.ts
├── stores/
│   ├── flashcard.store.ts       # Zustand
│   └── todo.store.ts
└── lib/
    ├── supabase.ts              # Supabase client init
    └── notifications.ts         # Expo notifications setup
```

---

## Environment Variables

```env
# apps/mobile/.env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=

# supabase/functions/.env (for edge functions via Supabase secrets)
RESEND_API_KEY=
```
