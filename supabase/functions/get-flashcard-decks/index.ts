import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { verifyAuth } from '../_shared/auth.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { error, success, toHttpError } from '../_shared/response.ts';

interface DeckRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  color: string;
  created_at: string;
  updated_at: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const userId = await verifyAuth(req);
    const now = new Date().toISOString();

    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    const { data: decks, error: deckError } = await supabase
      .from('flashcard_decks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (deckError) {
      throw { status: 500, code: 'DB_ERROR', message: deckError.message };
    }

    const deckIds = (decks ?? []).map((deck) => deck.id);

    const { data: cardCounts, error: countError } = await supabase
      .from('flashcards')
      .select('deck_id, id')
      .eq('user_id', userId)
      .in('deck_id', deckIds.length > 0 ? deckIds : ['00000000-0000-0000-0000-000000000000']);

    if (countError) {
      throw { status: 500, code: 'DB_ERROR', message: countError.message };
    }

    const { data: dueCards, error: dueError } = await supabase
      .from('flashcards')
      .select('deck_id, id')
      .eq('user_id', userId)
      .lte('due', now)
      .in('deck_id', deckIds.length > 0 ? deckIds : ['00000000-0000-0000-0000-000000000000']);

    if (dueError) {
      throw { status: 500, code: 'DB_ERROR', message: dueError.message };
    }

    const cardMap = new Map<string, number>();
    const dueMap = new Map<string, number>();

    for (const card of cardCounts ?? []) {
      cardMap.set(card.deck_id, (cardMap.get(card.deck_id) ?? 0) + 1);
    }

    for (const card of dueCards ?? []) {
      dueMap.set(card.deck_id, (dueMap.get(card.deck_id) ?? 0) + 1);
    }

    const enriched = (decks ?? []).map((deck: DeckRow) => ({
      ...deck,
      card_count: cardMap.get(deck.id) ?? 0,
      due_count: dueMap.get(deck.id) ?? 0,
    }));

    return success(enriched);
  } catch (err: unknown) {
    const parsed = toHttpError(err);
    return error(parsed.code, parsed.message, parsed.status);
  }
});
