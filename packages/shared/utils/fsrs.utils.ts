import { fsrs, generatorParameters, Rating } from 'ts-fsrs';
import type { Flashcard, ReviewRating } from '../types/flashcard.types';

export interface RatingPreview {
  rating: ReviewRating;
  days: number;
  due: string;
}

const ratingMap: Record<ReviewRating, Exclude<Rating, Rating.Manual>> = {
  1: Rating.Again,
  2: Rating.Hard,
  3: Rating.Good,
  4: Rating.Easy,
};

const reviewRatings: ReviewRating[] = [1, 2, 3, 4];

export function previewRatings(card: Pick<Flashcard, 'due' | 'stability' | 'difficulty' | 'elapsed_days' | 'scheduled_days' | 'reps' | 'lapses' | 'state' | 'last_review'>): RatingPreview[] {
  const scheduler = fsrs(generatorParameters({ enable_fuzz: true }));

  const fsrsCard = {
    due: new Date(card.due),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    last_review: card.last_review ? new Date(card.last_review) : undefined,
  };

  const now = new Date();
  const scheduled = scheduler.repeat(fsrsCard, now);

  return reviewRatings.map((rating) => {
    const fsrsRating = ratingMap[rating];
    const result = scheduled[fsrsRating];

    return {
      rating,
      days: result.card.scheduled_days,
      due: result.card.due.toISOString(),
    };
  });
}
