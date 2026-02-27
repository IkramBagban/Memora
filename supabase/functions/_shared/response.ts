import { corsHeaders } from './cors.ts';

export function success<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify({ success: true, data }), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

export function error(code: string, message: string, status = 500): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: { code, message },
    }),
    {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    },
  );
}

export interface HttpError {
  status?: number;
  code?: string;
  message?: string;
}

export function toHttpError(err: unknown): Required<HttpError> {
  if (typeof err === 'object' && err !== null) {
    const value = err as HttpError;
    return {
      status: value.status ?? 500,
      code: value.code ?? 'INTERNAL_ERROR',
      message: value.message ?? 'Unknown error',
    };
  }

  return {
    status: 500,
    code: 'INTERNAL_ERROR',
    message: 'Unknown error',
  };
}
