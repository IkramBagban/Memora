import { createClient } from 'npm:@supabase/supabase-js@2';
import { UpdateTodoSchema } from '../../../packages/shared/validators/todo.validators.ts';
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
    const body = await validateBody(req, UpdateTodoSchema);
    const { id, ...updates } = body;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: existingTodo, error: existingError } = await supabase
      .from('todos')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (existingError || !existingTodo) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Todo not found' };
    }

    if (existingTodo.user_id !== userId) {
      throw { status: 403, code: 'FORBIDDEN', message: 'Access denied' };
    }

    const finalUpdates = {
      ...updates,
      ...(updates.is_completed === true ? { reminder_sent: true } : {}),
      updated_at: new Date().toISOString(),
    };

    const { data: todo, error: dbError } = await supabase
      .from('todos')
      .update(finalUpdates)
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (dbError) {
      throw { status: 500, code: 'DB_ERROR', message: dbError.message };
    }

    return success(todo);
  } catch (err: unknown) {
    const appError = parseError(err);
    return error(appError.code, appError.message, appError.status);
  }
});
