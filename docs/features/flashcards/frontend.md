# features/flashcards/frontend.md

> Read `AGENT_CONTEXT.md` and `DESIGN_SYSTEM.md` before this file.
> API contracts (function names, request/response shapes) are in `API_CONTRACTS.md`.

---

## Feature Overview

The flashcards feature lets users create decks of cards and review them using the FSRS spaced repetition algorithm. The app tells users which cards are due today and guides them through a review session.

---

## Screens & Components

### 1. Flashcards Tab (`app/(tabs)/flashcards.tsx`)

**Purpose:** Shows all of the user's decks. Entry point for everything flashcard-related.

**Layout:**
```
Header: "Flashcards"  [+ button top right]
─────────────────────
"X cards due today" — green chip summary banner (if any due)
─────────────────────
List of DeckCard components (vertical FlatList)
─────────────────────
FAB: green + icon → opens CreateDeckModal
```

**DeckCard component** (`components/flashcards/DeckCard.tsx`):
- Shows: deck title, description (1 line, truncated), card count, due count
- Due count badge: green pill showing "X due" — if 0 due, hide the badge
- Tap card → navigate to DeckDetail screen
- Long press → show action sheet (Edit / Delete)
- Card style: `Colors.surface`, `Radius.md`, `Shadow.sm`, `Spacing.md` padding

---

### 2. Deck Detail Screen (`app/flashcards/[deckId].tsx`)

**Purpose:** Shows all cards in a deck + option to start review session.

**Layout:**
```
Back button  |  Deck title  |  Edit button
─────────────────────
Deck description (if any)
"X cards · Y due today" metadata row
─────────────────────
[Start Review] button — full width, green, pill — only shows if due_count > 0
─────────────────────
"All Cards" section
FlatList of FlashcardListItem (front text, state badge)
─────────────────────
FAB: + to add new card
```

**FlashcardListItem:**
- Shows front text (1 line truncated)
- State badge: "New" (gray), "Learning" (yellow), "Review" (green), "Relearning" (orange)
- Tap → open EditCardModal
- Swipe left → delete with confirmation

---

### 3. Review Session (`app/flashcards/review.tsx`)

**Purpose:** The core review experience. Shows due cards one by one.

**Flow:**
1. Fetch due cards from `get-due-flashcards` (filtered by deck if coming from deck detail)
2. Show card with front facing up
3. User taps card → it flips to reveal back (3D flip animation using `react-native-reanimated`)
4. Rating buttons appear below: **Again** (red) / **Hard** (orange) / **Good** (green) / **Easy** (blue)
5. User taps rating → call `review-flashcard` → next card
6. When all cards done → show completion screen

**FlashcardReview component** (`components/flashcards/FlashcardReview.tsx`):
```
Card (tappable, fills most of screen):
  [Front visible]
  "Tap to reveal answer"
  
  [After flip]
  Back text visible
  
Below card:
  RatingButtons (Again / Hard / Good / Easy)
  
Progress: "3 / 12" top right
```

**Card flip animation:**
- Use `useSharedValue` and `useAnimatedStyle` from `react-native-reanimated`
- Rotate Y axis 180deg with `withSpring`
- Front face: white background
- Back face: `Colors.primaryLight` background

**RatingButtons component** (`components/flashcards/RatingButtons.tsx`):
- 4 buttons in a row
- Each shows label + next review interval hint (e.g. "Good · 3d")
- The interval hints come from FSRS preview — call a local util from `@memora/shared/utils/fsrs.utils` to preview next intervals without submitting
- Tapping a button submits and moves to next card

**Completion Screen:**
- Shown inline (not a separate screen)
- "Session complete! 🎉"
- Stats: cards reviewed, new cards, cards again'd
- Two buttons: "Review Again" and "Done"

---

### 4. Modals

**CreateDeckModal / EditDeckModal:**
```
Title input (required)
Description input (optional, multiline)
[Color picker — 6 preset colors as circles]
[Save] button
```

**CreateCardModal / EditCardModal:**
```
"Front" label + multiline text input
"Back" label + multiline text input
[Save] button
```

Both modals use `Modal` component from `components/ui/Modal.tsx`:
- Bottom sheet style (slides up from bottom)
- `Radius.xl` on top corners
- White background, `Spacing.md` padding
- Dismissable by tapping backdrop or swipe down

---

## Service Layer (`services/flashcard.service.ts`)

All Supabase edge function calls live here. Components/hooks never call Supabase directly.

```ts
import { supabase } from '@/lib/supabase'
import type { Deck, Flashcard, ReviewRating } from '@memora/shared/types'

export const flashcardService = {
  async getDecks(): Promise<Deck[]> {
    const { data } = await supabase.functions.invoke('get-flashcard-decks')
    if (!data.success) throw new Error(data.error.message)
    return data.data
  },

  async createDeck(payload: CreateDeckPayload): Promise<Deck> {
    const { data } = await supabase.functions.invoke('create-flashcard-deck', { body: payload })
    if (!data.success) throw new Error(data.error.message)
    return data.data
  },

  async getDueCards(deckId?: string): Promise<Flashcard[]> {
    const params = deckId ? `?deck_id=${deckId}` : ''
    const { data } = await supabase.functions.invoke(`get-due-flashcards${params}`)
    if (!data.success) throw new Error(data.error.message)
    return data.data
  },

  async reviewCard(id: string, rating: ReviewRating): Promise<void> {
    const { data } = await supabase.functions.invoke('review-flashcard', { body: { id, rating } })
    if (!data.success) throw new Error(data.error.message)
  },

  // ... createCard, updateCard, deleteCard, deleteDeck, updateDeck
}
```

---

## Zustand Store (`stores/flashcard.store.ts`)

```ts
interface FlashcardStore {
  decks: Deck[]
  dueCards: Flashcard[]
  isLoading: boolean
  error: string | null

  fetchDecks: () => Promise<void>
  fetchDueCards: (deckId?: string) => Promise<void>
  createDeck: (payload: CreateDeckPayload) => Promise<void>
  reviewCard: (id: string, rating: ReviewRating) => Promise<void>
  // optimistic updates for create/delete/update
}
```

Use optimistic updates for better UX: add the item to local state immediately, revert if the API call fails.

---

## Custom Hook (`hooks/useFlashcards.ts`)

Wraps the store and provides convenient derived state for components:

```ts
export function useFlashcards() {
  return useFlashcardStore()
}

export function useDueCount() {
  const { decks } = useFlashcardStore()
  return decks.reduce((sum, d) => sum + d.due_count, 0)
}
```

---

## Types Used (from `@memora/shared/types`)

```ts
// These are defined in packages/shared — do NOT redefine them here

import type { Deck, Flashcard, CreateDeckPayload, CreateFlashcardPayload, ReviewRating } from '@memora/shared/types'
```

---

## Error Handling

- Wrap all service calls in try/catch inside the store actions
- Show errors via a Toast component
- Loading states: use `isLoading` boolean in store to show skeleton loaders

---

## Key Implementation Notes

- Use `react-native-reanimated` for the flip animation (not Animated API)
- The FSRS interval preview for rating button labels: import `previewRatings()` from `@memora/shared/utils/fsrs.utils` — this is a pure function using `ts-fsrs`, no API call needed
- When review session ends, refetch decks to update `due_count` badges
- Empty deck list: show illustration + "Create your first deck" CTA
- Empty deck detail: show "No cards yet" + "Add your first card" CTA
