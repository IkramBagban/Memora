# features/flashcards/backend.md

> Read `AGENT_CONTEXT.md` before this file.
> API contracts (exact inputs/outputs) are in `API_CONTRACTS.md`.

---

## Overview

Backend for flashcards consists of Supabase Edge Functions (Deno runtime). The core logic uses the `ts-fsrs` library for spaced repetition scheduling.

---

## Shared Utilities

Every edge function imports from `supabase/functions/_shared/`:

```ts
import { corsHeaders } from '../_shared/cors.ts'
import { verifyAuth } from '../_shared/auth.ts'
import { success, error } from '../_shared/response.ts'
import { validateBody } from '../_shared/validate.ts'
```

### `_shared/auth.ts`
```ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export async function verifyAuth(req: Request): Promise<string> {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) throw { status: 401, code: 'UNAUTHORIZED', message: 'Missing token' }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) throw { status: 401, code: 'UNAUTHORIZED', message: 'Invalid token' }

  return user.id
}
```

### `_shared/validate.ts`
```ts
import { z, ZodSchema } from 'https://deno.land/x/zod/mod.ts'

export async function validateBody<T>(req: Request, schema: ZodSchema<T>): Promise<T> {
  const body = await req.json()
  const result = schema.safeParse(body)
  if (!result.success) {
    throw { status: 400, code: 'VALIDATION_ERROR', message: result.error.issues[0].message }
  }
  return result.data
}
```

---

## Zod Schemas (shared)

These live in `packages/shared/validators/flashcard.validators.ts` and are imported by edge functions:

```ts
import { z } from 'zod'

export const CreateDeckSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional().default('#22C55E'),
})

export const UpdateDeckSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
})

export const CreateFlashcardSchema = z.object({
  deck_id: z.string().uuid(),
  front: z.string().min(1).max(1000),
  back: z.string().min(1).max(1000),
})

export const UpdateFlashcardSchema = z.object({
  id: z.string().uuid(),
  front: z.string().min(1).max(1000).optional(),
  back: z.string().min(1).max(1000).optional(),
})

export const ReviewFlashcardSchema = z.object({
  id: z.string().uuid(),
  rating: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
})

export const DeleteSchema = z.object({
  id: z.string().uuid(),
})
```

---

## Edge Function Implementations

### `create-flashcard-deck/index.ts`

```ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { verifyAuth } from '../_shared/auth.ts'
import { success, error } from '../_shared/response.ts'
import { validateBody } from '../_shared/validate.ts'
import { CreateDeckSchema } from '../../packages/shared/validators/flashcard.validators.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const userId = await verifyAuth(req)
    const body = await validateBody(req, CreateDeckSchema)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: deck, error: dbError } = await supabase
      .from('flashcard_decks')
      .insert({ ...body, user_id: userId })
      .select()
      .single()

    if (dbError) throw { status: 500, code: 'DB_ERROR', message: dbError.message }

    return success(deck, 201)
  } catch (err: any) {
    return error(err.code ?? 'INTERNAL_ERROR', err.message ?? 'Unknown error', err.status ?? 500)
  }
})
```

All other CRUD functions follow the same pattern. Always:
1. Handle OPTIONS (CORS preflight)
2. `verifyAuth` → get `userId`
3. `validateBody` with Zod schema
4. Run DB operation with Supabase client using service role key
5. Return `success()` or throw to `catch` for `error()`

---

### `review-flashcard/index.ts` — Core FSRS Logic

This is the most important function.

```ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createEmptyCard, fsrs, generatorParameters, Rating } from 'npm:ts-fsrs'
import { corsHeaders } from '../_shared/cors.ts'
import { verifyAuth } from '../_shared/auth.ts'
import { success, error } from '../_shared/response.ts'
import { validateBody } from '../_shared/validate.ts'
import { ReviewFlashcardSchema } from '../../packages/shared/validators/flashcard.validators.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const userId = await verifyAuth(req)
    const { id, rating } = await validateBody(req, ReviewFlashcardSchema)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Fetch card and verify ownership
    const { data: card, error: fetchError } = await supabase
      .from('flashcards')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !card) throw { status: 404, code: 'NOT_FOUND', message: 'Card not found' }
    if (card.user_id !== userId) throw { status: 403, code: 'FORBIDDEN', message: 'Access denied' }

    // Run FSRS algorithm
    const f = fsrs(generatorParameters({ enable_fuzz: true }))
    
    // Reconstruct FSRS card object from DB fields
    const fsrsCard = {
      due: new Date(card.due),
      stability: card.stability,
      difficulty: card.difficulty,
      elapsed_days: card.elapsed_days,
      scheduled_days: card.scheduled_days,
      reps: card.reps,
      lapses: card.lapses,
      state: card.state,
      last_review: card.last_review ? new Date(card.last_review) : undefined,
    }

    const ratingMap = { 1: Rating.Again, 2: Rating.Hard, 3: Rating.Good, 4: Rating.Easy }
    const schedulingCards = f.repeat(fsrsCard, new Date())
    const result = schedulingCards[ratingMap[rating]]

    // Update card in DB with new FSRS values
    const { data: updated, error: updateError } = await supabase
      .from('flashcards')
      .update({
        due: result.card.due.toISOString(),
        stability: result.card.stability,
        difficulty: result.card.difficulty,
        elapsed_days: result.card.elapsed_days,
        scheduled_days: result.card.scheduled_days,
        reps: result.card.reps,
        lapses: result.card.lapses,
        state: result.card.state,
        last_review: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw { status: 500, code: 'DB_ERROR', message: updateError.message }

    return success({
      id: updated.id,
      due: updated.due,
      state: updated.state,
      scheduled_days: updated.scheduled_days,
      stability: updated.stability,
      difficulty: updated.difficulty,
      reps: updated.reps,
      lapses: updated.lapses,
    })
  } catch (err: any) {
    return error(err.code ?? 'INTERNAL_ERROR', err.message ?? 'Unknown error', err.status ?? 500)
  }
})
```

---

### `get-flashcard-decks/index.ts`

Key detail: this function returns `card_count` and `due_count` per deck. Use a Postgres JOIN or two separate queries.

```ts
// Get decks with counts via a view or subquery:
const { data: decks } = await supabase
  .from('flashcard_decks')
  .select(`
    *,
    flashcards(count),
    due_cards:flashcards(count).filter(due.lte.${new Date().toISOString()})
  `)
  .eq('user_id', userId)
  .order('created_at', { ascending: false })

// Alternative: use a Postgres function/view for cleaner querying
```

Recommended: create a database view `deck_stats` in migrations:
```sql
CREATE VIEW deck_stats AS
SELECT
  d.id,
  d.user_id,
  d.title,
  d.description,
  d.color,
  d.created_at,
  COUNT(f.id) AS card_count,
  COUNT(f.id) FILTER (WHERE f.due <= NOW()) AS due_count
FROM flashcard_decks d
LEFT JOIN flashcards f ON f.deck_id = d.id
GROUP BY d.id;
```

---

### `get-due-flashcards/index.ts`

```ts
// Parse optional deck_id from URL query param
const url = new URL(req.url)
const deckId = url.searchParams.get('deck_id')

let query = supabase
  .from('flashcards')
  .select(`*, flashcard_decks(title)`)
  .eq('user_id', userId)
  .lte('due', new Date().toISOString())
  .order('due', { ascending: true })
  .limit(20)

if (deckId) query = query.eq('deck_id', deckId)

const { data: cards } = await query
```

---

## Authorization Rules (enforced in application layer + RLS)

- Always check `card.user_id === userId` / `deck.user_id === userId` before any mutation, even though RLS also enforces this. Defense in depth.
- Return `403 FORBIDDEN` (not 404) when a user tries to access another user's resource by ID — 404 would leak existence info.
- Use `SUPABASE_SERVICE_ROLE_KEY` in edge functions (bypasses RLS for flexibility) but ALWAYS manually enforce user ownership checks.

---

## Error Codes Reference

| Code | Meaning |
|---|---|
| `VALIDATION_ERROR` | Zod schema failed |
| `UNAUTHORIZED` | Missing or invalid JWT |
| `FORBIDDEN` | Valid JWT but wrong user |
| `NOT_FOUND` | Resource doesn't exist |
| `DB_ERROR` | Postgres/Supabase error |
| `INTERNAL_ERROR` | Unexpected server error |
