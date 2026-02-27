import { useMemo } from 'react';
import { useFlashcardStore } from '@/stores/flashcard.store';

export function useFlashcards() {
  return useFlashcardStore();
}

export function useDueCount(): number {
  const decks = useFlashcardStore((state) => state.decks);

  return useMemo(() => decks.reduce((sum, deck) => sum + deck.due_count, 0), [decks]);
}
