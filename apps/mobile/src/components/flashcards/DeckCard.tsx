import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  Colors,
  Radius,
  Shadow,
  Spacing,
  Typography,
  type Deck,
} from "@memora/shared";

interface DeckCardProps {
  deck: Deck;
  onPress: () => void;
  onLongPress: () => void;
}

export function DeckCard({ deck, onPress, onLongPress }: DeckCardProps) {
  const dueLabel =
    deck.due_count > 0
      ? `${deck.due_count} ${deck.due_count === 1 ? "card" : "cards"} due today`
      : "No cards due today";

  return (
    <Pressable
      accessibilityLabel={`Open deck ${deck.title}`}
      onLongPress={onLongPress}
      onPress={onPress}
      style={styles.card}
    >
      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={styles.title}>{deck.title}</Text>
          {deck.due_count > 0 ? (
            <View
              style={[styles.badge, { backgroundColor: deck.color + "20" }]}
            >
              <Text style={[styles.badgeText, { color: deck.color }]}>
                {deck.due_count} due
              </Text>
            </View>
          ) : null}
        </View>
        {deck.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {deck.description}
          </Text>
        ) : null}
        <Text style={styles.dueMeta}>{dueLabel}</Text>
        <View style={styles.footerRow}>
          <Text style={styles.meta}>
            {deck.card_count} {deck.card_count === 1 ? "card" : "cards"}
          </Text>
          <View style={[styles.colorDot, { backgroundColor: deck.color }]} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    ...Shadow.sm,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: "transparent",
  },
  content: {
    padding: Spacing.lg,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
  title: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.semibold,
  },
  badge: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
  },
  description: {
    marginTop: Spacing.sm,
    color: Colors.textSecondary,
    fontSize: Typography.size.md,
    lineHeight: Typography.size.md * 1.5,
  },
  dueMeta: {
    color: Colors.primaryDark,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    marginTop: Spacing.sm,
  },
  footerRow: {
    marginTop: Spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  meta: {
    color: Colors.textSecondary,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: Radius.full,
  },
});
