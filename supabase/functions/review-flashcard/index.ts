import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { fsrs, generatorParameters, Rating } from 'npm:ts-fsrs';
import { ReviewFlashcardSchema } from '../../../packages/shared/validators/flashcard.validators.ts';
import { verifyAuth } from '../_shared/auth.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { error, success, toHttpError } from '../_shared/response.ts';
import { validateBody } from '../_shared/validate.ts';

const ratingMap = {
  1: Rating.Again,
  2: Rating.Hard,
  3: Rating.Good,
  4: Rating.Easy,
} as const;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const userId = await verifyAuth(req);
    const { id, rating } = await validateBody(req, ReviewFlashcardSchema);

    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    const { data: card, error: fetchError } = await supabase.from('flashcards').select('*').eq('id', id).single();

    if (fetchError || !card) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Card not found' };
    }

    if (card.user_id !== userId) {
      throw { status: 403, code: 'FORBIDDEN', message: 'Access denied' };
    }

    const scheduler = fsrs(generatorParameters({ enable_fuzz: true }));
    const schedulingCards = scheduler.repeat(
      {
        due: new Date(card.due),
        stability: card.stability,
        difficulty: card.difficulty,
        elapsed_days: card.elapsed_days,
        scheduled_days: card.scheduled_days,
        reps: card.reps,
        lapses: card.lapses,
        state: card.state,
        last_review: card.last_review ? new Date(card.last_review) : undefined,
      },
      new Date(),
    );

    const result = schedulingCards[ratingMap[rating]];

    const { data: updated, error: updateError } = await supabase
      .from('flashcards')
      .update({
        due: result.card.due.toISOString(),
        stability: result.card.stability,
        difficulty: result.card.difficulty,
        elapsed_days: result.card.elapsed_days,
        scheduled_days: result.card.scheduled_days,
        reps: result.card.reps,
        lapses: result.card.lapses,
        state: result.card.state,
        last_review: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (updateError || !updated) {
      throw { status: 500, code: 'DB_ERROR', message: updateError?.message ?? 'Unable to update card' };
    }

    return success({
      id: updated.id,
      due: updated.due,
      state: updated.state,
      scheduled_days: updated.scheduled_days,
      stability: updated.stability,
      difficulty: updated.difficulty,
      reps: updated.reps,
      lapses: updated.lapses,
    });
  } catch (err: unknown) {
    const parsed = toHttpError(err);
    return error(parsed.code, parsed.message, parsed.status);
  }
});
