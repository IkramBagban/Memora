DROP INDEX IF EXISTS todos_due_date_idx;

ALTER TABLE public.todos
DROP COLUMN IF EXISTS due_date;
