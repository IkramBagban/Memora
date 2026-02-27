import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { verifyAuth } from '../_shared/auth.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { error, success, toHttpError } from '../_shared/response.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const userId = await verifyAuth(req);
    const url = new URL(req.url);
    const deckId = url.searchParams.get('deck_id');

    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    let query = supabase
      .from('flashcards')
      .select('*, flashcard_decks(title)')
      .eq('user_id', userId)
      .lte('due', new Date().toISOString())
      .order('due', { ascending: true })
      .limit(20);

    if (deckId) {
      query = query.eq('deck_id', deckId);
    }

    const { data, error: dbError } = await query;

    if (dbError) {
      throw { status: 500, code: 'DB_ERROR', message: dbError.message };
    }

    const dueCards = (data ?? []).map((card) => ({
      ...card,
      deck_title: card.flashcard_decks?.title ?? '',
    }));

    return success(dueCards);
  } catch (err: unknown) {
    const parsed = toHttpError(err);
    return error(parsed.code, parsed.message, parsed.status);
  }
});
