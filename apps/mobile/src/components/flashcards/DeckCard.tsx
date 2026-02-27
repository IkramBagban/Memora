import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Radius, Shadow, Spacing, Typography, type Deck } from '@memora/shared';

interface DeckCardProps {
  deck: Deck;
  onPress: () => void;
  onLongPress: () => void;
}

export function DeckCard({ deck, onPress, onLongPress }: DeckCardProps) {
  return (
    <Pressable style={styles.card} onPress={onPress} onLongPress={onLongPress}>
      <View style={[styles.colorStrip, { backgroundColor: deck.color }]} />
      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={styles.title}>{deck.title}</Text>
          {deck.due_count > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{deck.due_count} due</Text>
            </View>
          ) : null}
        </View>
        {deck.description ? <Text style={styles.description} numberOfLines={1}>{deck.description}</Text> : null}
        <Text style={styles.meta}>{deck.card_count} cards</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    ...Shadow.sm,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  colorStrip: {
    width: Spacing.xs,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
  },
  badge: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  badgeText: {
    color: Colors.primaryDark,
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
  },
  description: {
    marginTop: Spacing.xs,
    color: Colors.textSecondary,
    fontSize: Typography.size.sm,
  },
  meta: {
    marginTop: Spacing.sm,
    color: Colors.textSecondary,
    fontSize: Typography.size.xs,
  },
});
