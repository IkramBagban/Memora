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
