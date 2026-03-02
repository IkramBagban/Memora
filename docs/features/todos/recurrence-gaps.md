# Recurring Todos — Phase 2 Gaps

This document tracks follow-up work after the initial recurring todos implementation.

## Current status (Phase 1 done)
- Recurrence model added (`none | daily | weekly`) with multiple times and weekdays.
- Recurrence payload wired through shared types/validators, mobile service, and todo edge functions.
- Local push scheduling supports multiple reminders per todo.
- Recurrence controls added in todo form UI.

## Gaps for next consideration

### 1) Recurring email/cron delivery
- Current cron/email flow still uses one-shot `reminder_at` + `reminder_sent` semantics.
- Needed:
  - Recurrence-aware selector in cron flow.
  - Advance next occurrence after sending recurring reminder.
  - Avoid duplicate sends for same occurrence.
- Impacted areas:
  - `supabase/migrations/20260227090000_create_todos_and_reminder_cron.sql`
  - `supabase/functions/send-notification/index.ts`

### 2) Completion mode behavior (`occurrence` vs `series`)
- Completion mode is captured in recurrence payload but not fully enforced in toggle logic.
- Needed:
  - `occurrence`: complete only current occurrence and schedule next.
  - `series`: stop future reminders for the whole recurring todo.
- Impacted areas:
  - `apps/mobile/src/stores/todo.store.ts`
  - `supabase/functions/update-todo/index.ts`

### 3) Account-level timezone support
- Current local scheduling behaves with device timezone only.
- Product decision was account-level timezone.
- Needed:
  - Add timezone source in auth/profile flow and propagate to recurrence calculations.
  - Use the same timezone in backend occurrence evaluation and mobile scheduling display.
- Impacted areas:
  - profile/auth metadata handling
  - todo recurrence calculation logic (mobile + backend)

### 4) Recurrence occurrence model hardening
- Recurrence currently stored in `todos.recurrence` as text JSON.
- Needed:
  - Decide whether to keep JSON text or move to structured/JSONB schema for indexing and querying.
  - Add migration/backfill plan for long-term scalability.

### 5) API contract and docs hardening
- Contracts were updated for recurrence payload, but behavior-level guarantees need clearer spec.
- Needed:
  - Explicit rules for weekly recurrence with multiple times.
  - Explicit completion semantics and edge cases.
  - Clarify channel behavior when user selects `push`, `email`, `both`.
- Impacted docs:
  - `docs/API_CONTRACTS.md`
  - `docs/features/todos/backend.md`
  - `docs/features/todos/frontend.md`

## Suggested implementation order (next phase)
1. Completion mode behavior in store + update endpoint.
2. Timezone source wiring (account-level).
3. Recurrence-aware cron/email delivery.
4. Schema hardening (if moving beyond text JSON recurrence).
5. Add tests for recurrence edge cases.
