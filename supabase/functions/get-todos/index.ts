import { createClient } from 'npm:@supabase/supabase-js@2';
import { GetTodosQuerySchema } from '../../../packages/shared/validators/todo.validators.ts';
import { verifyAuth } from '../_shared/auth.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { error, success } from '../_shared/response.ts';

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
    const url = new URL(req.url);
    const rawQuery = Object.fromEntries(url.searchParams);
    const query = GetTodosQuerySchema.parse(rawQuery);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    let dbQuery = supabase.from('todos').select('*').eq('user_id', userId).order('created_at', { ascending: false });

    if (query.is_completed !== undefined) {
      dbQuery = dbQuery.eq('is_completed', query.is_completed);
    }
    if (query.priority) {
      dbQuery = dbQuery.eq('priority', query.priority);
    }
    if (query.due_today) {
      const today = new Date().toISOString().split('T')[0];
      dbQuery = dbQuery.eq('due_date', today);
    }

    const { data: todos, error: dbError } = await dbQuery;

    if (dbError) {
      throw { status: 500, code: 'DB_ERROR', message: dbError.message };
    }

    return success(todos);
  } catch (err: unknown) {
    const appError = parseError(err);
    return error(appError.code, appError.message, appError.status);
  }
});
