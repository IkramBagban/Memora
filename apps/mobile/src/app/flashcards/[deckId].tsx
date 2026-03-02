import { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import {
  Colors,
  Radius,
  Shadow,
  Spacing,
  Typography,
  type Flashcard,
} from "@memora/shared";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFlashcards } from "@/hooks/useFlashcards";
import { MarkdownText } from "@/components/ui/MarkdownText";

export default function DeckDetailScreen() {
  const router = useRouter();
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  const { decks, deckCards, fetchDeckCards, createCard } = useFlashcards();
  const [isModalOpen, setModalOpen] = useState(false);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");

  useFocusEffect(
    useCallback(() => {
      if (deckId) {
        void fetchDeckCards(deckId);
      }
    }, [deckId, fetchDeckCards]),
  );

  const deck = useMemo(
    () => decks.find((item) => item.id === deckId),
    [decks, deckId],
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={20} color={Colors.primary} />
          <Text style={styles.link}>Back</Text>
        </Pressable>
        <Text style={styles.title}>{deck?.title ?? "Deck"}</Text>
        <View style={styles.spacer} />
      </View>

      {deck?.description ? (
        <Text style={styles.description}>{deck.description}</Text>
      ) : null}
      <Text style={styles.meta}>
        {deck?.card_count ?? 0} cards · {deck?.due_count ?? 0} due today
      </Text>

      {(deck?.due_count ?? 0) > 0 ? (
        <Pressable
          style={styles.reviewButton}
          onPress={() => router.push(`/flashcards/review?deckId=${deckId}`)}
        >
          <Text style={styles.reviewLabel}>Start Review</Text>
        </Pressable>
      ) : null}

      <FlatList
        data={deckCards}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListEmptyComponent={
          <Text style={styles.empty}>No cards yet. Add your first card.</Text>
        }
        renderItem={({ item }) => <CardItem card={item} />}
      />

      <Pressable style={styles.fab} onPress={() => setModalOpen(true)}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>

      <Modal visible={isModalOpen} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setModalOpen(false)}>
          <Pressable style={styles.sheet}>
            <Text style={styles.modalTitle}>Add Card</Text>
            <TextInput
              value={front}
              onChangeText={setFront}
              placeholder="Front"
              style={[styles.input, styles.multiline]}
              multiline
            />
            <TextInput
              value={back}
              onChangeText={setBack}
              placeholder="Back"
              style={[styles.input, styles.multiline]}
              multiline
            />
            <Pressable
              style={styles.saveButton}
              onPress={() => {
                if (!deckId || !front.trim() || !back.trim()) {
                  return;
                }
                void createCard({
                  deck_id: deckId,
                  front: front.trim(),
                  back: back.trim(),
                });
                setFront("");
                setBack("");
                setModalOpen(false);
              }}
            >
              <Text style={styles.saveLabel}>Save</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

interface CardItemProps {
  card: Flashcard;
}

function CardItem({ card }: CardItemProps) {
  const label =
    card.state === 0
      ? "New"
      : card.state === 1
        ? "Learning"
        : card.state === 2
          ? "Review"
          : "Relearning";

  return (
    <View style={styles.cardItem}>
      <View style={styles.cardTitleWrap}>
        <MarkdownText content={card.front} numberOfLines={2} />
      </View>
      <View style={styles.stateBadge}>
        <Text style={styles.stateText}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    minWidth: 72,
  },
  link: {
    color: Colors.primary,
    fontWeight: Typography.weight.semibold,
    fontSize: Typography.size.md,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
  },
  spacer: { width: 40 },
  description: {
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.size.md,
  },
  meta: {
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.xs,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
  reviewButton: {
    margin: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: Spacing.md,
    alignItems: "center",
    ...Shadow.sm,
  },
  reviewLabel: {
    color: Colors.white,
    fontWeight: Typography.weight.bold,
    fontSize: Typography.size.lg,
  },
  content: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxl * 2 + Spacing.xl,
    paddingTop: Spacing.sm,
  },
  empty: {
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: Spacing.xl,
  },
  cardItem: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "transparent",
  },
  cardTitleWrap: { flex: 1, marginRight: Spacing.md },
  stateBadge: {
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  stateText: {
    color: Colors.primaryDark,
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
  },
  fab: {
    position: "absolute",
    right: Spacing.md,
    bottom: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    ...Shadow.lg,
  },
  fabText: { color: Colors.white, fontSize: Typography.size.xxl },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: Colors.overlay,
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    color: Colors.textPrimary,
  },
  multiline: { minHeight: 100, textAlignVertical: "top" },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: Spacing.sm,
    alignItems: "center",
  },
  saveLabel: { color: Colors.white, fontWeight: Typography.weight.semibold },
});
