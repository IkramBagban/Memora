import type { ZodSchema } from 'npm:zod@3.25.76';

export const validateBody = async <T>(req: Request, schema: ZodSchema<T>): Promise<T> => {
  const body = await req.json();
  return schema.parse(body);
};
