# AGENT_CONTEXT.md
> **Every agent MUST read this file before writing any code.**

---

## What Are We Building?

**Memora** — A personal memory OS for professionals and students. It combines spaced-repetition flashcards (using the FSRS algorithm) and smart todos with reminders into one minimal, focused app. The core philosophy: don't just capture information — resurface it at the right time.

**Tagline:** *Your second brain. That actually reminds you.*

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile App | React Native (Expo SDK 51+) |
| Backend | Supabase (Postgres + Edge Functions + Auth + Realtime) |
| Shared Package | `/packages/shared` — types, constants, utils |
| Notifications | Expo Notifications (push) |
| Algorithm | `ts-fsrs` for spaced repetition |
| Validation | Zod (used in both edge functions and frontend) |
| State Management | Zustand |
| Navigation | Expo Router (file-based) |

---

## Repo Structure

```
memora/
├── apps/
│   └── mobile/                  # Expo React Native app
│       ├── app/                 # Expo Router pages
│       │   ├── (tabs)/
│       │   │   ├── index.tsx    # Home / Dashboard
│       │   │   ├── flashcards.tsx
│       │   │   └── todos.tsx
│       │   ├── _layout.tsx
│       │   └── auth/
│       │       ├── login.tsx
│       │       └── signup.tsx
│       ├── components/          # Reusable UI components
│       │   ├── ui/              # Base components (Button, Card, Input, etc.)
│       │   ├── flashcards/      # Feature-specific components
│       │   └── todos/
│       ├── hooks/               # Custom hooks
│       ├── stores/              # Zustand stores
│       ├── services/            # API call functions (calls Supabase edge functions)
│       └── constants/           # Re-exports from shared + app-specific constants
├── packages/
│   └── shared/                  # Shared between mobile and future web
│       ├── types/               # All TypeScript types/interfaces
│       ├── constants/           # Design tokens, app constants
│       ├── validators/          # Zod schemas (used by both frontend and backend)
│       └── utils/               # Pure utility functions
└── supabase/
    ├── functions/               # Edge functions (one folder per function)
    │   ├── _shared/             # Shared utils for edge functions
    │   │   ├── cors.ts
    │   │   ├── auth.ts          # JWT verification helper
    │   │   └── response.ts      # Standardized response helpers
    │   ├── create-flashcard/
    │   ├── review-flashcard/
    │   ├── create-todo/
    │   ├── update-todo/
    │   ├── delete-todo/
    │   ├── get-due-flashcards/
    │   └── send-notification/
    └── migrations/              # SQL migration files
```

---

## Core Principles — Follow These Always

### 1. DRY & Reusable
- Never duplicate types. All types live in `packages/shared/types/`.
- Never duplicate Zod schemas. They live in `packages/shared/validators/` and are imported by both frontend services and backend edge functions.
- Never hardcode colors, spacing, or border radius. Always import from `packages/shared/constants/design.ts`.

### 2. Design System Constants
All UI values come from constants. Example:
```ts
import { Colors, Radius, Spacing, Typography } from '@memora/shared/constants/design'
```
Never write `color: '#22C55E'` or `borderRadius: 12` inline. Always use the constant.

### 3. Authorization — Critical
Every edge function MUST verify the JWT and extract `user_id`. A user can ONLY read/write their own data. Row Level Security (RLS) is enabled on all tables. Edge functions also enforce this in application logic.

### 4. Error Handling
- Frontend: All API calls wrapped in try/catch, errors shown via toast/alert, never silently swallowed.
- Backend: All edge functions return standardized `{ success, data, error }` responses with proper HTTP status codes.
- Validation: Zod validates all inputs on both frontend (before calling API) and backend (first thing in edge function).

### 5. Future Web Compatibility
- Backend edge functions are HTTP-based and work for any client (mobile or web).
- All shared types/validators are framework-agnostic pure TypeScript.
- No React Native-specific code in `packages/shared/`.
- Business logic lives in hooks/services, not components.

### 6. Code Style
- Use `async/await`, never `.then()` chains.
- Prefer named exports over default exports for components.
- One component per file.
- All components receive typed props via interface.
- No `any` types. Ever.

### 7. Database and Migration Discipline
- Any DB change (table, column, index, trigger, RLS policy, function) MUST be shipped in a SQL migration under `supabase/migrations/`.
- If backend code references a table that is not present in migrations, add a migration before finishing.
- Do not rely on manual dashboard schema edits as a source of truth.

### 8. Edge Function Import Maps
- If an edge function imports shared validators from `packages/shared/validators`, its function folder must include a `deno.json` import map.
- Required mapping for validator support:
    - `"zod": "npm:zod@3.25.76"`
- Missing import maps cause deploy bundling errors like `Relative import path "zod" not prefixed...`.

### 9. Browser CORS + Preflight (Edge Functions)
- Any edge function called from web clients must handle preflight first:
    - `if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })`
- Success and error responses must include shared CORS headers via `_shared/response.ts` helpers.
- Keep browser-invoked functions consistent with gateway auth mode during deploy (for this repo, deploy with `--no-verify-jwt`) and enforce auth inside the function using `_shared/auth.ts`.
- If browser shows `Response to preflight request doesn't pass access control check`, verify live `OPTIONS` returns `200` before debugging app code.

---

## Authentication Flow

- Supabase Auth handles signup/login (email+password, magic link).
- JWT is stored securely via Expo SecureStore.
- Every edge function call includes the JWT in `Authorization: Bearer <token>` header.
- Supabase client on frontend auto-attaches the token.

---

## Notification System

Push notifications only. Expo Notifications SDK sends reminders to user devices. A Supabase cron job marks reminders as sent when their scheduled time passes.

---

## Database Tables (Overview)

```sql
users           -- managed by Supabase Auth
flashcard_decks -- user's decks (collections of flashcards)
flashcards      -- individual cards with FSRS scheduling fields
todos           -- user's todo items with optional reminder fields
```

Full schema in `ARCHITECTURE.md`.

---

## API Response Standard

Every edge function returns:
```ts
// Success
{ success: true, data: <T> }

// Error
{ success: false, error: { code: string, message: string } }
```

HTTP status codes:
- `200` — success
- `400` — validation error
- `401` — unauthorized
- `403` — forbidden (trying to access another user's data)
- `404` — not found
- `500` — server error

---

## What NOT to Do

- Do NOT use `StyleSheet.create` with hardcoded values. Use design constants.
- Do NOT store sensitive data in AsyncStorage. Use SecureStore.
- Do NOT write business logic inside components. Use hooks.
- Do NOT skip Zod validation on edge functions.
- Do NOT allow any RLS bypass.
- Do NOT write platform-specific code in `packages/shared`.
- Do NOT create duplicate type definitions. Check shared package first.
