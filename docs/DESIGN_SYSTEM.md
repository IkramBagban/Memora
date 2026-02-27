# DESIGN_SYSTEM.md

> All design values live in `packages/shared/constants/design.ts`. Import from there. Never hardcode values.

---

## Philosophy

Memora is **clean, minimal, and calm**. It should feel like a notebook, not a dashboard. Every element breathes. Lots of whitespace. Rounded corners everywhere. Two primary colors: **Green** and **White**.

---

## The Constants File

This is the single source of truth. If you want to change the border radius of all cards globally, change it here and it updates everywhere.

```ts
// packages/shared/constants/design.ts

export const Colors = {
  // Primary
  primary: '#22C55E',        // Green — main brand color
  primaryLight: '#DCFCE7',   // Light green — backgrounds, chips
  primaryDark: '#16A34A',    // Dark green — pressed state

  // Neutrals
  white: '#FFFFFF',
  background: '#F9FAFB',     // App background (off-white)
  surface: '#FFFFFF',        // Card/panel background
  border: '#E5E7EB',         // Subtle borders

  // Text
  textPrimary: '#111827',    // Main text
  textSecondary: '#6B7280',  // Subtext, placeholders
  textInverse: '#FFFFFF',    // Text on green backgrounds

  // Semantic
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Priority colors (for todos)
  priorityLow: '#6B7280',
  priorityMedium: '#F59E0B',
  priorityHigh: '#EF4444',
} as const

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,   // pill shape
} as const

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const

export const Typography = {
  // Font sizes
  size: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 30,
  },
  // Font weights
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
} as const

export const Animation = {
  fast: 150,
  normal: 250,
  slow: 400,
} as const
```

---

## Tab Bar Design

3 tabs, centered layout:

```
[ 🃏 Flashcards ]  [ 🏠 Home ]  [ ✅ Todos ]
```

- Active tab: green icon + green label
- Inactive tab: gray icon + gray label
- Tab bar background: white, with a subtle top border
- No tab bar labels, just icons (clean)
- Home icon is slightly larger / elevated to emphasize it

---

## Component Patterns

### Card
```ts
// Always use surface color, md radius, sm or md shadow
{
  backgroundColor: Colors.surface,
  borderRadius: Radius.md,
  padding: Spacing.md,
  ...Shadow.sm,
}
```

### Button — Primary
```ts
{
  backgroundColor: Colors.primary,
  borderRadius: Radius.full,   // pill shape
  paddingVertical: Spacing.sm,
  paddingHorizontal: Spacing.lg,
}
```

### Button — Secondary / Ghost
```ts
{
  backgroundColor: Colors.primaryLight,
  borderRadius: Radius.full,
  // or borderWidth: 1, borderColor: Colors.border for ghost
}
```

### Input
```ts
{
  backgroundColor: Colors.background,
  borderWidth: 1,
  borderColor: Colors.border,
  borderRadius: Radius.md,
  padding: Spacing.md,
  fontSize: Typography.size.md,
  color: Colors.textPrimary,
}
// Focus state: borderColor: Colors.primary
```

### Badge / Chip
```ts
{
  backgroundColor: Colors.primaryLight,
  borderRadius: Radius.full,
  paddingVertical: Spacing.xs,
  paddingHorizontal: Spacing.sm,
  color: Colors.primary,
  fontSize: Typography.size.xs,
  fontWeight: Typography.weight.semibold,
}
```

---

## Screen Layout

```
StatusBar (light)
├── Header (if applicable)
│   ├── Title (textPrimary, xxl, bold)
│   └── Action button (top right)
├── ScrollView / FlatList
│   └── Content with Spacing.md horizontal padding
└── FAB (Floating Action Button) — green, bottom right, for create actions
```

- Screen background: `Colors.background` (off-white, not pure white)
- Horizontal padding on all screens: `Spacing.md` (16)

---

## Flashcard Flip Animation

- Use `react-native-reanimated` for the 3D flip
- Front: white card with question text
- Back: light green background (`Colors.primaryLight`) with answer text
- Card has `Radius.xl` and `Shadow.lg`
- Tap anywhere on card to flip

---

## Empty States

Every list screen needs an empty state:
- Centered illustration (simple SVG or emoji)
- Short message in `textSecondary`
- CTA button in green

---

## Icons

Use `@expo/vector-icons` with `Ionicons` set. Keep consistent:
- Add: `add-circle` or `add`
- Delete: `trash-outline`
- Edit: `pencil-outline`
- Complete: `checkmark-circle`
- Reminder: `alarm-outline`
- Flashcard: `layers-outline`
- Home: `home`
- Todo: `checkbox-outline`
