import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  Colors,
  Radius,
  Spacing,
  Typography,
  previewRatings,
  type Flashcard,
  type ReviewRating,
} from "@memora/shared";

interface RatingButtonsProps {
  card: Flashcard;
  onRate: (rating: ReviewRating) => void;
}

const labels: Record<ReviewRating, string> = {
  1: "Again",
  2: "Hard",
  3: "Good",
  4: "Easy",
};

const colors: Record<ReviewRating, string> = {
  1: Colors.error,
  2: Colors.warning,
  3: Colors.success,
  4: Colors.info,
};

export function RatingButtons({ card, onRate }: RatingButtonsProps) {
  const previews = previewRatings(card);

  return (
    <View style={styles.row}>
      {previews.map((preview) => (
        <Pressable
          key={preview.rating}
          style={[styles.button, { backgroundColor: colors[preview.rating] }]}
          onPress={() => onRate(preview.rating)}
        >
          <Text style={styles.label}>{labels[preview.rating]}</Text>
          <Text style={styles.hint}>{preview.days}d</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: Spacing.sm,
    width: "100%",
    marginTop: Spacing.xs,
  },
  button: {
    flex: 1,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    minHeight: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: Colors.white,
    fontWeight: Typography.weight.semibold,
    fontSize: Typography.size.md,
  },
  hint: {
    color: Colors.white,
    fontSize: Typography.size.xs,
  },
});
