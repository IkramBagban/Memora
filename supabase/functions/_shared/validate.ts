import type { ZodSchema } from 'npm:zod';

export async function validateBody<T>(req: Request, schema: ZodSchema<T>): Promise<T> {
  const body = await req.json();
  const result = schema.safeParse(body);

  if (!result.success) {
    throw {
      status: 400,
      code: 'VALIDATION_ERROR',
      message: result.error.issues[0]?.message ?? 'Invalid request body',
    };
  }

  return result.data;
}
