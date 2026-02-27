import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Typography, Radius, Shadow } from '@memora/shared';
import { useFlashcardStore } from '../../stores/flashcard.store';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FlashcardsScreen() {
  const { decks } = useFlashcardStore();
  const totalDue = decks.reduce((sum, d) => sum + d.due_count, 0);

  const renderDeck = ({ item }) => (
    <TouchableOpacity style={styles.card}>
      <View style={[styles.colorStrip, { backgroundColor: item.color }]} />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.deckTitle}>{item.title}</Text>
          {item.due_count > 0 && (
            <View style={styles.dueBadge}>
              <Text style={styles.dueBadgeText}>{item.due_count} due</Text>
            </View>
          )}
        </View>
        {item.description && (
          <Text style={styles.deckDescription} numberOfLines={1}>{item.description}</Text>
        )}
        <View style={styles.cardFooter}>
          <Text style={styles.cardCount}>{item.card_count} cards total</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Flashcards</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {totalDue > 0 && (
        <View style={styles.summaryBanner}>
          <Ionicons name="flame" size={20} color={Colors.warning} />
          <Text style={styles.summaryText}>{totalDue} cards due today</Text>
        </View>
      )}

      <FlatList
        data={decks}
        keyExtractor={item => item.id}
        renderItem={renderDeck}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="layers-outline" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>No decks yet</Text>
            <Text style={styles.emptyDesc}>Create your first deck to start learning.</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab}>
        <Ionicons name="add" size={32} color={Colors.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    paddingTop: Spacing.lg,
  },
  title: {
    fontSize: Typography.size.xxxl,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  addButton: {
    padding: Spacing.xs,
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.full,
  },
  summaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
  summaryText: {
    marginLeft: Spacing.sm,
    color: Colors.primaryDark,
    fontWeight: Typography.weight.semibold,
    fontSize: Typography.size.md,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl * 2,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    overflow: 'hidden',
    ...Shadow.sm,
  },
  colorStrip: {
    width: 8,
  },
  cardContent: {
    flex: 1,
    padding: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  deckTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
    flex: 1,
  },
  dueBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    marginLeft: Spacing.sm,
  },
  dueBadgeText: {
    color: Colors.primaryDark,
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
  },
  deckDescription: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  cardFooter: {
    flexDirection: 'row',
  },
  cardCount: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
    marginTop: Spacing.xxl,
  },
  emptyTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  emptyDesc: {
    fontSize: Typography.size.md,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.md,
    backgroundColor: Colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.lg,
  }
});
