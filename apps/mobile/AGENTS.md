# AGENTS.md — apps/mobile

> Overrides and additions for agents working inside the mobile app.
> Root AGENTS.md rules still apply — this file adds mobile-specific guidance.

---

## Your scope

You are working on the **Expo React Native mobile app**. Your output lives in `apps/mobile/`.

Do not modify anything in `supabase/` or `packages/shared/` unless the task explicitly says to.

If you need a type that doesn't exist in `@memora/shared`, flag it rather than creating a local duplicate.

---

## Key paths

```
apps/mobile/
├── app/                      # Expo Router file-based navigation
│   ├── _layout.tsx           # Root layout — auth gate lives here
│   ├── (tabs)/               # Bottom tab screens
│   │   ├── _layout.tsx       # Tab bar config
│   │   ├── index.tsx         # Home/Dashboard
│   │   ├── flashcards.tsx    # Flashcards tab
│   │   └── todos.tsx         # Todos tab
│   └── auth/
│       ├── login.tsx
│       └── signup.tsx
├── components/
│   ├── ui/                   # Shared base components (Button, Card, Input...)
│   ├── flashcards/           # Flashcard feature components
│   └── todos/                # Todo feature components
├── hooks/                    # Custom React hooks (data fetching, side effects)
├── services/                 # API calls to Supabase edge functions
├── stores/                   # Zustand state stores
└── lib/
    ├── supabase.ts           # Supabase client
    └── notifications.ts      # Expo notifications setup
```

---

## Mobile-specific rules

### Navigation
- Use Expo Router file-based routing. Do not use `react-navigation` directly.
- Screen components must be **default exports** (Expo Router requirement).
- Use `router.push()` and `router.back()` from `expo-router`.

### Styling
- Use `StyleSheet.create()` but populate values **only from design constants**.
- Never write `{ color: '#22C55E' }` — write `{ color: Colors.primary }`.
- Import design constants: `import { Colors, Spacing, Radius, Typography, Shadow } from '@memora/shared/constants/design'`

### State
- **Zustand** for global state (flashcard store, todo store, auth store).
- Local `useState` is fine for UI-only state (modal open/close, form inputs before submit).
- Never fetch data inside components — use hooks that delegate to the store.

### API calls
- All edge function calls go through `services/flashcard.service.ts` or `services/todo.service.ts`.
- Use `supabase.functions.invoke()` — it auto-attaches the JWT.
- Always destructure `{ data }` from invoke and check `data.success` before using `data.data`.

### Notifications
- Request permissions early (after first login) with a friendly explanation before the system prompt.
- Schedule push reminders locally with `expo-notifications`.
- Store `notificationId` keyed by `todo.id` in memory (Zustand store) to enable cancellation.

### Performance
- Use `useFocusEffect` from `expo-router` to refresh data when returning to a tab.
- FlatList for all lists — never ScrollView + map for long lists.
- Use `keyExtractor` always on FlatLists.

### Testing UI
```bash
cd apps/mobile
npx expo start --clear
```
For specific platform:
```bash
npx expo run:ios
npx expo run:android
```

---

## Component checklist

Before submitting any component:
- [ ] Props typed with a named `interface`, not inline
- [ ] No hardcoded colors/spacing — all from design constants
- [ ] Loading and error states handled
- [ ] Empty state handled for lists
- [ ] Accessible (accessibilityLabel on interactive elements)
- [ ] Works on both iOS and Android (test both platforms)