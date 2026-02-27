# AGENTS.md

> Read this file before doing any work in this repository.
> Codex, Claude, Cursor, Copilot, Amp, Jules — this applies to all of you.

---

## What is this project?

**Memora** — a mobile-first personal memory OS. It combines FSRS spaced-repetition flashcards and smart todo reminders into one calm, minimal app. The philosophy: don't just capture — resurface at the right time.

Stack: **React Native (Expo)** + **Supabase (Edge Functions + Auth + Postgres)** + shared TypeScript package.

Detailed PRD, architecture, and feature specs are in `/docs/`. Read those before writing feature code.

---

## Repo layout

```
memora/
├── AGENTS.md                  ← you are here
├── apps/
│   └── mobile/                ← Expo React Native app
│       └── AGENTS.md          ← mobile-specific overrides
├── packages/
│   └── shared/                ← shared types, validators, constants, utils
│       └── AGENTS.md
├── supabase/
│   ├── functions/             ← Deno edge functions
│   │   └── AGENTS.md          ← backend-specific overrides
│   └── migrations/
├── docs/                      ← full PRD and feature specs (READ THESE)
│   ├── AGENT_CONTEXT.md
│   ├── ARCHITECTURE.md
│   ├── DESIGN_SYSTEM.md
│   ├── API_CONTRACTS.md
│   ├── SHARED_TYPES.md
│   └── features/
│       ├── flashcards/frontend.md + backend.md
│       ├── todos/frontend.md + backend.md
│       ├── auth/frontend.md
│       └── home/frontend.md
└── .codex/
    └── skills/                ← Codex agent skills
```

---

## Mandatory reading before coding

| What you're building | Read these docs first |
|---|---|
| Any feature | `docs/AGENT_CONTEXT.md` + `docs/API_CONTRACTS.md` |
| Frontend (mobile) | + `docs/DESIGN_SYSTEM.md` + the feature's `frontend.md` |
| Backend (edge functions) | + the feature's `backend.md` |
| Shared types/utils | `docs/SHARED_TYPES.md` |
| Database / migrations | `docs/ARCHITECTURE.md` (DB schema section) |

---

## Commands

```bash
# Install dependencies
npm install

# Run mobile app
cd apps/mobile && npx expo start

# Run a specific edge function locally
cd supabase && npx supabase functions serve <function-name>

# Deploy edge functions
npx supabase functions deploy <function-name>

# Run migrations
npx supabase db push

# Type check
npm run typecheck

# Lint
npm run lint

# Run lint before opening any PR
npm run lint && npm run typecheck
```

---

## Non-negotiable rules

1. **Never hardcode design values.** Colors, spacing, radius, typography all come from `packages/shared/constants/design.ts`. Import, don't inline.

2. **Never duplicate types.** All TypeScript interfaces and Zod schemas live in `packages/shared/`. Check there before defining anything new.

3. **Every edge function must verify auth.** Use the shared `verifyAuth()` from `supabase/functions/_shared/auth.ts`. Never skip this.

4. **RLS is enabled on all tables.** Edge functions use service role key but still check `user_id` manually. Defense in depth.

5. **No `any` types.** Ever. Use `unknown` and narrow it.

6. **No business logic in components.** Logic goes in hooks or store actions.

7. **Follow the API contract.** All edge function inputs and outputs are defined in `docs/API_CONTRACTS.md`. Do not deviate without updating that file too.

8. **Run `npm run lint` before finishing any task.** Fix all errors.

9. **Any new table/column/index/policy change must have a migration in `supabase/migrations/`.** Never leave schema changes only in docs or code assumptions.

10. **Every new edge function folder must include `deno.json` import map when shared validators are used.** At minimum map `"zod": "npm:zod@3.25.76"` so shared `packages/shared/validators/*.ts` imports bundle correctly.

---

## Coding standards

- **Language:** TypeScript strict mode everywhere
- **Async:** `async/await` only, never `.then()` chains
- **Exports:** Named exports preferred over default exports (exception: Expo Router page components must be default exports)
- **Files:** One component per file, file name matches component name
- **Imports:** Use path aliases — `@/components`, `@/hooks`, `@memora/shared`
- **Styling:** No inline style objects with hardcoded values — use design constants
- **Error handling:** Every async operation wrapped in try/catch; errors surfaced via Toast, never silently swallowed
- **Validation:** Zod for all external inputs — both edge functions AND frontend forms

---

## PR guidelines

- Branch naming: `feature/<name>`, `fix/<name>`, `chore/<name>`
- Commit messages: present tense imperative — "Add reminder picker component"
- Every PR must pass `npm run lint` and `npm run typecheck`
- Update `docs/API_CONTRACTS.md` if you add or change an edge function
- Update the relevant feature doc in `docs/features/` if behavior changes

---

## What NOT to do

- Do not install new packages without checking if the functionality already exists in the shared package or a current dependency
- Do not create migration files manually — use `npx supabase migration new <name>`
- Do not add or rename DB tables without adding/updating a matching migration file in `supabase/migrations/`
- Do not commit `.env` files or any secrets
- Do not use `AsyncStorage` for sensitive data — use `expo-secure-store`
- Do not write platform-specific (iOS/Android) code in `packages/shared/`
- Do not add features that aren't in the docs without flagging it first