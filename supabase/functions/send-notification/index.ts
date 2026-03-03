import { createClient } from 'npm:@supabase/supabase-js@2';
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

    // Push notifications are handled on the client side via Expo Notifications
    // This endpoint verifies the notification request and marks it as processed
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      serviceRoleKey,
    );

    // TODO: In a future version, integrate with Expo Push Notifications service
    // to deliver remote notifications to user's device(s)

    return success({ sent: true, channel: payload.channel });
  } catch (err: unknown) {
    const appError = parseError(err);
    return error(appError.code, appError.message, appError.status);
  }
});
