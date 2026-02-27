import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Typography, Radius, Shadow } from '@memora/shared';
import { useFlashcardStore } from '../../stores/flashcard.store';
import { useTodoStore } from '../../stores/todo.store';
import { isToday } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { decks } = useFlashcardStore();
  const { todos } = useTodoStore();

  const totalDue = decks.reduce((sum, d) => sum + d.due_count, 0);
  const todayTodos = todos.filter(t => !t.is_completed && t.due_date && isToday(new Date(t.due_date)));

  const firstName = 'User'; // Hardcoded for mockup
  
  const hour = new Date().getHours();
  let greeting = 'Good evening';
  if (hour < 12) greeting = 'Good morning';
  else if (hour < 17) greeting = 'Good afternoon';

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>{greeting}, {firstName} 👋</Text>
          <Text style={styles.date}>{todayStr}</Text>
        </View>

        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <Text style={styles.heroTitle}>🧠 Today&apos;s Focus</Text>
          </View>
          <Text style={styles.heroText}>
            {totalDue} flashcards to review
          </Text>
          <Text style={styles.heroText}>
            {todayTodos.length} todos due today
          </Text>
          
          <TouchableOpacity style={styles.startButton}>
            <Text style={styles.startButtonText}>Start Review</Text>
          </TouchableOpacity>
        </View>

        {/* Today's Todos Preview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Due Today</Text>
            <TouchableOpacity><Text style={styles.seeAllText}>See all →</Text></TouchableOpacity>
          </View>
          
          {todayTodos.slice(0, 3).map(todo => (
            <View key={todo.id} style={styles.miniTodoCard}>
              <Ionicons name="ellipse-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.miniTodoText} numberOfLines={1}>{todo.title}</Text>
              {todo.priority === 'high' && (
                <View style={[styles.priorityDot, { backgroundColor: Colors.priorityHigh }]} />
              )}
            </View>
          ))}
          {todayTodos.length === 0 && (
            <Text style={styles.emptyText}>No todos due today! 🎉</Text>
          )}
        </View>

        {/* Decks Preview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Review Queue</Text>
            <TouchableOpacity><Text style={styles.seeAllText}>See all →</Text></TouchableOpacity>
          </View>

          {decks.filter(d => d.due_count > 0).map(deck => (
            <View key={deck.id} style={styles.miniDeckCard}>
              <View style={[styles.deckColorStrip, { backgroundColor: deck.color }]} />
              <Text style={styles.miniDeckTitle}>{deck.title}</Text>
              <View style={styles.dueBadge}>
                <Text style={styles.dueBadgeText}>{deck.due_count} due</Text>
              </View>
            </View>
          ))}
          {decks.filter(d => d.due_count > 0).length === 0 && (
            <Text style={styles.emptyText}>All caught up on flashcards! 🎉</Text>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  header: {
    marginBottom: Spacing.xl,
    marginTop: Spacing.md,
  },
  greeting: {
    fontSize: Typography.size.xxl,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  date: {
    fontSize: Typography.size.md,
    color: Colors.textSecondary,
    fontWeight: Typography.weight.medium,
  },
  heroCard: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.md,
    marginBottom: Spacing.xl,
  },
  heroHeader: {
    marginBottom: Spacing.md,
  },
  heroTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: Colors.textInverse,
  },
  heroText: {
    fontSize: Typography.size.md,
    color: Colors.textInverse,
    marginBottom: Spacing.xs,
    opacity: 0.9,
  },
  startButton: {
    backgroundColor: Colors.white,
    borderRadius: Radius.full,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    alignSelf: 'flex-start',
    marginTop: Spacing.md,
  },
  startButtonText: {
    color: Colors.primaryDark,
    fontWeight: Typography.weight.bold,
    fontSize: Typography.size.sm,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
  },
  seeAllText: {
    fontSize: Typography.size.sm,
    color: Colors.primary,
    fontWeight: Typography.weight.semibold,
  },
  miniTodoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  miniTodoText: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: Spacing.sm,
  },
  miniDeckCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  deckColorStrip: {
    width: 6,
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  miniDeckTitle: {
    flex: 1,
    padding: Spacing.md,
    paddingLeft: Spacing.xl,
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.medium,
    color: Colors.textPrimary,
  },
  dueBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    marginRight: Spacing.md,
  },
  dueBadgeText: {
    color: Colors.primaryDark,
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: Typography.size.sm,
    fontStyle: 'italic',
    marginTop: Spacing.xs,
  }
});
