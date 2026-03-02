import { createClient } from 'npm:@supabase/supabase-js@2';
import { CreateTodoSchema } from '../../../packages/shared/validators/todo.validators.ts';
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

const serializeRecurrence = (value: unknown): string | null | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  return JSON.stringify(value);
};

const parseRecurrence = (value: unknown): unknown => {
  if (!value) {
    return null;
  }

  if (typeof value !== 'string') {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const userId = await verifyAuth(req);
    const body = await validateBody(req, CreateTodoSchema);
    const insertPayload = {
      ...body,
      recurrence: serializeRecurrence(body.recurrence),
      user_id: userId,
    };

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: todo, error: dbError } = await supabase
      .from('todos')
      .insert(insertPayload)
      .select('*')
      .single();

    if (dbError) {
      throw { status: 500, code: 'DB_ERROR', message: dbError.message };
    }

    return success({
      ...todo,
      recurrence: parseRecurrence(todo.recurrence),
    }, 201);
  } catch (err: unknown) {
    const appError = parseError(err);
    return error(appError.code, appError.message, appError.status);
  }
});
