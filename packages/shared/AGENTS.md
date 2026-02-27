# AGENTS.md — packages/shared

> Overrides for agents working on the shared package.
> Root AGENTS.md rules still apply.

---

## Your scope

You are working on the **shared TypeScript package** used by both the mobile app and Supabase edge functions. Your output lives in `packages/shared/`.

This package must be **framework-agnostic pure TypeScript**. No React, no React Native, no Deno-specific globals, no Node.js APIs.

---

## Critical rules for this package

1. **No platform-specific code.** This package runs in React Native, Deno (edge functions), and future web. If you need something platform-specific, it does NOT belong here.

2. **No side effects at import.** Everything must be pure, importable functions and types.

3. **Zod schemas and TypeScript types must always stay in sync.** If you add a field to a Zod schema, add it to the corresponding TypeScript interface too.

4. **Everything is exported from `index.ts`.** If you add a new file, re-export it from the package root.

5. **`ts-fsrs` is the only allowed external dependency** (plus `zod` which is already there). Do not add dependencies without discussion — this package is imported by a Deno runtime which resolves npm packages differently.

---

## Files in this package

```
packages/shared/
├── index.ts                    # Root — re-exports everything
├── types/
│   ├── index.ts
│   ├── flashcard.types.ts      # Deck, Flashcard, ReviewRating, payloads
│   ├── todo.types.ts           # Todo, Priority, payloads
│   └── auth.types.ts           # User, AuthState
├── validators/
│   ├── index.ts
│   ├── flashcard.validators.ts # Zod schemas for flashcard edge functions
│   └── todo.validators.ts      # Zod schemas for todo edge functions
├── constants/
│   ├── index.ts
│   └── design.ts               # ALL design tokens (Colors, Spacing, Radius...)
└── utils/
    ├── index.ts
    └── fsrs.utils.ts           # previewRatings() — pure FSRS helper
```

---

## When adding a new type

1. Add the TypeScript interface to the appropriate `types/*.types.ts` file
2. Add the corresponding Zod schema to `validators/*.validators.ts`
3. Export both from the respective `index.ts`
4. Verify the package still type-checks: `cd packages/shared && npx tsc --noEmit`

---

## Design constants rule

`constants/design.ts` is the single source of truth for all UI values. When adding a constant:
- Use `as const` on every object
- Follow the existing naming pattern
- Never add values that are specific to one screen — this file is for tokens, not one-off values