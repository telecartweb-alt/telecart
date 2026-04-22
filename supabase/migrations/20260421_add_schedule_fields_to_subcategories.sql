ALTER TABLE public.subcategories
ADD COLUMN schedule_link TEXT,
ADD COLUMN show_schedule_in_separate_tab BOOLEAN NOT NULL DEFAULT false;
