# packages/shared — Types Reference

> This doc is for agents working on the shared package. These types are imported by BOTH frontend and backend. Define once, use everywhere.

---

## `packages/shared/types/flashcard.types.ts`

```ts
export type CardState = 0 | 1 | 2 | 3  // New | Learning | Review | Relearning
export type ReviewRating = 1 | 2 | 3 | 4  // Again | Hard | Good | Easy

export interface Deck {
  id: string
  user_id: string
  title: string
  description: string | null
  color: string
  card_count: number
  due_count: number
  created_at: string
  updated_at: string
}

export interface Flashcard {
  id: string
  deck_id: string
  user_id: string
  front: string
  back: string
  due: string
  stability: number
  difficulty: number
  elapsed_days: number
  scheduled_days: number
  reps: number
  lapses: number
  state: CardState
  last_review: string | null
  created_at: string
  updated_at: string
}

export interface CreateDeckPayload {
  title: string
  description?: string
  color?: string
}

export interface UpdateDeckPayload {
  id: string
  title?: string
  description?: string | null
  color?: string
}

export interface CreateFlashcardPayload {
  deck_id: string
  front: string
  back: string
}

export interface UpdateFlashcardPayload {
  id: string
  front?: string
  back?: string
}

export interface ReviewResult {
  id: string
  due: string
  state: CardState
  scheduled_days: number
  stability: number
  difficulty: number
  reps: number
  lapses: number
}
```

---

## `packages/shared/types/todo.types.ts`

```ts
export type Priority = 'low' | 'medium' | 'high'
export type RecurrenceType = 'daily' | 'weekly'
export type RecurrenceWeekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'
export type RecurrenceCompletionMode = 'occurrence' | 'series'

export interface TodoRecurrence {
  type: RecurrenceType
  times: string[]
  weekdays?: RecurrenceWeekday[]
  completion_mode?: RecurrenceCompletionMode
}

export interface Todo {
  id: string
  user_id: string
  title: string
  description: string | null
  is_completed: boolean
  priority: Priority
  due_date: string | null      // 'YYYY-MM-DD'
  reminder_at: string | null   // ISO datetime
  reminder_sent: boolean
  recurrence: TodoRecurrence | null
  created_at: string
  updated_at: string
}

export interface CreateTodoPayload {
  title: string
  description?: string
  priority?: Priority
  due_date?: string
  reminder_at?: string
  recurrence?: TodoRecurrence | null
}

export interface UpdateTodoPayload {
  id: string
  title?: string
  description?: string | null
  is_completed?: boolean
  priority?: Priority
  due_date?: string | null
  reminder_at?: string | null
  recurrence?: TodoRecurrence | null
}

export interface TodoFilter {
  isCompleted?: boolean
  priority?: Priority
  dueToday?: boolean
}
```

---

## `packages/shared/types/auth.types.ts`

```ts
export interface User {
  id: string
  email: string
  created_at: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
}
```

---

## `packages/shared/index.ts`

```ts
// Types
export * from './types/flashcard.types'
export * from './types/todo.types'
export * from './types/auth.types'

// Validators
export * from './validators/flashcard.validators'
export * from './validators/todo.validators'

// Constants
export * from './constants/design'

// Utils
export * from './utils/fsrs.utils'
```

---

## `packages/shared/utils/fsrs.utils.ts`

```ts
import { createEmptyCard, fsrs, generatorParameters, Rating } from 'ts-fsrs'
import type { CardState, ReviewRating } from '../types/flashcard.types'

const f = fsrs(generatorParameters({ enable_fuzz: false }))

// Preview what intervals each rating would give — used for rating button labels
export function previewRatings(card: {
  due: string
  stability: number
  difficulty: number
  elapsed_days: number
  scheduled_days: number
  reps: number
  lapses: number
  state: CardState
}): Record<ReviewRating, string> {
  const fsrsCard = {
    ...card,
    due: new Date(card.due),
    last_review: undefined,
  }

  const schedulingCards = f.repeat(fsrsCard, new Date())

  const formatInterval = (days: number): string => {
    if (days < 1) return '<1d'
    if (days === 1) return '1d'
    if (days < 30) return `${days}d`
    if (days < 365) return `${Math.round(days / 30)}mo`
    return `${Math.round(days / 365)}y`
  }

  return {
    1: formatInterval(schedulingCards[Rating.Again].card.scheduled_days),
    2: formatInterval(schedulingCards[Rating.Hard].card.scheduled_days),
    3: formatInterval(schedulingCards[Rating.Good].card.scheduled_days),
    4: formatInterval(schedulingCards[Rating.Easy].card.scheduled_days),
  }
}
```


---

## `packages/shared/types/home.types.ts`

```ts
export interface HomeSummary {
  current_streak: number
  completed_todos_today: number
  reviewed_cards_today: number
}
```
