ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS show_overview_section BOOLEAN NOT NULL DEFAULT true;
