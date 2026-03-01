import type {
  CreateDeckPayload,
  CreateFlashcardPayload,
  Deck,
  DeletePayload,
  DueFlashcard,
  Flashcard,
  ReviewFlashcardResult,
  ReviewRating,
  UpdateDeckPayload,
  UpdateFlashcardPayload,
} from '@memora/shared';
import type { FunctionInvokeOptions } from '@supabase/supabase-js';
import { invokeSupabaseFunction } from '@/lib/supabase';

interface Envelope<T> {
  success: boolean;
  data: T;
  error?: { code: string; message: string };
}

async function invoke<T>(name: string, options?: FunctionInvokeOptions): Promise<T> {
  const { data, error } = await invokeSupabaseFunction(name, options);

  if (error) {
    throw new Error(error.message);
  }

  const parsed = data as Envelope<T>;
  if (!parsed.success) {
    throw new Error(parsed.error?.message ?? 'Unknown error');
  }

  return parsed.data;
}

export const flashcardService = {
  getDecks: () => invoke<Deck[]>('get-flashcard-decks', { method: 'GET' }),
  createDeck: (payload: CreateDeckPayload) => invoke<Deck>('create-flashcard-deck', { body: payload }),
  updateDeck: (payload: UpdateDeckPayload) => invoke<Deck>('update-flashcard-deck', { body: payload, method: 'PATCH' }),
  deleteDeck: (payload: DeletePayload) => invoke<{ deleted: boolean }>('delete-flashcard-deck', { body: payload, method: 'DELETE' }),
  createCard: (payload: CreateFlashcardPayload) => invoke<Flashcard>('create-flashcard', { body: payload }),
  updateCard: (payload: UpdateFlashcardPayload) => invoke<Flashcard>('update-flashcard', { body: payload, method: 'PATCH' }),
  deleteCard: (payload: DeletePayload) => invoke<{ deleted: boolean }>('delete-flashcard', { body: payload, method: 'DELETE' }),
  getDueCards: (deckId?: string) => invoke<DueFlashcard[]>(`get-due-flashcards${deckId ? `?deck_id=${deckId}` : ''}`, { method: 'GET' }),
  reviewCard: (id: string, rating: ReviewRating) => invoke<ReviewFlashcardResult>('review-flashcard', { body: { id, rating } }),
};
