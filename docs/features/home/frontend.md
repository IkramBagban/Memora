# features/home/frontend.md

> Read `AGENT_CONTEXT.md` and `DESIGN_SYSTEM.md` before this file.

---

## Overview

The Home tab is the dashboard. It's the first screen users see after logging in. Its job is to give a quick, calm overview of what needs attention today — without overwhelming.

---

## Screen Layout (`app/(tabs)/index.tsx`)

```
─────────────────────────────────────
"Good morning, [first name] 👋"    (dynamic greeting by time of day)
Saturday, 1 Feb                     (current date, textSecondary)
─────────────────────────────────────

[Today's Focus Card]  ← green gradient card
  "X cards to review · Y todos due"
  [Start Review] button (white, pill)

─────────────────────────────────────

"Due Today" section header
  [TodoItem mini] (non-interactive preview, max 3)
  "See all →" link

─────────────────────────────────────

"Review Queue" section header
  DeckCard mini list (show due_count badge)
  "See all →" link

─────────────────────────────────────

"Your Streak" section  (future — placeholder for now)
  Streak count + fire emoji

─────────────────────────────────────
```

---

## Today's Focus Card

The hero card at the top. Green gradient (`Colors.primary` to `Colors.primaryDark`).

```
┌─────────────────────────────────────┐
│  🧠 Today's Focus                   │
│  5 flashcards to review             │
│  3 todos due                        │
│                                     │
│  [Start Review]                     │
└─────────────────────────────────────┘
```

- Tapping "Start Review" launches the review session for all due cards across all decks
- If no cards due and no todos: show "You're all caught up! 🎉" with a calmer variant of the card

---

## Greeting Logic

```ts
function getGreeting(firstName: string): string {
  const hour = new Date().getHours()
  if (hour < 12) return `Good morning, ${firstName} 👋`
  if (hour < 17) return `Good afternoon, ${firstName} 👋`
  return `Good evening, ${firstName} 👋`
}
```

Get first name from `user.email` (split at @, capitalize) until a profile/name feature is added.

---

## Data Required

Home screen composes data from both stores:
```ts
const { decks } = useFlashcardStore()
const { todos } = useTodoStore()

const totalDue = decks.reduce((sum, d) => sum + d.due_count, 0)
const todayTodos = todos.filter(t => !t.is_completed && isToday(new Date(t.due_date ?? '')))
```

Fetch both on tab focus using `useFocusEffect` from Expo Router.

---

## Performance

- Home screen should load from store cache immediately, then refresh in background
- Show skeleton loaders only on first load
- Use `useFocusEffect` to refresh counts when returning to home tab
