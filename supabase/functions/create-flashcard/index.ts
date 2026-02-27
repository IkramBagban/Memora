import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createEmptyCard } from 'npm:ts-fsrs';
import { CreateFlashcardSchema } from '../../../packages/shared/validators/flashcard.validators.ts';
import { verifyAuth } from '../_shared/auth.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { error, success, toHttpError } from '../_shared/response.ts';
import { validateBody } from '../_shared/validate.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const userId = await verifyAuth(req);
    const payload = await validateBody(req, CreateFlashcardSchema);

    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    const { data: deck, error: deckError } = await supabase.from('flashcard_decks').select('id, user_id').eq('id', payload.deck_id).single();
    if (deckError || !deck) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Deck not found' };
    }

    if (deck.user_id !== userId) {
      throw { status: 403, code: 'FORBIDDEN', message: 'Access denied' };
    }

    const emptyCard = createEmptyCard();

    const { data, error: dbError } = await supabase
      .from('flashcards')
      .insert({
        ...payload,
        user_id: userId,
        due: emptyCard.due.toISOString(),
        stability: emptyCard.stability,
        difficulty: emptyCard.difficulty,
        elapsed_days: emptyCard.elapsed_days,
        scheduled_days: emptyCard.scheduled_days,
        reps: emptyCard.reps,
        lapses: emptyCard.lapses,
        state: emptyCard.state,
        last_review: emptyCard.last_review,
      })
      .select('*')
      .single();

    if (dbError) {
      throw { status: 500, code: 'DB_ERROR', message: dbError.message };
    }

    return success(data, 201);
  } catch (err: unknown) {
    const parsed = toHttpError(err);
    return error(parsed.code, parsed.message, parsed.status);
  }
});
