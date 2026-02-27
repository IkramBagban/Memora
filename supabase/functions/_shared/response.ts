import { corsHeaders } from './cors.ts';

export const success = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify({ success: true, data }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

export const error = (code: string, message: string, status = 400): Response =>
  new Response(JSON.stringify({ success: false, error: { code, message } }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
