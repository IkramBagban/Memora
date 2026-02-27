import { createClient } from 'npm:@supabase/supabase-js@2';
import { verifyAuth } from '../_shared/auth.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { error, success, toHttpError } from '../_shared/response.ts';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function toDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getCurrentStreak(reviewDays: string[]): number {
  if (reviewDays.length === 0) {
    return 0;
  }

  const reviewSet = new Set(reviewDays);
  let streak = 0;
  let cursor = new Date();

  while (reviewSet.has(toDateKey(cursor))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - DAY_IN_MS);
  }

  return streak;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const userId = await verifyAuth(req);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const today = toDateKey(new Date());

    const { count: completedTodosToday, error: todoCountError } = await supabase
      .from('todos')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_completed', true)
      .gte('updated_at', `${today}T00:00:00.000Z`)
      .lt('updated_at', `${today}T23:59:59.999Z`);

    if (todoCountError) {
      throw { status: 500, code: 'DB_ERROR', message: todoCountError.message };
    }

    const { count: reviewedCardsToday, error: reviewedCardsError } = await supabase
      .from('flashcards')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('last_review', `${today}T00:00:00.000Z`)
      .lt('last_review', `${today}T23:59:59.999Z`);

    if (reviewedCardsError) {
      throw { status: 500, code: 'DB_ERROR', message: reviewedCardsError.message };
    }

    const { data: reviewedDayRows, error: reviewedDayError } = await supabase
      .from('flashcards')
      .select('last_review')
      .eq('user_id', userId)
      .not('last_review', 'is', null)
      .order('last_review', { ascending: false })
      .limit(365);

    if (reviewedDayError) {
      throw { status: 500, code: 'DB_ERROR', message: reviewedDayError.message };
    }

    const reviewDays = Array.from(
      new Set(
        (reviewedDayRows ?? [])
          .map((row) => row.last_review)
          .filter((value): value is string => typeof value === 'string')
          .map((value) => value.split('T')[0]),
      ),
    );

    return success({
      current_streak: getCurrentStreak(reviewDays),
      completed_todos_today: completedTodosToday ?? 0,
      reviewed_cards_today: reviewedCardsToday ?? 0,
    });
  } catch (err: unknown) {
    const appError = toHttpError(err);
    return error(appError.code, appError.message, appError.status);
  }
});
