export const Colors = {
  // Primary
  primary: "#22C55E", // Green — main brand color
  primaryLight: "#DCFCE7", // Light green — backgrounds, chips
  primaryDark: "#16A34A", // Dark green — pressed state

  // Neutrals
  white: "#FFFFFF",
  background: "#F9FAFB", // App background (off-white)
  surface: "#FFFFFF", // Card/panel background
  border: "#E5E7EB", // Subtle borders

  // Text
  textPrimary: "#111827", // Main text
  textSecondary: "#6B7280", // Subtext, placeholders
  textInverse: "#FFFFFF", // Text on green backgrounds

  // Semantic
  success: "#22C55E",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",
  overlay: "rgba(17, 24, 39, 0.4)",

  // Deck palette
  accentBlue: "#3B82F6",
  accentPurple: "#A855F7",
  accentTeal: "#14B8A6",

  // Priority colors (for todos)
  priorityLow: "#6B7280",
  priorityMedium: "#F59E0B",
  priorityHigh: "#EF4444",
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999, // pill shape
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

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
    regular: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
  },
  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

export const Shadow = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;

export const Animation = {
  fast: 150,
  normal: 250,
  slow: 400,
} as const;
