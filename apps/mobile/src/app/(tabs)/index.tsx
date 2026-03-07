import { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Colors, Spacing, Typography, Radius, Shadow } from '@memora/shared';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHome } from '@/hooks/useHome';

export default function HomeScreen() {
  const router = useRouter();
  const { greeting, todayLabel, totalDue, todayTodos, reviewDecks, currentStreak, isSummaryLoading, refreshHome } = useHome();

  useFocusEffect(
    useCallback(() => {
      void refreshHome();
    }, [refreshHome]),
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.date}>{todayLabel}</Text>
          </View>
          <TouchableOpacity
            accessibilityLabel="Open profile settings"
            onPress={() => router.push('/profile')}
            style={styles.profileButton}
          >
            <Ionicons color={Colors.textPrimary} name="person-circle-outline" size={Typography.size.xxxl} />
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <Text style={styles.heroTitle}>🧠 Today&apos;s Focus</Text>
          </View>
          {totalDue === 0 && todayTodos.length === 0 ? (
            <Text style={styles.heroText}>You&apos;re all caught up! 🎉</Text>
          ) : (
            <>
              <Text style={styles.heroText}>{totalDue} flashcards to review</Text>
              <Text style={styles.heroText}>{todayTodos.length} reminders today</Text>
            </>
          )}

          <TouchableOpacity style={styles.startButton} onPress={() => router.push('/flashcards/review')}>
            <Text style={styles.startButtonText}>Start Review</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Due Today</Text>
            <TouchableOpacity onPress={() => router.push('/todos')}>
              <Text style={styles.seeAllText}>See all →</Text>
            </TouchableOpacity>
          </View>

          {todayTodos.slice(0, 3).map((todo) => (
            <View key={todo.id} style={styles.miniTodoCard}>
              <Ionicons name="ellipse-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.miniTodoText} numberOfLines={1}>{todo.title}</Text>
              {todo.priority === 'high' ? <View style={styles.priorityDot} /> : null}
            </View>
          ))}
          {todayTodos.length === 0 ? <Text style={styles.emptyText}>No reminders today! 🎉</Text> : null}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Review Queue</Text>
            <TouchableOpacity onPress={() => router.push('/flashcards')}>
              <Text style={styles.seeAllText}>See all →</Text>
            </TouchableOpacity>
          </View>

          {reviewDecks.map((deck) => (
            <View key={deck.id} style={styles.miniDeckCard}>
              <View style={[styles.deckColorStrip, { backgroundColor: deck.color }]} />
              <Text style={styles.miniDeckTitle}>{deck.title}</Text>
              <View style={styles.dueBadge}>
                <Text style={styles.dueBadgeText}>{deck.due_count} due</Text>
              </View>
            </View>
          ))}
          {reviewDecks.length === 0 ? <Text style={styles.emptyText}>All caught up on flashcards! 🎉</Text> : null}
        </View>

        <View style={styles.streakCard}>
          <View style={styles.streakHeader}>
            <Text style={styles.sectionTitle}>Your Streak</Text>
            {isSummaryLoading ? <ActivityIndicator color={Colors.primaryDark} size="small" /> : null}
          </View>
          <Text style={styles.streakCount}>🔥 {currentStreak} day{currentStreak === 1 ? '' : 's'}</Text>
          <Text style={styles.streakHint}>Review at least one flashcard today to keep it alive.</Text>
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
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  profileButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xs,
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
    width: Spacing.sm,
    height: Spacing.sm,
    borderRadius: Radius.full,
    marginLeft: Spacing.sm,
    backgroundColor: Colors.priorityHigh,
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
  },
  streakCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  streakHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  streakCount: {
    fontSize: Typography.size.xl,
    color: Colors.textPrimary,
    fontWeight: Typography.weight.bold,
    marginBottom: Spacing.xs,
  },
  streakHint: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },
});
