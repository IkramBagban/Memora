# Feature Execution Guide (Single-Agent, Full-Stack)

Use this when creating GitHub issues for coding agents.

---

## Goal

Each feature issue should be solvable by **one agent** across:
- Mobile frontend (`apps/mobile`)
- Shared package (`packages/shared`)
- Supabase backend (`supabase/functions`, `supabase/migrations`)

---

## Required Context to Attach in Each Issue

1. `AGENTS.md` (root)
2. `docs/AGENT_CONTEXT.md`
3. `docs/API_CONTRACTS.md`
4. Feature full-stack playbook:
   - Todos: `docs/features/todos/fullstack.md`
   - Flashcards: `docs/features/flashcards/fullstack.md`

---

## Issue Writing Pattern

Use this structure for every feature issue:

1. **Scope** — exactly what to build (MVP only)
2. **API contract impact** — new/changed endpoints and payloads
3. **Frontend behavior** — screens, components, states, navigation
4. **Backend behavior** — auth, validation, DB operations, errors
5. **Shared types/validators** — what to add/update in `@memora/shared`
6. **Acceptance criteria** — clear pass/fail bullets
7. **Out of scope** — explicit exclusions

---

## Definition of Done (for agent-created PRs)

- Uses shared design constants only (no hardcoded UI values)
- Uses shared types/validators (no duplicated interfaces)
- Edge functions enforce auth and ownership checks
- Zod validation for external inputs
- API responses follow `{ success, data }` / `{ success, error }`
- `npm run lint` and `npm run typecheck` pass
- Relevant docs updated if contracts/behavior changed
