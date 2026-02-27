import { create } from 'zustand';
import type {
  CreateDeckPayload,
  CreateFlashcardPayload,
  Deck,
  DueFlashcard,
  Flashcard,
  ReviewRating,
  UpdateDeckPayload,
  UpdateFlashcardPayload,
} from '@memora/shared';
import { Alert } from 'react-native';
import { flashcardService } from '@/services/flashcard.service';

interface FlashcardStore {
  decks: Deck[];
  deckCards: Flashcard[];
  dueCards: DueFlashcard[];
  isLoading: boolean;
  error: string | null;
  fetchDecks: () => Promise<void>;
  fetchDueCards: (deckId?: string) => Promise<void>;
  fetchDeckCards: (deckId: string) => Promise<void>;
  createDeck: (payload: CreateDeckPayload) => Promise<void>;
  updateDeck: (payload: UpdateDeckPayload) => Promise<void>;
  deleteDeck: (id: string) => Promise<void>;
  createCard: (payload: CreateFlashcardPayload) => Promise<void>;
  updateCard: (payload: UpdateFlashcardPayload) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  reviewCard: (id: string, rating: ReviewRating) => Promise<void>;
}

function handleError(message: string): void {
  Alert.alert('Error', message);
}

export const useFlashcardStore = create<FlashcardStore>((set, get) => ({
  decks: [],
  deckCards: [],
  dueCards: [],
  isLoading: false,
  error: null,
  async fetchDecks() {
    set({ isLoading: true, error: null });
    try {
      const decks = await flashcardService.getDecks();
      set({ decks });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load decks';
      set({ error: message });
      handleError(message);
    } finally {
      set({ isLoading: false });
    }
  },
  async fetchDueCards(deckId) {
    set({ isLoading: true, error: null });
    try {
      const dueCards = await flashcardService.getDueCards(deckId);
      set({ dueCards });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load due cards';
      set({ error: message });
      handleError(message);
    } finally {
      set({ isLoading: false });
    }
  },
  async fetchDeckCards(deckId) {
    set({ isLoading: true, error: null });
    try {
      const dueCards = await flashcardService.getDueCards(deckId);
      const cards: Flashcard[] = dueCards.map((card) => ({
        ...card,
        user_id: '',
        created_at: card.due,
        updated_at: card.due,
      }));
      set({ deckCards: cards });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load cards';
      set({ error: message });
      handleError(message);
    } finally {
      set({ isLoading: false });
    }
  },
  async createDeck(payload) {
    const optimisticDeck: Deck = {
      id: `temp-${Date.now()}`,
      user_id: 'optimistic',
      title: payload.title,
      description: payload.description ?? null,
      color: payload.color ?? '#22C55E',
      card_count: 0,
      due_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    set((state) => ({ decks: [optimisticDeck, ...state.decks] }));

    try {
      const created = await flashcardService.createDeck(payload);
      set((state) => ({ decks: state.decks.map((deck) => (deck.id === optimisticDeck.id ? created : deck)) }));
    } catch (error: unknown) {
      set((state) => ({ decks: state.decks.filter((deck) => deck.id !== optimisticDeck.id) }));
      handleError(error instanceof Error ? error.message : 'Failed to create deck');
    }
  },
  async updateDeck(payload) {
    try {
      const updated = await flashcardService.updateDeck(payload);
      set((state) => ({ decks: state.decks.map((deck) => (deck.id === updated.id ? { ...deck, ...updated } : deck)) }));
    } catch (error: unknown) {
      handleError(error instanceof Error ? error.message : 'Failed to update deck');
    }
  },
  async deleteDeck(id) {
    const existing = get().decks;
    set((state) => ({ decks: state.decks.filter((deck) => deck.id !== id) }));
    try {
      await flashcardService.deleteDeck({ id });
    } catch (error: unknown) {
      set({ decks: existing });
      handleError(error instanceof Error ? error.message : 'Failed to delete deck');
    }
  },
  async createCard(payload) {
    try {
      await flashcardService.createCard(payload);
      await get().fetchDecks();
      await get().fetchDeckCards(payload.deck_id);
    } catch (error: unknown) {
      handleError(error instanceof Error ? error.message : 'Failed to create card');
    }
  },
  async updateCard(payload) {
    try {
      const updated = await flashcardService.updateCard(payload);
      set((state) => ({ deckCards: state.deckCards.map((card) => (card.id === updated.id ? updated : card)) }));
    } catch (error: unknown) {
      handleError(error instanceof Error ? error.message : 'Failed to update card');
    }
  },
  async deleteCard(id) {
    const existing = get().deckCards;
    set((state) => ({ deckCards: state.deckCards.filter((card) => card.id !== id) }));
    try {
      await flashcardService.deleteCard({ id });
      await get().fetchDecks();
    } catch (error: unknown) {
      set({ deckCards: existing });
      handleError(error instanceof Error ? error.message : 'Failed to delete card');
    }
  },
  async reviewCard(id, rating) {
    try {
      await flashcardService.reviewCard(id, rating);
      set((state) => ({ dueCards: state.dueCards.filter((card) => card.id !== id) }));
    } catch (error: unknown) {
      handleError(error instanceof Error ? error.message : 'Failed to submit review');
    }
  },
}));
