CREATE TABLE IF NOT EXISTS public.todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  reminder_at TIMESTAMPTZ,
  reminder_channel TEXT CHECK (reminder_channel IN ('push', 'email', 'both')) DEFAULT 'push',
  reminder_sent BOOLEAN NOT NULL DEFAULT FALSE,
  recurrence TEXT,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only access their own todos" ON public.todos;
CREATE POLICY "Users can only access their own todos"
  ON public.todos FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS todos_user_id_idx ON public.todos(user_id);
CREATE INDEX IF NOT EXISTS todos_due_date_idx ON public.todos(due_date);
CREATE INDEX IF NOT EXISTS todos_reminder_at_idx ON public.todos(reminder_at);

CREATE OR REPLACE FUNCTION public.set_todos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_todos_updated_at ON public.todos;
CREATE TRIGGER trigger_set_todos_updated_at
BEFORE UPDATE ON public.todos
FOR EACH ROW
EXECUTE FUNCTION public.set_todos_updated_at();

CREATE EXTENSION IF NOT EXISTS "pg_net";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('send-todo-reminders')
    WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-todo-reminders');
  END IF;
END
$$;

SELECT cron.schedule(
  'send-todo-reminders',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := CONCAT(current_setting('app.settings.supabase_url'), '/functions/v1/send-notification'),
    headers := jsonb_build_object(
      'Authorization', CONCAT('Bearer ', current_setting('app.settings.service_role_key')),
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'user_id', user_id,
      'type', 'todo_reminder',
      'channel', 'email',
      'payload', jsonb_build_object(
        'title', title,
        'body', COALESCE(description, 'You have a reminder'),
        'data', jsonb_build_object('todoId', id)
      )
    )
  )
  FROM public.todos
  WHERE reminder_at <= NOW()
    AND reminder_sent = FALSE
    AND is_completed = FALSE
    AND reminder_channel IN ('email', 'both');

  UPDATE public.todos
  SET reminder_sent = TRUE
  WHERE reminder_at <= NOW()
    AND reminder_sent = FALSE
    AND is_completed = FALSE
    AND reminder_channel IN ('email', 'both');
  $$
);
