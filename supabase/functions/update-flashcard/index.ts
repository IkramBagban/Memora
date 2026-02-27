import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { UpdateFlashcardSchema } from '../../../packages/shared/validators/flashcard.validators.ts';
import { verifyAuth } from '../_shared/auth.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { error, success, toHttpError } from '../_shared/response.ts';
import { validateBody } from '../_shared/validate.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const userId = await verifyAuth(req);
    const payload = await validateBody(req, UpdateFlashcardSchema);

    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    const { data: card, error: fetchError } = await supabase.from('flashcards').select('*').eq('id', payload.id).single();
    if (fetchError || !card) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Card not found' };
    }

    if (card.user_id !== userId) {
      throw { status: 403, code: 'FORBIDDEN', message: 'Access denied' };
    }

    const { data: updated, error: updateError } = await supabase
      .from('flashcards')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', payload.id)
      .select('*')
      .single();

    if (updateError) {
      throw { status: 500, code: 'DB_ERROR', message: updateError.message };
    }

    return success(updated);
  } catch (err: unknown) {
    const parsed = toHttpError(err);
    return error(parsed.code, parsed.message, parsed.status);
  }
});
