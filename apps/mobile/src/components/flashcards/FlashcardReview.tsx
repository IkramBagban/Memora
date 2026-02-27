import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Colors, Radius, Shadow, Spacing, Typography, type Flashcard, type ReviewRating } from '@memora/shared';
import { RatingButtons } from './RatingButtons';

interface FlashcardReviewProps {
  card: Flashcard;
  progress: string;
  onRate: (rating: ReviewRating) => void;
}

export function FlashcardReview({ card, progress, onRate }: FlashcardReviewProps) {
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
      <Text style={styles.progress}>{progress}</Text>
      <Pressable onPress={() => {
          const next = isRevealed ? 0 : 1;
          setIsRevealed(!isRevealed);
          flipped.value = withSpring(next);
        }} style={styles.cardWrap}>
        <Animated.View style={[styles.card, styles.front, frontStyle]}>
          <Text style={styles.text}>{card.front}</Text>
          <Text style={styles.hint}>Tap to reveal answer</Text>
        </Animated.View>
        <Animated.View style={[styles.card, styles.back, backStyle]}>
          <Text style={styles.text}>{card.back}</Text>
        </Animated.View>
      </Pressable>
      {isRevealed ? <RatingButtons card={card} onRate={onRate} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  progress: {
    alignSelf: 'flex-end',
    color: Colors.textSecondary,
    fontSize: Typography.size.sm,
  },
  cardWrap: {
    width: '100%',
    height: 360,
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    justifyContent: 'center',
    ...Shadow.md,
    backfaceVisibility: 'hidden',
  },
  front: {
    backgroundColor: Colors.white,
  },
  back: {
    backgroundColor: Colors.primaryLight,
  },
  text: {
    color: Colors.textPrimary,
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.semibold,
    textAlign: 'center',
  },
  hint: {
    marginTop: Spacing.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
