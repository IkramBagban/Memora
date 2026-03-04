import { useCallback, useMemo, useState } from "react";
import {
  Alert,
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
  const { decks, deckCards, fetchDeckCards, createCard, updateCard, deleteCard } = useFlashcards();
  const [isModalOpen, setModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [editFront, setEditFront] = useState("");
  const [editBack, setEditBack] = useState("");

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

  const handleEditCard = useCallback((card: Flashcard) => {
    setEditingCard(card);
    setEditFront(card.front);
    setEditBack(card.back);
    setEditModalOpen(true);
  }, []);

  const handleDeleteCard = useCallback((card: Flashcard) => {
    Alert.alert(
      "Delete Card",
      "Are you sure you want to delete this card?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void deleteCard(card.id);
          },
        },
      ],
    );
  }, [deleteCard]);

  const handleSaveEdit = useCallback(() => {
    if (!editingCard || !editFront.trim() || !editBack.trim()) {
      return;
    }
    void updateCard({
      id: editingCard.id,
      front: editFront.trim(),
      back: editBack.trim(),
    });
    setEditModalOpen(false);
    setEditingCard(null);
    setEditFront("");
    setEditBack("");
  }, [editingCard, editFront, editBack, updateCard]);

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
        renderItem={({ item }) => (
          <CardItem
            card={item}
            onEdit={handleEditCard}
            onDelete={handleDeleteCard}
          />
        )}
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

      <Modal visible={isEditModalOpen} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setEditModalOpen(false)}>
          <Pressable style={styles.sheet}>
            <Text style={styles.modalTitle}>Edit Card</Text>
            <TextInput
              value={editFront}
              onChangeText={setEditFront}
              placeholder="Front"
              style={[styles.input, styles.multiline]}
              multiline
            />
            <TextInput
              value={editBack}
              onChangeText={setEditBack}
              placeholder="Back"
              style={[styles.input, styles.multiline]}
              multiline
            />
            <Pressable style={styles.saveButton} onPress={handleSaveEdit}>
              <Text style={styles.saveLabel}>Save Changes</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

interface CardItemProps {
  card: Flashcard;
  onEdit: (card: Flashcard) => void;
  onDelete: (card: Flashcard) => void;
}

function CardItem({ card, onEdit, onDelete }: CardItemProps) {
  const label =
    card.state === 0
      ? "New"
      : card.state === 1
        ? "Learning"
        : card.state === 2
          ? "Review"
          : "Relearning";

  return (
    <Pressable
      style={styles.cardItem}
      onPress={() => onEdit(card)}
      onLongPress={() => onDelete(card)}
    >
      <View style={styles.cardTitleWrap}>
        <MarkdownText content={card.front} numberOfLines={2} />
      </View>
      <View style={styles.stateBadge}>
        <Text style={styles.stateText}>{label}</Text>
      </View>
    </Pressable>
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
