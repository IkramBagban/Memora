import { createClient } from 'npm:@supabase/supabase-js@2';
import { Resend } from 'npm:resend@4.0.0';
import { SendNotificationSchema } from '../../../packages/shared/validators/todo.validators.ts';
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
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const authHeader = req.headers.get('Authorization');
    if (!serviceRoleKey || !authHeader?.includes(serviceRoleKey)) {
      throw { status: 401, code: 'UNAUTHORIZED', message: 'Internal only endpoint' };
    }

    const payload = SendNotificationSchema.parse(await req.json());

    if (payload.channel !== 'email') {
      return success({ sent: false, skipped: true });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      serviceRoleKey,
    );

    const { data, error: userError } = await supabase.auth.admin.getUserById(payload.user_id);
    if (userError || !data.user?.email) {
      throw { status: 404, code: 'NOT_FOUND', message: 'User not found' };
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw { status: 500, code: 'CONFIG_ERROR', message: 'Missing RESEND_API_KEY' };
    }

    const resend = new Resend(resendApiKey);
    await resend.emails.send({
      from: 'Memora <reminders@yourdomain.com>',
      to: data.user.email,
      subject: `⏰ Reminder: ${payload.payload.title}`,
      html: `<div><h2>Memora Reminder</h2><h3>${payload.payload.title}</h3><p>${payload.payload.body}</p></div>`,
    });

    return success({ sent: true });
  } catch (err: unknown) {
    const appError = parseError(err);
    return error(appError.code, appError.message, appError.status);
  }
});
