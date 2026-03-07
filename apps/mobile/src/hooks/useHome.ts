import { useCallback, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useAuthStore } from '@/stores/auth.store';
import { useFlashcardStore } from '@/stores/flashcard.store';
import { useTodoStore } from '@/stores/todo.store';
import { homeService } from '@/services/home.service';
import { isToday } from 'date-fns';

const HOME_SUMMARY_STALE_MS = 60_000;

function getGreeting(name: string): string {
  const hour = new Date().getHours();

  if (hour < 12) {
    return `Good morning, ${name} 👋`;
  }

  if (hour < 17) {
    return `Good afternoon, ${name} 👋`;
  }

  return `Good evening, ${name} 👋`;
}

function getFirstNameFromEmail(email?: string): string {
  if (!email) {
    return 'there';
  }

  const [localPart] = email.split('@');
  if (!localPart) {
    return 'there';
  }

  return `${localPart[0].toUpperCase()}${localPart.slice(1)}`;
}

function normalizeDisplayName(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getPreferredName(user: ReturnType<typeof useAuthStore.getState>['user']): string {
  const displayName = normalizeDisplayName(user?.user_metadata?.display_name);
  if (displayName) {
    return displayName;
  }

  const fullName = normalizeDisplayName(user?.user_metadata?.full_name);
  if (fullName) {
    return fullName;
  }

  return getFirstNameFromEmail(user?.email);
}

export function useHome() {
  const { user } = useAuthStore();
  const { decks, fetchDecks } = useFlashcardStore();
  const { todos, fetchTodos } = useTodoStore();

  const [isSummaryLoading, setSummaryLoading] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [lastSummaryFetchedAt, setLastSummaryFetchedAt] = useState<number | null>(null);

  const totalDue = useMemo(() => decks.reduce((sum, deck) => sum + deck.due_count, 0), [decks]);
  const reviewDecks = useMemo(() => decks.filter((deck) => deck.due_count > 0), [decks]);
  const todayTodos = useMemo(
    () => todos.filter((todo) => !todo.is_completed && todo.reminder_at && isToday(new Date(todo.reminder_at))),
    [todos],
  );

  const greeting = useMemo(() => getGreeting(getPreferredName(user)), [user]);
  const todayLabel = useMemo(
    () => new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' }),
    [],
  );

  const refreshHome = useCallback(async (force = false) => {
    try {
      const isSummaryFresh = Boolean(lastSummaryFetchedAt && Date.now() - lastSummaryFetchedAt < HOME_SUMMARY_STALE_MS);

      setSummaryLoading(true);
      await Promise.all([fetchDecks(force), fetchTodos(force)]);

      if (force || !isSummaryFresh) {
        const summary = await homeService.getSummary();
        setCurrentStreak(summary.current_streak);
        setLastSummaryFetchedAt(Date.now());
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to refresh home';
      Alert.alert('Error', message);
    } finally {
      setSummaryLoading(false);
    }
  }, [fetchDecks, fetchTodos, lastSummaryFetchedAt]);

  return {
    greeting,
    todayLabel,
    totalDue,
    todayTodos,
    reviewDecks,
    currentStreak,
    isSummaryLoading,
    refreshHome,
  };
}
