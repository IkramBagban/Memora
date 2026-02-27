import { z } from 'zod';

export const ReviewRatingSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
]);

export const CreateDeckSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional().default('#22C55E'),
});

export const UpdateDeckSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
});

export const CreateFlashcardSchema = z.object({
  deck_id: z.string().uuid(),
  front: z.string().min(1).max(1000),
  back: z.string().min(1).max(1000),
});

export const UpdateFlashcardSchema = z.object({
  id: z.string().uuid(),
  front: z.string().min(1).max(1000).optional(),
  back: z.string().min(1).max(1000).optional(),
});

export const ReviewFlashcardSchema = z.object({
  id: z.string().uuid(),
  rating: ReviewRatingSchema,
});

export const DeleteSchema = z.object({
  id: z.string().uuid(),
});
