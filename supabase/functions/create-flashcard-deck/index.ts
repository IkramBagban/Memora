import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { CreateDeckSchema } from '../../../packages/shared/validators/flashcard.validators.ts';
import { verifyAuth } from '../_shared/auth.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { error, success, toHttpError } from '../_shared/response.ts';
import { validateBody } from '../_shared/validate.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const userId = await verifyAuth(req);
    const payload = await validateBody(req, CreateDeckSchema);

    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    const { data, error: dbError } = await supabase.from('flashcard_decks').insert({ ...payload, user_id: userId }).select('*').single();

    if (dbError) {
      throw { status: 500, code: 'DB_ERROR', message: dbError.message };
    }

    return success(data, 201);
  } catch (err: unknown) {
    const parsed = toHttpError(err);
    return error(parsed.code, parsed.message, parsed.status);
  }
});
