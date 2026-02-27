import { create } from 'zustand';
import type { Deck, Flashcard } from '@memora/shared';

interface FlashcardStore {
  decks: Deck[];
  dueCards: Flashcard[];
  isLoading: boolean;
}

export const useFlashcardStore = create<FlashcardStore>((set) => ({
  decks: [
    {
      id: '1',
      user_id: 'user1',
      title: 'Spanish Vocabulary',
      description: 'Common verbs and adjectives',
      color: '#3B82F6',
      card_count: 120,
      due_count: 15,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '2',
      user_id: 'user1',
      title: 'React Native Concepts',
      description: 'Hooks, navigation, and state',
      color: '#22C55E',
      card_count: 45,
      due_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  dueCards: [],
  isLoading: false,
}));
