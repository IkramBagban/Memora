import { createClient } from 'npm:@supabase/supabase-js@2';
import { DeleteTodoSchema } from '../../../packages/shared/validators/todo.validators.ts';
import { verifyAuth } from '../_shared/auth.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { error, success } from '../_shared/response.ts';
import { validateBody } from '../_shared/validate.ts';

const parseError = (err: unknown): { status: number; code: string; message: string } => {
  if (err && typeof err === 'object' && 'status' in err && 'code' in err && 'message' in err) {
    const shapedError = err as { status: number; code: string; message: string };
    return shapedError;
  }
  return { status: 500, code: 'INTERNAL_ERROR', message: 'Unknown error' };
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const userId = await verifyAuth(req);
    const { id } = await validateBody(req, DeleteTodoSchema);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { error: dbError, count } = await supabase
      .from('todos')
      .delete({ count: 'exact' })
      .eq('id', id)
      .eq('user_id', userId);

    if (dbError) {
      throw { status: 500, code: 'DB_ERROR', message: dbError.message };
    }

    if (count === 0) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Todo not found' };
    }

    return success({ deleted: true });
  } catch (err: unknown) {
    const appError = parseError(err);
    return error(appError.code, appError.message, appError.status);
  }
});
