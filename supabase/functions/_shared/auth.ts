import { createClient } from 'npm:@supabase/supabase-js@2';

interface AuthenticatedUser {
  id: string;
}

export const verifyAuth = async (req: Request): Promise<string> => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw { status: 401, code: 'UNAUTHORIZED', message: 'Missing authorization header' };
  }

  const token = authHeader.replace('Bearer ', '').trim();
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');

  if (!supabaseUrl || !anonKey) {
    throw { status: 500, code: 'CONFIG_ERROR', message: 'Missing Supabase environment configuration' };
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw { status: 401, code: 'UNAUTHORIZED', message: 'Invalid token' };
  }

  return (data.user as AuthenticatedUser).id;
};
