export type CardState = 0 | 1 | 2 | 3;
export type ReviewRating = 1 | 2 | 3 | 4;

export interface Deck {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  color: string;
  card_count: number;
  due_count: number;
  created_at: string;
  updated_at: string;
}

export interface Flashcard {
  id: string;
  deck_id: string;
  user_id: string;
  front: string;
  back: string;
  due: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  state: CardState;
  last_review: string | null;
  created_at: string;
  updated_at: string;
}

export interface DueFlashcard {
  id: string;
  deck_id: string;
  deck_title: string;
  front: string;
  back: string;
  due: string;
  state: CardState;
  reps: number;
  lapses: number;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  last_review: string | null;
}

export interface CreateDeckPayload {
  title: string;
  description?: string;
  color?: string;
}

export interface UpdateDeckPayload {
  id: string;
  title?: string;
  description?: string | null;
  color?: string;
}

export interface CreateFlashcardPayload {
  deck_id: string;
  front: string;
  back: string;
}

export interface UpdateFlashcardPayload {
  id: string;
  front?: string;
  back?: string;
}

export interface DeletePayload {
  id: string;
}

export interface ReviewFlashcardPayload {
  id: string;
  rating: ReviewRating;
}

export interface ReviewFlashcardResult {
  id: string;
  due: string;
  state: CardState;
  scheduled_days: number;
  stability: number;
  difficulty: number;
  reps: number;
  lapses: number;
}
