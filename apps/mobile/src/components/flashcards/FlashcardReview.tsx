import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import {
  Colors,
  Radius,
  Shadow,
  Spacing,
  Typography,
  type Flashcard,
  type ReviewRating,
} from "@memora/shared";
import { RatingButtons } from "./RatingButtons";
import { MarkdownText } from "@/components/ui/MarkdownText";

interface FlashcardReviewProps {
  card: Flashcard;
  progress: string;
  onRate: (rating: ReviewRating) => void;
}

export function FlashcardReview({
  card,
  progress,
  onRate,
}: FlashcardReviewProps) {
  const flipped = useSharedValue(0);
  const [isRevealed, setIsRevealed] = useState(false);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${flipped.value * 180}deg` }],
    opacity: flipped.value < 0.5 ? 1 : 0,
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${(1 + flipped.value) * 180}deg` }],
    opacity: flipped.value >= 0.5 ? 1 : 0,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.progressRow}>
        <Text style={styles.progress}>{progress}</Text>
      </View>
      <Pressable
        onPress={() => {
          const next = isRevealed ? 0 : 1;
          setIsRevealed(!isRevealed);
          flipped.value = withSpring(next);
        }}
        style={styles.cardWrap}
      >
        <Animated.View style={[styles.card, styles.front, frontStyle]}>
          <View style={styles.cardContent}>
            <MarkdownText content={card.front} variant="title" />
          </View>
          <Text style={styles.hint}>Tap to reveal answer</Text>
        </Animated.View>
        <Animated.View style={[styles.card, styles.back, backStyle]}>
          <View style={styles.cardContent}>
            <MarkdownText content={card.back} />
          </View>
        </Animated.View>
      </Pressable>
      {isRevealed ? <RatingButtons card={card} onRate={onRate} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  progressRow: {
    width: "100%",
    alignItems: "flex-end",
  },
  progress: {
    color: Colors.textSecondary,
    fontSize: Typography.size.sm,
  },
  cardWrap: {
    width: "100%",
    height: 430,
  },
  card: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    justifyContent: "space-between",
    ...Shadow.md,
    backfaceVisibility: "hidden",
  },
  cardContent: {
    flex: 1,
    justifyContent: "center",
  },
  front: {
    backgroundColor: Colors.white,
  },
  back: {
    backgroundColor: Colors.primaryLight,
  },
  hint: {
    marginTop: Spacing.sm,
    color: Colors.textSecondary,
    textAlign: "center",
    fontSize: Typography.size.md,
  },
});
