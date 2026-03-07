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
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius, Shadow, Spacing, Typography } from "@memora/shared";
import { SafeAreaView } from "react-native-safe-area-context";
import { DeckCard } from "@/components/flashcards/DeckCard";
import { useFlashcards } from "@/hooks/useFlashcards";

const deckColors = [
  Colors.primary,
  Colors.accentBlue,
  Colors.warning,
  Colors.error,
  Colors.accentPurple,
  Colors.accentTeal,
];

export default function FlashcardsScreen() {
  const router = useRouter();
  const { decks, fetchDecks, createDeck, deleteDeck } = useFlashcards();
  const [isModalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState(deckColors[0]);

  useFocusEffect(
    useCallback(() => {
      void fetchDecks();
    }, [fetchDecks]),
  );

  const dueCount = useMemo(
    () => decks.reduce((sum, deck) => sum + deck.due_count, 0),
    [decks],
  );
  const deckCount = decks.length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Flashcards</Text>
          <Text style={styles.subtitle}>
            {deckCount} {deckCount === 1 ? "deck" : "decks"} · {dueCount} due today
          </Text>
        </View>
        <Pressable
          accessibilityLabel="Create deck"
          onPress={() => setModalOpen(true)}
          style={styles.addButton}
        >
          <Ionicons name="add" size={24} color={Colors.primaryDark} />
        </Pressable>
      </View>

      {dueCount > 0 ? (
        <Pressable
          accessibilityLabel="Start flashcard review"
          onPress={() => router.push("/flashcards/review")}
          style={styles.banner}
        >
          <Ionicons color={Colors.primaryDark} name="sparkles-outline" size={16} />
          <Text style={styles.bannerText}>{dueCount} cards due today</Text>
          <Ionicons color={Colors.primaryDark} name="arrow-forward" size={16} />
        </Pressable>
      ) : null}

      <FlatList
        data={decks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons color={Colors.textSecondary} name="albums-outline" size={48} />
            <Text style={styles.emptyTitle}>No decks yet</Text>
            <Text style={styles.emptyDescription}>
              Create your first deck to start reviewing with spaced repetition.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <DeckCard
            deck={item}
            onPress={() => router.push(`/flashcards/${item.id}`)}
            onLongPress={() => {
              Alert.alert(item.title, "Choose an action", [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: () => void deleteDeck(item.id),
                },
              ]);
            }}
          />
        )}
      />

      <Pressable accessibilityLabel="Create deck" style={styles.fab} onPress={() => setModalOpen(true)}>
        <Ionicons name="add" size={28} color={Colors.white} />
      </Pressable>

      <Modal visible={isModalOpen} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setModalOpen(false)}>
          <Pressable style={styles.sheet}>
            <Text style={styles.modalTitle}>Create Deck</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Deck title"
              style={styles.input}
            />
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Description"
              style={[styles.input, styles.multiline]}
              multiline
            />
            <View style={styles.colorRow}>
              {deckColors.map((color) => (
                <Pressable
                  key={color}
                  style={[
                    styles.color,
                    { backgroundColor: color },
                    selectedColor === color ? styles.colorSelected : null,
                  ]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>
            <Pressable
              style={styles.saveButton}
              onPress={() => {
                if (!title.trim()) return;
                void createDeck({
                  title: title.trim(),
                  description: description.trim() || undefined,
                  color: selectedColor,
                });
                setTitle("");
                setDescription("");
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: Typography.size.xxl,
    fontWeight: Typography.weight.bold,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: Typography.size.sm,
    marginTop: Spacing.xs,
  },
  addButton: {
    padding: Spacing.xs,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryLight,
  },
  banner: {
    alignItems: "center",
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.full,
    flexDirection: "row",
    gap: Spacing.xs,
    justifyContent: "center",
    marginHorizontal: Spacing.md,
    padding: Spacing.sm,
  },
  bannerText: {
    color: Colors.primaryDark,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    textAlign: "center",
  },
  content: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxl * 2 + Spacing.xl,
    paddingTop: Spacing.sm,
  },
  emptyState: {
    alignItems: "center",
    marginTop: Spacing.xxl,
    paddingHorizontal: Spacing.xxl,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
    marginTop: Spacing.md,
  },
  emptyDescription: {
    color: Colors.textSecondary,
    fontSize: Typography.size.md,
    marginTop: Spacing.xs,
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    right: Spacing.md,
    bottom: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...Shadow.lg,
  },
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
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
  },
  input: {
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    color: Colors.textPrimary,
  },
  multiline: { minHeight: 100, textAlignVertical: "top" },
  colorRow: { flexDirection: "row", gap: Spacing.sm },
  color: { width: 32, height: 32, borderRadius: Radius.full },
  colorSelected: { borderWidth: 2, borderColor: Colors.textPrimary },
  saveButton: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: Spacing.sm,
    alignItems: "center",
  },
  saveLabel: { color: Colors.white, fontWeight: Typography.weight.semibold },
});
