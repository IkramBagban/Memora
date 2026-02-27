import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function verifyAuth(req: Request): Promise<string> {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');

  if (!token) {
    throw { status: 401, code: 'UNAUTHORIZED', message: 'Missing token' };
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    throw { status: 401, code: 'UNAUTHORIZED', message: 'Invalid token' };
  }

  return user.id;
}
