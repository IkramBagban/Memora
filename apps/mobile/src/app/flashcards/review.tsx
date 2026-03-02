import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Radius, Spacing, Typography } from '@memora/shared';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FlashcardReview } from '@/components/flashcards/FlashcardReview';
import { useFlashcards } from '@/hooks/useFlashcards';

export default function ReviewScreen() {
  const router = useRouter();
  const { deckId } = useLocalSearchParams<{ deckId?: string }>();
  const { dueCards, fetchDueCards, reviewCard, fetchDecks } = useFlashcards();
  const [index, setIndex] = useState(0);
  const [againCount, setAgainCount] = useState(0);

  useEffect(() => {
    void fetchDueCards(deckId);
  }, [deckId, fetchDueCards]);

  const current = dueCards[index];
  const done = dueCards.length > 0 && index >= dueCards.length;
  const reviewedCount = useMemo(() => Math.min(index, dueCards.length), [index, dueCards.length]);

  if (done) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.completeTitle}>Session complete! 🎉</Text>
        <Text style={styles.completeMeta}>Cards reviewed: {reviewedCount}</Text>
        <Text style={styles.completeMeta}>Again ratings: {againCount}</Text>
        <Pressable style={styles.button} onPress={() => setIndex(0)}><Text style={styles.buttonLabel}>Review Again</Text></Pressable>
        <Pressable style={styles.button} onPress={() => { void fetchDecks(); router.back(); }}><Text style={styles.buttonLabel}>Done</Text></Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={20} color={Colors.primary} />
          <Text style={styles.back}>Back</Text>
        </Pressable>
        <Text style={styles.title}>Review Session</Text>
        <View style={styles.headerSpacer} />
      </View>
      {current ? (
        <FlashcardReview
          card={{ ...current, user_id: '', created_at: current.due, updated_at: current.due }}
          progress={`${index + 1} / ${dueCards.length}`}
          onRate={(rating) => {
            if (rating === 1) setAgainCount((value) => value + 1);
            void reviewCard(current.id, rating);
            setIndex((value) => value + 1);
          }}
        />
      ) : (
        <Text style={styles.empty}>No cards due right now.</Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    minWidth: 72,
  },
  back: { color: Colors.primary, fontWeight: Typography.weight.semibold },
  title: { color: Colors.textPrimary, fontSize: Typography.size.xxl, fontWeight: Typography.weight.bold },
  headerSpacer: { minWidth: 72 },
  empty: { color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xl },
  completeTitle: { color: Colors.textPrimary, fontSize: Typography.size.xxl, fontWeight: Typography.weight.bold, marginTop: Spacing.xl },
  completeMeta: { color: Colors.textSecondary, fontSize: Typography.size.md, marginTop: Spacing.sm },
  button: { marginTop: Spacing.md, backgroundColor: Colors.primary, padding: Spacing.sm, borderRadius: Radius.full, alignItems: 'center' },
  buttonLabel: { color: Colors.white, fontWeight: Typography.weight.semibold },
});
